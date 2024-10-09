import { Cluster } from "./cluster.ts";
import { Database } from "./database.ts";
import { MongoDriverError } from "./error.ts";
import type {
  BuildInfo,
  ConnectOptions,
  Document,
  ListDatabaseInfo,
} from "./types.ts";
import { parse } from "./utils/uri.ts";

/**
 * A client that allows you to interact with a MongoDB Server
 * @module
 */

/** A client that allows you to interact with a MongoDB Server */
export class MongoClient {
  #cluster?: Cluster;
  #defaultDbName = "admin";
  #buildInfo?: BuildInfo;

  /** Get information about your server's build */
  get buildInfo(): BuildInfo | undefined {
    return this.#buildInfo;
  }

  /** Get the cluster associated with the client */
  getCluster(): Cluster {
    if (!this.#cluster) {
      throw new MongoDriverError(
        "MongoClient is not connected to the Database",
      );
    }

    return this.#cluster;
  }

  /**
   * Connect to the given MongoDB server
   *
   * @param options Connection options or a MongoDB URI
   */
  async connect(options: ConnectOptions | string): Promise<Database> {
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
    } catch (e: unknown) {
      throw new MongoDriverError(
        `Connection failed: ${e instanceof Error ? e.message : "unknown"}`,
      );
    }
    return this.database((options as ConnectOptions).db);
  }

  /**
   * List all databases on the connected server
   *
   * @param options Options to pass to the `listDatabases` command
   * @returns A list of databases including their name, size on disk, and whether they are empty
   */
  async listDatabases(
    options: {
      filter?: Document;
      nameOnly?: boolean;
      authorizedCollections?: boolean;
      comment?: Document;
    } = {},
  ): Promise<ListDatabaseInfo[]> {
    const { databases } = await this.getCluster().protocol.commandSingle(
      "admin",
      {
        listDatabases: 1,
        ...options,
      },
    );
    return databases;
  }

  /** Run a command on the connected server */
  // deno-lint-ignore no-explicit-any
  runCommand<T = any>(db: string, body: Document): Promise<T> {
    return this.getCluster().protocol.commandSingle(db, body);
  }

  /** Get a database instance on the connected server */
  database(name: string = this.#defaultDbName): Database {
    return new Database(this.getCluster(), name);
  }

  /** Close the connection to the server */
  close() {
    if (this.#cluster) this.#cluster.close();
  }
}
