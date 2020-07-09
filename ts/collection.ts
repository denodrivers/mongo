import { MongoClient } from "./client.ts";
import { UpdateResult } from "./result.ts";
import { CommandType, FindOptions, ObjectId } from "./types.ts";
import { convert, parse } from "./type_convert.ts";
import { dispatchAsync, encode } from "./util.ts";

/**
 * 
 * @example
 * import { MongoClient } from "https://deno.land/x/mongo/mod.ts";
 * import { DATABASE_NAME, MONGO_URL } from "./constants.ts";
 * const client = new MongoClient();
 * 
 * client.connectWithUri(
 *   `${MONGO_URL}/${DATABASE_NAME}`,
 * );
 * 
 * const db = client.database(DATABASE_NAME);
 * 
 * export interface Answer {
 *   surveyId: string;
 *   date: Date;
 *   userAgent: string;
 *   answers: { [key: string]: string | string[] | null };
 * }
 * 
 * //Using Generics to get better typescript completition.
 * export const answersCollection = db.collection<Answer>("answers");
 * 
 * //Typecript will infer type: const answers: Answer[]
 * const answers = await answersCollection.find();
 * 
 */
export class Collection<T extends {}> {
  constructor(
    private readonly client: MongoClient,
    private readonly dbName: string,
    private readonly collectionName: string,
  ) {}

  private async _find(filter?: Partial<T>, options?: FindOptions): Promise<T> {
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
    return doc as T;
  }

  public async count(filter?: Partial<T>): Promise<number> {
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

  public async findOne(filter?: Partial<T>): Promise<T> {
    return parse(await this._find(filter, { findOne: true }));
  }

  public async find(filter?: Partial<T>, options?: FindOptions): Promise<T[]> {
    return parse(await this._find(filter, { findOne: false, ...options }));
  }

  public async insertOne(doc: T): Promise<ObjectId> {
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

  public async insertMany(docs: T[]): Promise<ObjectId[]> {
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
    query: Partial<T>,
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

  public deleteOne(query: Partial<T>): Promise<number> {
    return this._delete(query, true);
  }

  public deleteMany(query: Partial<T>): Promise<number> {
    return this._delete(query, false);
  }

  private async _update(
    query: Partial<T>,
    update: Partial<T>,
    updateOne: boolean = false,
  ): Promise<UpdateResult & T> {
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
        }),
      ),
    );
    return result as UpdateResult & T;
  }

  public updateOne(
    query: Partial<T>,
    update: Partial<T>,
  ): Promise<UpdateResult & T> {
    return this._update(query, update, true);
  }

  public updateMany(
    query: Partial<T>,
    update: Partial<T>,
  ): Promise<UpdateResult & T> {
    return this._update(query, update, false);
  }

  public async aggregate<T = any>(pipeline: Object[]): Promise<T[]> {
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
    return parse(docs) as T[];
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
}
