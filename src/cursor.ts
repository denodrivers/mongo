import { WireProtocol } from "./protocol/mod.ts";
import { Document } from "./types.ts";

interface CursorBatch {
  name: string;
  type: "collection" | "view";
}

export interface CursorOptions {
  id: bigint | number;
  db: string;
  collection: string;
  firstBatch: CursorBatch[];
  maxTimeMS?: number;
  comment?: Document;
}

export class Cursor {
  #protocol: WireProtocol;
  #options: CursorOptions;
  #batches: CursorBatch[];

  #pending = false;

  constructor(protocol: WireProtocol, options: CursorOptions) {
    this.#protocol = protocol;
    this.#options = options;
    this.#batches = options.firstBatch;
  }

  async *[Symbol.asyncIterator]() {
    let done = false;
    while (!done) {
      if (this.#batches.length === 0) {
        if (this.#pending === false) {
          this.#pending = true;

          const res = await this.#protocol.command(this.#options.db, {
            getMore: BigInt(this.#options.id),
            collection: this.#options.collection,
          });

          assertOk(res);
          console.log(res);
          this.#done = true;

          this.#requesting = false;
          for (const waiter of this.#waitingForMore) {
            waiter.resolve();
          }
        } else {
          const wait = deferred<void>();
          this.#waitingForMore.push(wait);
          await wait;
        }
      } else {
        yield this.#buffer.shift() as T;
      }
    }
  }
}
