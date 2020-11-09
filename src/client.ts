import { WireProtocol } from "./protocol/mod.ts";

interface ConnectOptions {
  hostname: string;
  port: number;
}

export class MongoClient {
  #protocol?: WireProtocol;

  async connect(options: ConnectOptions) {
    const conn = await Deno.connect(options);
    this.#protocol = new WireProtocol(conn);

    await this.#protocol.connect();
  }
}
