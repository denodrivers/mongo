import { Bson } from "../../deps.ts";
import { CommandCursor, WireProtocol } from "../protocol/mod.ts";
import {
  CountOptions,
  DeleteOptions,
  Document,
  DropOptions,
  FindOptions,
  InsertOptions,
  UpdateOptions,
} from "../types.ts";

export class Collection<T> {
  #protocol: WireProtocol;
  #dbName: string;

  constructor(protocol: WireProtocol, dbName: string, readonly name: string) {
    this.#protocol = protocol;
    this.#dbName = dbName;
  }

  find(filter?: Document, options?: FindOptions): CommandCursor<T> {
    return new CommandCursor<T>(this.#protocol, async () => {
      const { cursor } = await this.#protocol.commandSingle(this.#dbName, {
        find: this.name,
        filter,
        batchSize: 1,
        noCursorTimeout: true,
        ...options,
      });
      return {
        ...cursor,
        id: cursor.id.toString(),
      };
    });
  }

  async findOne(
    filter?: Document,
    options?: FindOptions,
  ): Promise<T | undefined> {
    const cursor = this.find(filter, options);
    return await cursor.next();
  }

  async count(filter?: Document, options?: CountOptions): Promise<number> {
    const res = await this.#protocol.commandSingle(this.#dbName, {
      count: this.name,
      query: filter,
      ...options,
    });
    const { n, ok } = res;
    if (ok === 1) {
      return n;
    } else {
      return 0;
    }
  }

  async insertOne(doc: Document, options?: InsertOptions) {
    const { insertedIds } = await this.insertMany([doc], options);
    return insertedIds[0];
  }

  async insert(docs: Document | Document[], options?: InsertOptions) {
    docs = Array.isArray(docs) ? docs : [docs];
    return this.insertMany(docs as Document[], options);
  }

  async insertMany(
    docs: Document[],
    options?: InsertOptions,
  ): Promise<{ insertedIds: Document[]; insertedCount: number }> {
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

  private async update(updates: Document[]) {
    const { n, nModified, upserted } = await this.#protocol.commandSingle(
      this.#dbName,
      {
        update: this.name,
        updates,
      },
    );
    if (upserted) {
      const upsertedCount = upserted.length;
      const _id = upserted[0]._id;
      const upsertedId = { _id };
      return {
        modifiedCount: n,
        matchedCount: nModified,
        upsertedId,
        upsertedCount,
      };
    }
    return {
      modifiedCount: n,
      matchedCount: nModified,
      upsertedId: null,
    };
  }

  async updateOne(
    filter: Document,
    update: Document,
    options?: UpdateOptions,
  ): Promise<Document> {
    const updates = [
      { q: filter, u: update, upsert: options?.upsert ?? false },
    ];
    return await this.update(updates);
  }

  async updateMany(
    filter: Document,
    update: Document,
    options?: UpdateOptions,
  ): Promise<Document> {
    const updates: any = [
      { q: filter, u: update, multi: true, upsert: options?.upsert ?? false },
    ];
    return await this.update(updates);
  }

  async deleteMany(filter: Document, options?: DeleteOptions): Promise<number> {
    const res = await this.#protocol.commandSingle(this.#dbName, {
      delete: this.name,
      deletes: [
        {
          q: filter,
          limit: options?.limit ?? 0,
          collation: options?.collation,
          hint: options?.hint,
          comment: options?.comment,
        },
      ],
      ordered: options?.ordered ?? true,
      writeConcern: options?.writeConcern,
    });
    return res.n;
  }

  delete = this.deleteMany;

  async deleteOne(filter: Document, options?: DeleteOptions) {
    return this.delete(filter, { ...options, limit: 1 });
  }

  async drop(options?: DropOptions): Promise<void> {
    const res = await this.#protocol.commandSingle(this.#dbName, {
      drop: this.name,
      ...options,
    });
  }
}
