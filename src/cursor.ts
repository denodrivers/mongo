import { WireProtocol } from "./protocol/mod.ts";
import { Document } from "./types.ts";
import { Bson } from "../deps.ts";
import { parseNamespace } from "./utils/ns.ts";

export interface CursorOptions<T> {
  id: bigint | number | string;
  ns: string;
  firstBatch: T[];
  maxTimeMS?: number;
  comment?: Document;
}

export class Cursor<T> {
  #id: bigint;
  #protocol: WireProtocol;
  #batches: T[];
  #db: string;
  #collection: string;

  constructor(protocol: WireProtocol, options: CursorOptions<T>) {
    this.#protocol = protocol;
    this.#batches = options.firstBatch;
    this.#id = BigInt(options.id);
    const { db, collection } = parseNamespace(options.ns);
    this.#db = db;
    this.#collection = collection;
  }

  async next(): Promise<T | undefined> {
    if (this.#batches.length > 0) {
      return this.#batches.shift();
    }
    if (this.#id === 0n) {
      return undefined;
    }
    const { cursor } = await this.#protocol.commandSingle(this.#db, {
      getMore: Bson.Long.fromBigInt(this.#id),
      collection: this.#collection,
    });
    this.#batches = cursor.nextBatch || [];
    this.#id = BigInt(cursor.id.toString());
    return this.#batches.shift();
  }

  async *[Symbol.asyncIterator]() {
    while (this.#batches.length > 0 || this.#id !== 0n) {
      yield await this.next();
    }
  }
}
