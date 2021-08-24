import { Bson } from "../../deps.ts";
import { MongoError } from "../error.ts";
import { WireProtocol } from "../protocol/mod.ts";
import {
  CountOptions,
  CreateIndexOptions,
  DeleteOptions,
  DistinctOptions,
  Document,
  DropIndexOptions,
  DropOptions,
  FilterDocument,
  FindAndModifyOptions,
  FindOptions,
  InsertOptions,
  QueryOperators,
  UpdateOperators,
  UpdateOptions,
} from "../types.ts";
import { AggregateCursor } from "./commands/aggregate.ts";
import { FindCursor } from "./commands/find.ts";
import { ListIndexesCursor } from "./commands/listIndexes.ts";
import { update } from "./commands/update.ts";

export class Collection<T> {
  #protocol: WireProtocol;
  #dbName: string;

  constructor(protocol: WireProtocol, dbName: string, readonly name: string) {
    this.#protocol = protocol;
    this.#dbName = dbName;
  }

  find(
    filter?: FilterDocument<T, QueryOperators>,
    options?: FindOptions<T>,
  ): FindCursor<T> {
    return new FindCursor<T>({
      filter,
      protocol: this.#protocol,
      collectionName: this.name,
      dbName: this.#dbName,
      options: options ?? {},
    });
  }

  async findOne(
    filter?: FilterDocument<T, QueryOperators>,
    options?: FindOptions<T>,
  ): Promise<T | undefined> {
    const cursor = this.find(filter, options);
    return await cursor.next();
  }

  /**
   * Find and modify a document in one, returning the matching document.
   *
   * @param query The query used to match documents
   * @param options Additional options for the operation (e.g. containing update
   * or remove parameters)
   * @returns The document matched and modified
   */
  async findAndModify(
    filter?: FilterDocument<T, QueryOperators>,
    options?: FindAndModifyOptions<T>,
  ): Promise<T | undefined> {
    const result = await this.#protocol.commandSingle<{
      value: T;
      ok: number;
      lastErrorObject: any;
    }>(this.#dbName, {
      findAndModify: this.name,
      query: filter,
      ...options,
    });
    if (result.ok === 0) {
      throw new MongoError("Could not execute findAndModify operation");
    }
    return result.value;
  }

  /**
   * @deprecated Use `countDocuments` or `estimatedDocumentCount` instead
   */
  async count(
    filter?: FilterDocument<T, QueryOperators>,
    options?: CountOptions,
  ): Promise<number> {
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

  async countDocuments(
    filter?: FilterDocument<T, QueryOperators>,
    options?: CountOptions,
  ): Promise<number> {
    const pipeline: Document[] = [];
    if (filter) {
      pipeline.push({ $match: filter });
    }

    if (typeof options?.skip === "number") {
      pipeline.push({ $skip: options.skip });
      delete options.skip;
    }

    if (typeof options?.limit === "number") {
      pipeline.push({ $limit: options.limit });
      delete options.limit;
    }

    pipeline.push({ $group: { _id: 1, n: { $sum: 1 } } });

    const result = await this.aggregate<{ n: number }>(
      pipeline,
      options,
    ).next();
    if (result) return result.n;
    return 0;
  }

  async estimatedDocumentCount(): Promise<number> {
    const pipeline = [
      { $collStats: { count: {} } },
      { $group: { _id: 1, n: { $sum: "$count" } } },
    ];

    const result = await this.aggregate<{ n: number }>(pipeline).next();
    if (result) return result.n;
    return 0;
  }

  async insertOne(doc: Document, options?: InsertOptions) {
    const { insertedIds } = await this.insertMany([doc], options);
    return insertedIds[0];
  }

  insert(docs: Document | Document[], options?: InsertOptions) {
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
    const { writeErrors } = res;
    if (writeErrors) {
      const [{ errmsg }] = writeErrors;
      throw new Error(errmsg);
    }
    return {
      insertedIds,
      insertedCount: res.n,
    };
  }

  async updateOne(
    filter: FilterDocument<T, QueryOperators>,
    update: FilterDocument<T, UpdateOperators>,
    options?: UpdateOptions,
  ) {
    const {
      upsertedIds = [],
      upsertedCount,
      matchedCount,
      modifiedCount,
    } = await this.updateMany(filter, update, {
      ...options,
      multi: false,
    });
    return {
      upsertedId: upsertedIds ? upsertedIds[0] : undefined,
      upsertedCount,
      matchedCount,
      modifiedCount,
    };
  }

  async updateMany(
    filter: FilterDocument<T, QueryOperators>,
    doc: FilterDocument<T, UpdateOperators>,
    options?: UpdateOptions,
  ) {
    return await update(this.#protocol, this.#dbName, this.name, filter, doc, {
      ...options,
      multi: options?.multi ?? true,
    });
  }

  async deleteMany(
    filter: FilterDocument<T, QueryOperators>,
    options?: DeleteOptions,
  ): Promise<number> {
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

  deleteOne(
    filter: FilterDocument<T, QueryOperators>,
    options?: DeleteOptions,
  ) {
    return this.delete(filter, { ...options, limit: 1 });
  }

  async drop(options?: DropOptions): Promise<void> {
    const res = await this.#protocol.commandSingle(this.#dbName, {
      drop: this.name,
      ...options,
    });
  }

  async distinct(key: string, query?: Document, options?: DistinctOptions) {
    const { values } = await this.#protocol.commandSingle(this.#dbName, {
      distinct: this.name,
      key,
      query,
      ...options,
    });
    return values;
  }

  aggregate<U = T>(pipeline: Document[], options?: any): AggregateCursor<U> {
    return new AggregateCursor<U>({
      pipeline,
      protocol: this.#protocol,
      dbName: this.#dbName,
      collectionName: this.name,
      options,
    });
  }

  async createIndexes(options: CreateIndexOptions) {
    const res = await this.#protocol.commandSingle<{
      ok: number;
      createdCollectionAutomatically: boolean;
      numIndexesBefore: number;
      numIndexesAfter: number;
    }>(this.#dbName, {
      createIndexes: this.name,
      ...options,
    });
    return res;
  }

  async dropIndexes(options: DropIndexOptions) {
    const res = await this.#protocol.commandSingle<{
      ok: number;
      nIndexesWas: number;
    }>(
      this.#dbName,
      {
        dropIndexes: this.name,
        ...options,
      },
    );

    return res;
  }

  listIndexes() {
    return new ListIndexesCursor<
      { v: number; key: Document; name: string; ns: string }
    >({
      protocol: this.#protocol,
      dbName: this.#dbName,
      collectionName: this.name,
    });
  }
}
