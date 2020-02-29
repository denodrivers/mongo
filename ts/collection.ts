import { MongoClient } from "./client.ts";
import { CommandType } from "./types.ts";
import { dispatchAsync, encode } from "./util.ts";

export class Collection {
  constructor(
    private readonly client: MongoClient,
    private readonly dbName: string,
    private readonly collectionName: string
  ) {}

  public async findOne(filter: Object): Promise<any> {
    const doc = await dispatchAsync(
      {
        command_type: CommandType.FindOne,
        client_id: this.client.clientId
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          filter
        })
      )
    );
    return doc;
  }

  public async insertOne(doc: Object): Promise<any> {
    const _id = await dispatchAsync(
      {
        command_type: CommandType.InsertOne,
        client_id: this.client.clientId
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          doc
        })
      )
    );
    return _id;
  }
}
