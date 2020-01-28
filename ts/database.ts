import { MongoClient } from "./client.ts";
import { dispatchAsync, encode } from "./util.ts";
import { CommandType } from "./types.ts";

export class Database {
  constructor(private client: MongoClient, private name: string) {}

  async listCollectionNames(): Promise<string[]> {
    const names = await dispatchAsync(
      {
        command_type: CommandType.ListCollectionNames,
        client_id: this.client.clientId
      },
      encode(this.name)
    );
    return names as string[];
  }
}
