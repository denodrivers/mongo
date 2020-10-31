import { BufferWriter } from "../utils/writer.ts";

export enum OP_CODE {
  REPLAY = 1,
  UPDATE = 2001,
  INSERT = 2002,
  RESERVED = 2003,
  QUERY = 2004,
  GET_MORE = 2005,
  DELETE = 2006,
  KILL_CURSORS = 2007,
  MSG = 2013,
}

let requestId = 0;

export function nextRequestId() {
  return requestId++;
}

export function writeMsgHeader(
  buffer: BufferWriter,
  params: {
    messageLength: number;
    requestId: number;
    responseTo: number;
    opCode: OP_CODE;
  }
) {
  if (buffer.length !== 0) {
    throw new Error("Header information must be written in the head.");
  }
  buffer.writeUint32(params.messageLength);
  buffer.writeUint32(params.requestId);
  buffer.writeUint32(params.responseTo);
  buffer.writeUint32(params.opCode);
}

export interface Message {
  toBin(): Uint8Array;
}
