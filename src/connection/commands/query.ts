import { serializeBson } from "../../utils/bson.ts";
import { MessageHeader, OpCode, serializeHeader } from "../message.ts";
import { SequenceWriter, Serializer } from "../util.ts";

// Query flags
const OPTS_TAILABLE_CURSOR = 2;
const OPTS_SLAVE = 4;
const OPTS_OPLOG_REPLAY = 8;
const OPTS_NO_CURSOR_TIMEOUT = 16;
const OPTS_AWAIT_DATA = 32;
const OPTS_EXHAUST = 64;
const OPTS_PARTIAL = 128;

const encoder = new TextEncoder();

export interface CommandQueryOptions {
  numberToSkip?: number;
  numberToReturn?: number;
  // TODO
  returnFieldSelector?: any;
}

export class CommandQuery implements Serializer {
  #namespace: Uint8Array;
  constructor(
    namespace: string,
    private readonly query: any,
    private readonly options?: CommandQueryOptions,
  ) {
    this.#namespace = encoder.encode(`${namespace}\0`);
  }

  serialize(requestId: number): Uint8Array[] {
    let flags = 0;

    const queryBody = serializeBson(this.query);

    const queryHeader = new SequenceWriter(
      4 + // Flags
        this.#namespace.byteLength +
        4 + // numberToSkip
        4, // numberToReturn
    );

    queryHeader
      .writeUint32(flags).writeBuffer(this.#namespace).writeUint32(
        this.options?.numberToSkip ?? 0,
      ).writeUint32(this.options?.numberToReturn ?? 0);

    const header: MessageHeader = {
      messageLength: 16 + queryHeader.buffer.byteLength + queryBody.byteLength,
      requestId,
      responseTo: 0,
      opCode: OpCode.QUERY,
    };

    return [
      serializeHeader(header),
      queryHeader.buffer,
      queryBody,
    ];
  }
}
