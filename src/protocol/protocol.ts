import { Document } from "../../deps.ts";
import {
  MongoDriverError,
  MongoErrorInfo,
  MongoServerError,
} from "../error.ts";
import { handshake } from "./handshake.ts";
import { parseHeader } from "./header.ts";
import { deserializeMessage, Message, serializeMessage } from "./message.ts";

type Socket = ReadableStream & WritableStream;
interface CommandTask {
  requestId: number;
  db: string;
  body: Document;
}

let nextRequestId = 0;

export class WireProtocol {
  #socket: Socket;
  #isPendingResponse = false;
  #isPendingRequest = false;
  #pendingResponses: Map<number, {
    promise: Promise<Message>;
    resolve: (value: Message | PromiseLike<Message>) => void;
    // deno-lint-ignore no-explicit-any
    reject: (reason?: any) => void;
  }> = new Map();
  #reader: ReadableStreamBYOBReader;
  #commandQueue: CommandTask[] = [];

  constructor(socket: Socket) {
    this.#socket = socket;
    this.#reader = new ReadableStreamBYOBReader(this.#socket);
  }

  async connect() {
    const { connectionId: _connectionId } = await handshake(this);
  }

  async commandSingle<T = Document>(
    db: string,
    body: Document,
  ): Promise<T> {
    const [doc] = await this.command(db, body);
    if (doc.ok === 0) {
      throw new MongoServerError(doc as MongoErrorInfo);
    }
    return doc as T;
  }

  async command<T = Document>(db: string, body: Document): Promise<T[]> {
    const requestId = nextRequestId++;
    const commandTask = {
      requestId,
      db,
      body,
    };

    this.#commandQueue.push(commandTask);
    this.send();

    const pendingMessage = Promise.withResolvers<Message>();
    this.#pendingResponses.set(requestId, pendingMessage);
    this.receive();
    const message = await pendingMessage.promise;

    let documents: T[] = [];

    for (const section of message?.sections!) {
      if ("document" in section) {
        documents.push(section.document as T);
      } else {
        documents = documents.concat(section.documents as T[]);
      }
    }

    return documents;
  }

  private async send() {
    if (this.#isPendingRequest) return;
    this.#isPendingRequest = true;
    while (this.#commandQueue.length > 0) {
      const task = this.#commandQueue.shift()!;
      const buffer = serializeMessage({
        requestId: task.requestId,
        responseTo: 0,
        sections: [
          {
            document: {
              ...task.body,
              $db: task.db,
            },
          },
        ],
      });

      await ReadableStream.from(buffer).pipeTo(this.#socket);
    }
    this.#isPendingRequest = false;
  }

  private async receive() {
    if (this.#isPendingResponse) return;
    this.#isPendingResponse = true;
    while (this.#pendingResponses.size > 0) {
      const headerBuffer = await this.#reader.read(new Uint8Array(16));
      if (!headerBuffer.value) {
        throw new MongoDriverError("Invalid response header");
      }
      const header = parseHeader(headerBuffer.value);
      const bodyBuffer = await this.#reader.read(
        new Uint8Array(header.messageLength - 16),
      );
      if (!bodyBuffer.value) {
        throw new MongoDriverError("Invalid response body");
      }
      const reply = deserializeMessage(header, bodyBuffer.value);
      const pendingMessage = this.#pendingResponses.get(header.responseTo);
      this.#pendingResponses.delete(header.responseTo);
      pendingMessage?.resolve(reply);
    }
    this.#isPendingResponse = false;
  }
}
