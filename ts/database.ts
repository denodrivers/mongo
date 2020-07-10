import { MongoClient } from "./client.ts";
import { Collection } from "./collection.ts";
import { CommandType } from "./types.ts";
import { dispatchAsync, encode } from "./util.ts";

export class Database {
  constructor(private client: MongoClient, private name: string) {}

  async listCollectionNames(): Promise<string[]> {
    const names = await dispatchAsync(
      {
        command_type: CommandType.ListCollectionNames,
        client_id: this.client.clientId,
      },
      encode(this.name),
    );
    return names as string[];
  }

  collection<T extends any>(name: string): Collection<T> {
    return new Collection<T>(this.client, this.name, name);
  }
}
