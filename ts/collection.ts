import { MongoClient } from "./client.ts";
import { UpdateResult } from "./result.ts";
import {
  ChainBuilderPromise,
  CommandType,
  FindOptions,
  ObjectId,
  UpdateOptions,
} from "./types.ts";
import { convert, parse } from "./type_convert.ts";
import { dispatchAsync, encode } from "./util.ts";

export interface WithID {
  _id: ObjectId;
}
export enum BSONType {
  Double = 1,
  String,
  Object,
  Array,
  BinData,
  Undefined,
  ObjectId,
  Boolean,
  Date,
  Null,
  Regex,
  DBPointer,
  JavaScript,
  Symbol,
  JavaScriptWithScope,
  Int,
  Timestamp,
  Long,
  Decimal,
  MinKey = -1,
  MaxKey = 127,
}

type BSONTypeAlias =
  | "number"
  | "double"
  | "string"
  | "object"
  | "array"
  | "binData"
  | "undefined"
  | "objectId"
  | "bool"
  | "date"
  | "null"
  | "regex"
  | "dbPointer"
  | "javascript"
  | "symbol"
  | "javascriptWithScope"
  | "int"
  | "timestamp"
  | "long"
  | "decimal"
  | "minKey"
  | "maxKey";

export type QuerySelector<T> = {
  $set?: T;
  // Comparison
  $eq?: T;
  $gt?: T;
  $gte?: T;
  $in?: T[];
  $lt?: T;
  $lte?: T;
  $ne?: T;
  $nin?: T[];
  // Logical
  $not?: T extends string ? QuerySelector<T> | RegExp : FilterType<T>;
  /** https://docs.mongodb.com/manual/reference/operator/query/and/#op._S_and */
  $and?: T extends string ? QuerySelector<T> | RegExp : FilterType<T>[];
  /** https://docs.mongodb.com/manual/reference/operator/query/nor/#op._S_nor */
  $nor?: T extends string ? QuerySelector<T> | RegExp : FilterType<T>[];
  /** https://docs.mongodb.com/manual/reference/operator/query/or/#op._S_or */
  $or?: T extends string ? QuerySelector<T> | RegExp : FilterType<T>[];

  /** https://docs.mongodb.com/manual/reference/operator/query/comment/#op._S_comment */
  $comment?: string;

  // Element
  /**
   * When `true`, `$exists` matches the documents that contain the field,
   * including documents where the field value is null.
   */
  $exists?: boolean;
  $type?: BSONType | BSONTypeAlias;
  // Evaluation
  $expr?: any;
  $jsonSchema?: any;
  $mod?: T extends number ? [number, number] : never;
  $regex?: T extends string ? RegExp | string : never;
  /** https://docs.mongodb.com/manual/reference/operator/query/text */
  $text?: {
    $search: string;
    $language?: string;
    $caseSensitive?: boolean;
    $diacraticSensitive?: boolean;
  };
  /** https://docs.mongodb.com/manual/reference/operator/query/where/#op._S_where */
  $where?: string | Function;

  // Geospatial
  // TODO: define better types for geo queries
  $geoIntersects?: { $geometry: object };
  $geoWithin?: object;
  $near?: object;
  $nearSphere?: object;
  // $maxDistance?: number;
  // Array
  // TODO: define better types for $all and $elemMatch
  $all?: T extends Array<infer U> ? any[] : never;
  $elemMatch?: T extends Array<infer U> ? object : never;
  $size?: T extends Array<infer U> ? number : never;
  // Bitwise
  $bitsAllClear?: any;
  $bitsAllSet?: any;
  $bitsAnyClear?: any;
  $bitsAnySet?: any;
};

export type FilterType<T extends any> =
  | Partial<T & WithID>
  | { [P in keyof T]?: QuerySelector<T[P] | null> }
  | QuerySelector<Partial<T & WithID>>;

export type DocumentType<T extends any> = T extends {} ? Partial<T & WithID>
  : any;

/**
 *
 * @example
 * export interface Answer {
 *   surveyId: string;
 *   date: Date;
 *   userAgent: string;
 *   answers: { [key: string]: string | string[] | null };
 * }
 *
 * //Modified mongo library in order to be able to use Generics and get completition.
 * export const answersCollection = db.collection<Answer>("answers");
 *
 * //Typecript will infer type: const answers: Answer[]
 * const answers = await answersCollection.find();
 *
 */

export class Collection<T extends any> {
  constructor(
    private readonly client: MongoClient,
    private readonly dbName: string,
    private readonly collectionName: string,
  ) {}

  private async _find(
    filter?: FilterType<T>,
    options?: FindOptions,
  ): Promise<T & WithID> {
    const doc = await dispatchAsync(
      {
        command_type: CommandType.Find,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          filter,
          ...options,
        }),
      ),
    );
    return doc as T & WithID;
  }

  public async count(filter?: FilterType<T>): Promise<number> {
    const count = await dispatchAsync(
      {
        command_type: CommandType.Count,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          filter,
        }),
      ),
    );
    return count as number;
  }

  public async findOne(filter?: FilterType<T>): Promise<(T & WithID) | null> {
    return parse(await this._find(filter, { findOne: true }))[0] ?? null;
  }

  public find(filter?: FilterType<T>, options?: FindOptions) {
    const self = this;
    return new (class extends ChainBuilderPromise<T[]> {
      private maxQueryLimit?: number;
      private skipDocCount?: number;

      async _excutor(): Promise<T[]> {
        return parse(
          await self._find(filter, {
            findOne: false,
            limit: this.maxQueryLimit,
            skip: this.skipDocCount,
            ...options,
          }),
        );
      }

      public skip(skipCount: number): Omit<this, "_excutor"> {
        this.skipDocCount = skipCount;
        return this;
      }

      public limit(limitCount: number): Omit<this, "_excutor"> {
        this.maxQueryLimit = limitCount;
        return this;
      }
    })();
  }

  public async insertOne(doc: DocumentType<T>): Promise<ObjectId> {
    const _id = await dispatchAsync(
      {
        command_type: CommandType.InsertOne,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          doc: convert(doc),
        }),
      ),
    );
    return _id as ObjectId;
  }

  public async insertMany(docs: Array<DocumentType<T>>): Promise<ObjectId[]> {
    const _ids = await dispatchAsync(
      {
        command_type: CommandType.InsertMany,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          docs: convert(docs),
        }),
      ),
    );
    return _ids as ObjectId[];
  }

  private async _delete(
    query: FilterType<T>,
    deleteOne: boolean = false,
  ): Promise<number> {
    const deleteCount = await dispatchAsync(
      {
        command_type: CommandType.Delete,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          query,
          deleteOne,
        }),
      ),
    );
    return deleteCount as number;
  }

  public deleteOne(query: FilterType<T>): Promise<number> {
    return this._delete(query, true);
  }

  public deleteMany(query: FilterType<T>): Promise<number> {
    return this._delete(query, false);
  }

  private async _update(
    query: FilterType<T>,
    update: FilterType<T>,
    updateOne: boolean = false,
    options?: UpdateOptions,
  ): Promise<UpdateResult & T & WithID> {
    const result = await dispatchAsync(
      {
        command_type: CommandType.Update,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          query: convert(query),
          update: convert(update),
          updateOne,
          options: options ?? null,
        }),
      ),
    );
    return result as UpdateResult & T & WithID;
  }

  public updateOne(
    query: FilterType<T>,
    update: FilterType<T>,
    options?: UpdateOptions,
  ): Promise<UpdateResult & T & WithID> {
    return this._update(query, update, true, options);
  }

  public updateMany(
    query: FilterType<T>,
    update: FilterType<T>,
    options?: UpdateOptions,
  ) {
    return this._update(query, update, false, options);
  }

  public async aggregate<T extends {}>(
    pipeline: Object[],
  ): Promise<Array<T & WithID>> {
    const docs = await dispatchAsync(
      {
        command_type: CommandType.Aggregate,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          pipeline,
        }),
      ),
    );
    return parse(docs) as Array<T & WithID>;
  }

  public async createIndexes(
    models: {
      keys: Object;
      options?: {
        background?: boolean;
        unique?: boolean;
        name?: string;
        partialFilterExpression?: Object;
        sparse?: boolean;
        expireAfterSeconds?: number;
        storageEngine?: Object;
      };
    }[],
  ): Promise<string[]> {
    const docs = await dispatchAsync(
      {
        command_type: CommandType.CreateIndexes,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          models,
        }),
      ),
    );
    return docs as string[];
  }

  public async distinct(
    fieldName: string,
    filter?: FilterType<T>,
  ): Promise<Array<T & WithID>> {
    const docs = await dispatchAsync(
      {
        command_type: CommandType.Distinct,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          fieldName,
        }),
      ),
    );
    return parse(docs) as Array<T & WithID>;
  }
}
