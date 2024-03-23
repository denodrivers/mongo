import { ObjectId } from "../../deps.ts";
import {
  MongoDriverError,
  MongoInvalidArgumentError,
  MongoServerError,
} from "../error.ts";
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

/**
 * A collection within a MongoDB Database
 * @module
 */

/** A collection within a MongoDB Database */
export class Collection<T extends Document> {
  #protocol: WireProtocol;
  #dbName: string;

  constructor(protocol: WireProtocol, dbName: string, readonly name: string) {
    this.#protocol = protocol;
    this.#dbName = dbName;
  }

  /**
   * Get a FindCursor for the given filter
   *
   * @param filter The query used to match documents
   * @param options Additional options for the operation
   * @returns A cursor for the query
   */
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

  /**
   * Find one Document using the given filter
   *
   * @param filter The query used to match for a document
   * @param options Additional options for the operation
   * @returns The document matched, or undefined if no document was found
   */
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
  ): Promise<T | null> {
    const result = await this.#protocol.commandSingle<{
      value: T;
      ok: number;
      // deno-lint-ignore no-explicit-any
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
   * Count the number of documents matching the given filter
   *
   * @param filter The query used to match documents
   * @param options Additional options for the operation
   * @returns The number of documents matching the filter
   */
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

  /** A function that returns the estimated number of documents in the collection */
  async estimatedDocumentCount(): Promise<number> {
    const pipeline = [
      { $collStats: { count: {} } },
      { $group: { _id: 1, n: { $sum: "$count" } } },
    ];

    const result = await this.aggregate<{ n: number }>(pipeline).next();
    if (result) return result.n;
    return 0;
  }

  /**
   * Insert a single document into the collection
   *
   * @param doc The document to insert
   * @param options Additional options for the operation
   * @returns The inserted document's ID
   */
  async insertOne(
    doc: InsertDocument<T>,
    options?: InsertOptions,
  ): Promise<Required<InsertDocument<T>>["_id"]> {
    const { insertedIds } = await this.insertMany([doc], options);
    return insertedIds[0];
  }

  /**
   * Insert multiple documents into the collection
   *
   * @param docs An array of documents to insert
   * @param options Additional options for the operation
   * @returns The inserted documents' IDs and the number of documents inserted
   */
  async insertMany(
    docs: InsertDocument<T>[],
    options?: InsertOptions,
  ): Promise<
    {
      insertedIds: Required<InsertDocument<T>>["_id"][];
      insertedCount: number;
    }
  > {
    const insertedIds = docs.map((doc) => {
      if (!doc._id) {
        doc._id = new ObjectId();
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
      throw new MongoServerError(errmsg);
    }
    return {
      insertedIds,
      insertedCount: res.n,
    };
  }

  /**
   * Update a single document matching the given filter
   *
   * @param filter The query used to match the document
   * @param update The update to apply to the document
   * @param options Additional options for the operation
   * @returns The number of documents matched, modified, and upserted
   */
  async updateOne(
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions,
  ): Promise<
    {
      upsertedId: ObjectId | undefined;
      upsertedCount: number;
      matchedCount: number;
      modifiedCount: number;
    }
  > {
    const {
      upsertedIds,
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

  /**
   * Update multiple documents matching the given filter
   *
   * @param filter The query used to match the documents
   * @param doc The update to apply to the documents
   * @param options Additional options for the operation
   * @returns The number of documents matched, modified, and upserted
   */
  updateMany(
    filter: Filter<T>,
    doc: UpdateFilter<T>,
    options?: UpdateOptions,
  ): Promise<
    {
      upsertedIds: ObjectId[] | undefined;
      upsertedCount: number;
      modifiedCount: number;
      matchedCount: number;
    }
  > {
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

  /**
   * Replace a single document matching the given filter
   *
   * @param filter The query used to match the document
   * @param replacement The replacement document
   * @param options Additional options for the operation
   * @returns The number of documents matched, modified, and upserted
   */
  async replaceOne(
    filter: Filter<T>,
    replacement: InsertDocument<T>,
    options?: UpdateOptions,
  ): Promise<
    {
      upsertedId: ObjectId | undefined;
      upsertedCount: number;
      matchedCount: number;
      modifiedCount: number;
    }
  > {
    if (hasAtomicOperators(replacement)) {
      throw new MongoInvalidArgumentError(
        "Replacement document must not contain atomic operators",
      );
    }

    const { upsertedIds, upsertedCount, matchedCount, modifiedCount } =
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

  /**
   * Delete multiple documents matching the given filter
   *
   * @param filter The query used to match the documents
   * @param options Additional options for the operation
   * @returns The number of documents deleted
   */
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

  /**
   * Delete a single document matching the given filter
   *
   * @param filter The query used to match the document
   * @param options Additional options for the operation
   * @returns The number of documents deleted
   */
  deleteOne(
    filter: Filter<T>,
    options?: DeleteOptions,
  ): Promise<number> {
    return this.deleteMany(filter, { ...options, limit: 1 });
  }

  /**
   * Drop the collection from the database
   *
   * @param options Additional options for the operation
   */
  async drop(options?: DropOptions): Promise<void> {
    const _res = await this.#protocol.commandSingle(this.#dbName, {
      drop: this.name,
      ...options,
    });
  }

  async distinct(
    key: string,
    query?: Filter<T>,
    options?: DistinctOptions,
    // deno-lint-ignore no-explicit-any
  ): Promise<any> {
    const { values } = await this.#protocol.commandSingle(this.#dbName, {
      distinct: this.name,
      key,
      query,
      ...options,
    });
    return values;
  }

  /**
   * Perform aggregation on the collection
   *
   * @param pipeline The aggregation pipeline
   * @param options Additional options for the operation
   * @returns A cursor for the aggregation
   */
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

  /**
   * Create an index on the collection
   *
   * @param options The options for the operation
   * @returns The result of the operation
   */
  async createIndexes(
    options: CreateIndexOptions,
  ): Promise<
    {
      ok: number;
      createdCollectionAutomatically: boolean;
      numIndexesBefore: number;
      numIndexesAfter: number;
    }
  > {
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

  /**
   * Drop an index from the collection
   *
   * @param options The options for the operation
   * @returns The result of the operation
   */
  async dropIndexes(options: DropIndexOptions): Promise<{
    ok: number;
    nIndexesWas: number;
  }> {
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

  /**
   * List the indexes on the collection
   *
   * @returns A cursor for the indexes
   */
  listIndexes(): ListIndexesCursor<
    { v: number; key: Document; name: string; ns?: string }
  > {
    return new ListIndexesCursor<
      { v: number; key: Document; name: string; ns?: string }
    >({
      protocol: this.#protocol,
      dbName: this.#dbName,
      collectionName: this.name,
    });
  }
}

/**
 * Check if a document contains atomic operators
 *
 * @param doc The document to check
 * @returns Whether the document contains atomic operators
 */
export function hasAtomicOperators(doc: Document | Document[]): boolean {
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
