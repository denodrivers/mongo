import {
  MongoDriverError,
  type MongoErrorInfo,
  MongoServerError,
} from "../error.ts";
import type { Document } from "../types.ts";
import { handshake } from "./handshake.ts";
import { parseHeader } from "./header.ts";
import {
  deserializeMessage,
  type Message,
  serializeMessage,
} from "./message.ts";

interface CommandTask {
  requestId: number;
  db: string;
  body: Document;
}

let nextRequestId = 0;

export class WireProtocol {
  #conn: Deno.Conn;
  #isPendingResponse = false;
  #isPendingRequest = false;
  #pendingResponses: Map<number, {
    promise: Promise<Message>;
    resolve: (value: Message | PromiseLike<Message>) => void;
    // deno-lint-ignore no-explicit-any
    reject: (reason?: any) => void;
  }> = new Map();
  #commandQueue: CommandTask[] = [];

  constructor(socket: Deno.Conn) {
    this.#conn = socket;
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

      const w = this.#conn.writable.getWriter();
      await w.write(buffer);
      w.releaseLock();
    }
    this.#isPendingRequest = false;
  }

  private async receive() {
    if (this.#isPendingResponse) return;
    this.#isPendingResponse = true;
    while (this.#pendingResponses.size > 0) {
      try {
        const headerBuffer = await this.read_socket(16);
        if (!headerBuffer) {
          throw new MongoDriverError("Invalid response header");
        }
        const header = parseHeader(headerBuffer);
        let bodyBytes = header.messageLength - 16;
        if (bodyBytes < 0) bodyBytes = 0;
        const bodyBuffer = await this.read_socket(header.messageLength - 16);
        if (!bodyBuffer) {
          throw new MongoDriverError("Invalid response body");
        }
        const pendingMessage = this.#pendingResponses.get(header.responseTo);
        this.#pendingResponses.delete(header.responseTo);
        try {
          const reply = deserializeMessage(header, bodyBuffer);
          pendingMessage?.resolve(reply);
        } catch (e) {
          pendingMessage?.reject(e);
        }
      } catch (error) {
        // If an error occurred in the above block, we won't be able to know for
        // sure which specific message triggered the error.
        // Though since the state appears to be so broken that we can't even
        // read the header anymore, it's likely that the connection has
        // simply closed.
        // We'll just reject all pending messages so that the user can
        // handle these themselves.
        for (const pendingMessage of this.#pendingResponses.values()) {
          pendingMessage.reject(error);
        }
        this.#pendingResponses.clear();
      }
    }
    this.#isPendingResponse = false;
  }

  private async read_socket(
    b: number,
  ): Promise<Uint8Array | undefined> {
    const reader = this.#conn.readable.getReader({ mode: "byob" });
    const { value } = await reader.read(new Uint8Array(b));
    reader.releaseLock();
    return value;
  }
}
