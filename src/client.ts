import { WireProtocol } from "./protocol/mod.ts";
import { parse } from "./utils/uri.ts";

interface ConnectOptions {
  host: string;
  port: number;
}

export class MongoClient {
  #protocol?: WireProtocol;
  #conn?: Deno.Conn;

  async connect(options: ConnectOptions | string) {
    if (typeof options === "string") {
      const { servers: [{ port, host }] } = parse(options);
      options = {
        host,
        port,
      };
    }

    const conn = await Deno.connect(options);
    this.#conn = conn;
    this.#protocol = new WireProtocol(conn);

    await this.#protocol.connect();
  }

  close() {
    if (this.#conn) {
      Deno.close(this.#conn.rid);
      this.#conn = undefined;
    }
  }
}
