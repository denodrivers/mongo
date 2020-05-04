import { MongoClient } from "./client.ts";
import { UpdateResult } from "./result.ts";
import { CommandType, FindOptions } from "./types.ts";
import { convert, parse } from "./type_convert.ts";
import { dispatchAsync, encode } from "./util.ts";

export class Collection {
  constructor(
    private readonly client: MongoClient,
    private readonly dbName: string,
    private readonly collectionName: string,
  ) {}

  private async _find(filter?: Object, options?: FindOptions): Promise<any> {
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
    return doc;
  }

  public async count(filter?: Object): Promise<number> {
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

  public async findOne(filter?: Object): Promise<any> {
    return parse(await this._find(filter, { findOne: true }));
  }

  public async find(filter?: Object, options?: FindOptions): Promise<any> {
    return parse(await this._find(filter, { findOne: false, ...options }));
  }

  public async insertOne(doc: Object): Promise<any> {
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
    return _id;
  }

  public async insertMany(docs: Object[]): Promise<any> {
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
    return _ids;
  }

  private async _delete(
    query: Object,
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

  public deleteOne(query: Object): Promise<number> {
    return this._delete(query, true);
  }

  public deleteMany(query: Object): Promise<number> {
    return this._delete(query, false);
  }

  private async _update(
    query: Object,
    update: Object,
    updateOne: boolean = false,
  ): Promise<UpdateResult> {
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
    return result as UpdateResult;
  }

  public updateOne(query: Object, update: Object): Promise<UpdateResult> {
    return this._update(query, update, true);
  }

  public updateMany(query: Object, update: Object): Promise<UpdateResult> {
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
