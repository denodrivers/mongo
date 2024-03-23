import { Document } from "../mod.ts";
import { Cluster } from "./cluster.ts";
import { Database } from "./database.ts";
import { MongoDriverError } from "./error.ts";
import { BuildInfo, ConnectOptions, ListDatabaseInfo } from "./types.ts";
import { parse } from "./utils/uri.ts";

export class MongoClient {
  #cluster?: Cluster;
  #defaultDbName = "admin";
  #buildInfo?: BuildInfo;

  get buildInfo(): BuildInfo | undefined {
    return this.#buildInfo;
  }

  getCluster(): Cluster {
    if (!this.#cluster) {
      throw new MongoDriverError(
        "MongoClient is not connected to the Database",
      );
    }

    return this.#cluster;
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
    const { databases } = await this.getCluster().protocol.commandSingle(
      "admin",
      {
        listDatabases: 1,
        ...options,
      },
    );
    return databases;
  }

  // deno-lint-ignore no-explicit-any
  runCommand<T = any>(db: string, body: Document): Promise<T> {
    return this.getCluster().protocol.commandSingle(db, body);
  }

  database(name: string = this.#defaultDbName): Database {
    return new Database(this.getCluster(), name);
  }

  close() {
    if (this.#cluster) this.#cluster.close();
  }
}
