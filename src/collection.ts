import { Cursor } from "./cursor.ts";
import { WireProtocol } from "./protocol/mod.ts";
import { Document, FindOptions } from "./types.ts";

export class Collection<T> {
  #protocol: WireProtocol;
  #dbName: string;

  constructor(protocol: WireProtocol, dbName: string, readonly name: string) {
    this.#protocol = protocol;
    this.#dbName = dbName;
  }

  async find(filter?: Document, options?: FindOptions): Promise<Cursor<T>> {
    const { cursor } = await this.#protocol.commandSingle(this.#dbName, {
      find: this.name,
      filter,
      batchSize: 1,
      noCursorTimeout: true,
    });
    return new Cursor(this.#protocol, {
      ...cursor,
      id: cursor.id.toString(),
    });
  }

  async findOne(filter?: Document, options?: FindOptions): Promise<T | void> {
    const cursor = await this.find(filter, options);
    return await cursor.next();
  }
}
