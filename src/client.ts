import { assert } from "../deps.ts";
import { Database } from "./database.ts";
import { WireProtocol } from "./protocol/mod.ts";
import {
  ConnectOptions,
  Credential,
  Document,
  ListDatabaseInfo,
} from "./types.ts";
import { parse } from "./utils/uri.ts";
import { AuthContext, ScramAuthPlugin } from "./auth/mod.ts";
import { MongoError } from "./error.ts";

const DENO_DRIVER_VERSION = "0.0.1";

export interface DenoConnectOptions {
  hostname: string;
  port: number;
  certFile?: string;
}

export class MongoClient {
  #protocol?: WireProtocol;
  #conn?: Deno.Conn;

  async connect(options: ConnectOptions | string) {
    if (typeof options === "string") {
      options = parse(options);
    }
    let conn;
    const denoConnectOps: DenoConnectOptions = {
      hostname: options.servers[0].host,
      port: options.servers[0].port,
    };
    if (options.tls) {
      if (options.certFile) {
        denoConnectOps.certFile = options.certFile;
      }
      conn = await Deno.connectTls(denoConnectOps);
    } else {
      conn = await Deno.connect(denoConnectOps);
    }

    this.#conn = conn;
    this.#protocol = new WireProtocol(conn);

    if ((options as ConnectOptions).credential) {
      const authContext = new AuthContext(
        this.#protocol,
        (options as ConnectOptions).credential,
        options as ConnectOptions,
      );
      let mechanism = (options as ConnectOptions).credential!.mechanism;
      let authPlugin;
      if (mechanism === "SCRAM-SHA-256") {
        authPlugin = new ScramAuthPlugin("sha256"); //TODO AJUST sha256
      } else if (mechanism === "SCRAM-SHA-1") {
        authPlugin = new ScramAuthPlugin("sha1");
      } else {
        throw new MongoError(`Auth mechanism not implemented: ${mechanism}`);
      }
      let request = authPlugin.prepare(authContext);
      authContext.response = await this.#protocol.commandSingle(
        "admin",
        request,
      );
      await authPlugin.auth(authContext);
    } else {
      await this.#protocol.connect();
    }
    return this.database((options as ConnectOptions).db);
  }

  async listDatabases(options?: {
    filter?: Document;
    nameOnly?: boolean;
    authorizedCollections?: boolean;
    comment?: Document;
  }): Promise<ListDatabaseInfo[]> {
    assert(this.#protocol);
    if (!options) {
      options = {};
    }
    const { databases } = await this.#protocol.commandSingle("admin", {
      listDatabases: 1,
      ...options,
    });
    return databases;
  }

  database(name: string): Database {
    assert(this.#protocol);
    return new Database(this.#protocol, name);
  }

  close() {
    if (this.#conn) {
      Deno.close(this.#conn.rid);
      this.#conn = undefined;
      this.#protocol = undefined;
    }
  }
}
