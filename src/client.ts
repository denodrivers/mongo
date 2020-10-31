import { Connection } from "./connection/connection.ts";

interface ConnectOptions {
  hostname: string;
  port: number;
}

export class MongoClient {
  private _conn?: Deno.Conn;
  private connection?: Connection;

  async connect(options: ConnectOptions) {
    this._conn = await Deno.connect(options);
    this.connection = new Connection(this._conn);

    await this.connection.connect();
  }
}
