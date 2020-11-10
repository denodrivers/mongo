import { WireProtocol } from "./protocol/mod.ts";
import { Document, FindOptions } from "./types.ts";

export class Collection {
  #protocol: WireProtocol;
  #dbName: string;

  constructor(protocol: WireProtocol, dbName: string, readonly name: string) {
    this.#protocol = protocol;
    this.#dbName = dbName;
  }

  async *find(
    filter: Document,
    options?: FindOptions,
  ): AsyncIterable<Document> {
    const body = await this.#protocol.command(this.#dbName, {
      find: this.name,
      filter,
      batchSize: 1,
      noCursorTimeout: true,
    });

    console.log(body);
  }
}
