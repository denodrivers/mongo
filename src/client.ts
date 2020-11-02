import { Connection } from "./connection/connection.ts";

interface ConnectOptions {
  hostname: string;
  port: number;
}

export class MongoClient {
  #connection?: Connection;

  async connect(options: ConnectOptions) {
    const conn = await Deno.connect(options);
    this.#connection = new Connection(conn);

    await this.#connection.connect();
  }
}
