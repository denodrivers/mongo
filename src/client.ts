import { Database } from "./database.ts";
import {
  BuildInfo,
  ConnectOptions,
  Document,
  ListDatabaseInfo,
} from "./types.ts";
import { parse } from "./utils/uri.ts";
import { MongoDriverError } from "./error.ts";
import { Cluster } from "./cluster.ts";
import { assert } from "../deps.ts";

export class MongoClient {
  #cluster?: Cluster;
  #defaultDbName = "admin";
  #buildInfo?: BuildInfo;

  get buildInfo() {
    return this.#buildInfo;
  }

  async connect(
    options: ConnectOptions | string,
  ): Promise<Database> {
    try {
      const parsedOptions = typeof options === "string"
        ? await parse(options)
        : options;

      this.#defaultDbName = parsedOptions.db;
      const cluster = new Cluster(parsedOptions);
      await cluster.connect();
      await cluster.authenticate();
      await cluster.updateMaster();

      this.#cluster = cluster;
      this.#buildInfo = await this.runCommand(this.#defaultDbName, {
        buildInfo: 1,
      });
    } catch (e) {
      throw new MongoDriverError(`Connection failed: ${e.message || e}`);
    }
    return this.database((options as ConnectOptions).db);
  }

  async listDatabases(options: {
    filter?: Document;
    nameOnly?: boolean;
    authorizedCollections?: boolean;
    comment?: Document;
  } = {}): Promise<ListDatabaseInfo[]> {
    assert(this.#cluster);
    const { databases } = await this.#cluster.protocol.commandSingle("admin", {
      listDatabases: 1,
      ...options,
    });
    return databases;
  }

  // TODO: add test cases
  runCommand<T = any>(db: string, body: Document): Promise<T> {
    assert(this.#cluster);
    return this.#cluster.protocol.commandSingle(db, body);
  }

  database(name = this.#defaultDbName): Database {
    assert(this.#cluster);
    return new Database(this.#cluster, name);
  }

  close() {
    if (this.#cluster) this.#cluster.close();
  }
}
