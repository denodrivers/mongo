import { Bson } from "../deps.ts";
import { Cursor } from "./cursor.ts";
import { WireProtocol } from "./protocol/mod.ts";
import { Document, FindOptions, InsertOptions } from "./types.ts";

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

  async findOne(
    filter?: Document,
    options?: FindOptions,
  ): Promise<T | undefined> {
    const cursor = await this.find(filter, options);
    return await cursor.next();
  }

  async insertOne(doc: Document, options?: InsertOptions) {
    const { insertedIds } = await this.insertMany([doc], options);
    return insertedIds[0];
  }

  async insert(docs: Document | Document[], options?: InsertOptions) {
    docs = Array.isArray(docs) ? docs : [docs];
    return this.insertMany(docs, options);
  }

  async insertMany(
    docs: Document[],
    options?: InsertOptions,
  ): Promise<{ insertedIds: Document; insertedCount: number }> {
    const insertedIds = docs.map((doc) => {
      if (!doc._id) {
        doc._id = new Bson.ObjectID();
      }
      return doc._id;
    });
    const res = await this.#protocol.commandSingle(this.#dbName, {
      insert: this.name,
      documents: docs,
      ordered: options?.ordered ?? true,
      writeConcern: options?.writeConcern,
      bypassDocumentValidation: options?.bypassDocumentValidation,
      comment: options?.comment,
    });
    return {
      insertedIds,
      insertedCount: res.n,
    };
  }
}
