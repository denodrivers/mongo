import { Bson } from "../../../deps.ts";
import { BufferWriter } from "../../utils/writer.ts";
import { Message, nextRequestId, OP_CODE, writeMsgHeader } from "../message.ts";

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

export class CommandQuery implements Message {
  private namespace: Uint8Array;
  private requestId = nextRequestId();

  constructor(
    ns: string,
    private readonly query: any,
    private readonly options?: CommandQueryOptions
  ) {
    this.namespace = encoder.encode(ns);
  }

  toBin(): Uint8Array {
    let flags = 0;

    const query = Bson.serialize(this.query);

    const buffer = new BufferWriter(
      16 + // Header,
        4 + // Flags
        this.namespace.byteLength +
        1 + // Namespace
        4 + // numberToSkip
        4 + // numberToReturn
        query.byteLength
    );

    writeMsgHeader(buffer, {
      messageLength: buffer.capacity,
      requestId: this.requestId,
      responseTo: 0,
      opCode: OP_CODE.QUERY,
    });

    buffer.writeUint32(flags);
    buffer.writeBuffer(this.namespace);
    buffer.skip(1);
    buffer.writeUint32(this.options?.numberToSkip ?? 0);
    buffer.writeUint32(this.options?.numberToReturn ?? 0);

    buffer.writeBuffer(new Uint8Array(query.buffer));

    return buffer.wroteData;
  }
}
