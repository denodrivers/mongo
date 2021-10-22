import { Bson } from "../../deps.ts";
import { MongoDriverError, MongoInvalidArgumentError } from "../error.ts";
import { WireProtocol } from "../protocol/mod.ts";
import {
  AggregateOptions,
  AggregatePipeline,
  CountOptions,
  CreateIndexOptions,
  DeleteOptions,
  DistinctOptions,
  Document,
  DropIndexOptions,
  DropOptions,
  Filter,
  FindAndModifyOptions,
  FindOptions,
  InsertDocument,
  InsertOptions,
  UpdateFilter,
  UpdateOptions,
} from "../types.ts";
import { AggregateCursor } from "./commands/aggregate.ts";
import { FindCursor } from "./commands/find.ts";
import { ListIndexesCursor } from "./commands/list_indexes.ts";
import { update } from "./commands/update.ts";

export class Collection<T> {
  #protocol: WireProtocol;
  #dbName: string;

  constructor(protocol: WireProtocol, dbName: string, readonly name: string) {
    this.#protocol = protocol;
    this.#dbName = dbName;
  }

  find(
    filter?: Filter<T>,
    options?: FindOptions,
  ): FindCursor<T> {
    return new FindCursor<T>({
      filter,
      protocol: this.#protocol,
      collectionName: this.name,
      dbName: this.#dbName,
      options: options ?? {},
    });
  }

  findOne(
    filter?: Filter<T>,
    options?: FindOptions,
  ): Promise<T | undefined> {
    const cursor = this.find(filter, options);
    return cursor.next();
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
    filter?: Filter<T>,
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
      throw new MongoDriverError("Could not execute findAndModify operation");
    }
    return result.value;
  }

  /**
   * @deprecated Use `countDocuments` or `estimatedDocumentCount` instead
   */
  async count(
    filter?: Filter<T>,
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
    filter?: Filter<T>,
    options?: CountOptions,
  ): Promise<number> {
    const pipeline: AggregatePipeline<T>[] = [];
    if (filter) {
      pipeline.push({ $match: filter });
    }

    if (typeof options?.skip === "number") {
      pipeline.push({ $skip: options.limit });
      delete options.skip;
    }

    if (typeof options?.limit === "number") {
      pipeline.push({ $limit: options.limit });
      delete options.limit;
    }

    pipeline.push({ $group: { _id: 1, n: { $sum: 1 } } });

    const result = await this.aggregate<{ n: number }>(
      pipeline,
      options as AggregateOptions,
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

  async insertOne(doc: InsertDocument<T>, options?: InsertOptions) {
    const { insertedIds } = await this.insertMany([doc], options);
    return insertedIds[0];
  }

  /**
   * @deprecated Use `insertOne, insertMany` or `bulkWrite` instead.
   */
  insert(
    docs: InsertDocument<T> | InsertDocument<T>[],
    options?: InsertOptions,
  ) {
    docs = Array.isArray(docs) ? docs : [docs];
    return this.insertMany(docs, options);
  }

  async insertMany(
    docs: InsertDocument<T>[],
    options?: InsertOptions,
  ): Promise<
    {
      insertedIds: (Bson.ObjectId | Required<InsertDocument<T>>["_id"])[];
      insertedCount: number;
    }
  > {
    const insertedIds = docs.map((doc) => {
      if (!doc._id) {
        doc._id = new Bson.ObjectId();
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
    filter: Filter<T>,
    update: UpdateFilter<T>,
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
      upsertedId: upsertedIds?.[0],
      upsertedCount,
      matchedCount,
      modifiedCount,
    };
  }

  updateMany(
    filter: Filter<T>,
    doc: UpdateFilter<T>,
    options?: UpdateOptions,
  ) {
    if (!hasAtomicOperators(doc)) {
      throw new MongoInvalidArgumentError(
        "Update document requires atomic operators",
      );
    }

    return update(this.#protocol, this.#dbName, this.name, filter, doc, {
      ...options,
      multi: options?.multi ?? true,
    });
  }

  async replaceOne(
    filter: Filter<T>,
    replacement: InsertDocument<T>,
    options?: UpdateOptions,
  ) {
    if (hasAtomicOperators(replacement)) {
      throw new MongoInvalidArgumentError(
        "Replacement document must not contain atomic operators",
      );
    }

    const { upsertedIds = [], upsertedCount, matchedCount, modifiedCount } =
      await update(
        this.#protocol,
        this.#dbName,
        this.name,
        filter,
        replacement,
        {
          ...options,
          multi: false,
        },
      );

    return {
      upsertedId: upsertedIds?.[0],
      upsertedCount,
      matchedCount,
      modifiedCount,
    };
  }

  async deleteMany(
    filter: Filter<T>,
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
    filter: Filter<T>,
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

  async distinct(key: string, query?: Filter<T>, options?: DistinctOptions) {
    const { values } = await this.#protocol.commandSingle(this.#dbName, {
      distinct: this.name,
      key,
      query,
      ...options,
    });
    return values;
  }

  aggregate<U = T>(
    pipeline: AggregatePipeline<U>[],
    options?: AggregateOptions,
  ): AggregateCursor<U> {
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
      { v: number; key: Document; name: string; ns?: string }
    >({
      protocol: this.#protocol,
      dbName: this.#dbName,
      collectionName: this.name,
    });
  }
}

export function hasAtomicOperators(doc: Bson.Document | Bson.Document[]) {
  if (Array.isArray(doc)) {
    for (const document of doc) {
      if (hasAtomicOperators(document)) {
        return true;
      }
    }
    return false;
  }
  const keys = Object.keys(doc);
  return keys.length > 0 && keys[0][0] === "$";
}
