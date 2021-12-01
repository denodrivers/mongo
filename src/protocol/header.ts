export enum OpCode {
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

export interface MessageHeader {
  messageLength: number;
  requestId: number;
  responseTo: number;
  opCode: OpCode;
}

export function setHeader(
  view: DataView,
  header: MessageHeader,
) {
  view.setInt32(0, header.messageLength, true);
  view.setInt32(4, header.requestId, true);
  view.setInt32(8, header.responseTo, true);
  view.setInt32(12, header.opCode, true);
}

export function parseHeader(buffer: Uint8Array): MessageHeader {
  const view = new DataView(buffer.buffer);
  return {
    messageLength: view.getUint32(0, true),
    requestId: view.getUint32(4, true),
    responseTo: view.getUint32(8, true),
    opCode: view.getUint32(12, true),
  };
}
