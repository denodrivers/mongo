import { Database } from "./database.ts";
import { ConnectOptions, Document, ListDatabaseInfo } from "./types.ts";
import { parse } from "./utils/uri.ts";
import { MongoError } from "./error.ts";
import { Cluster } from "./cluster.ts";
import { assert } from "../deps.ts";

const DENO_DRIVER_VERSION = "0.0.1";

export class MongoClient {
  #cluster?: Cluster;

  async connect(
    options: ConnectOptions | string,
  ): Promise<Database> {
    try {
      const parsedOptions = typeof options === "string"
        ? await parse(options)
        : options;
      const cluster = new Cluster(parsedOptions);
      await cluster.connect();
      await cluster.authenticate();
      await cluster.updateMaster();
      this.#cluster = cluster;
    } catch (e) {
      throw new MongoError(`Connection failed: ${e.message || e}`);
    }
    return this.database((options as ConnectOptions).db);
  }

  async listDatabases(options?: {
    filter?: Document;
    nameOnly?: boolean;
    authorizedCollections?: boolean;
    comment?: Document;
  }): Promise<ListDatabaseInfo[]> {
    if (!options) {
      options = {};
    }
    assert(this.#cluster);
    const { databases } = await this.#cluster.protocol.commandSingle("admin", {
      listDatabases: 1,
      ...options,
    });
    return databases;
  }

  // TODO: add test cases
  async runCommand<T = any>(db: string, body: Document): Promise<T> {
    assert(this.#cluster);
    return await this.#cluster.protocol.commandSingle(db, body);
  }

  database(name: string): Database {
    assert(this.#cluster);
    return new Database(this.#cluster, name);
  }

  close() {
    if (this.#cluster) this.#cluster.close();
  }
}
