import { WireProtocol } from "./protocol/mod.ts";
import { ConnectOptions } from "./types.ts";
import { AuthContext, ScramAuthPlugin, X509AuthPlugin } from "./auth/mod.ts";
import { MongoError } from "./error.ts";
import { assert } from "../deps.ts";
import { Server } from "./types.ts";

export interface DenoConnectOptions {
  hostname: string;
  port: number;
  certFile?: string;
}

export class Cluster {
  #options: ConnectOptions;
  #connections: Deno.Conn[];
  #protocols: WireProtocol[];
  #masterIndex: number;

  constructor(options: ConnectOptions) {
    this.#options = options;
    this.#connections = [];
    this.#protocols = [];
    this.#masterIndex = -1;
  }

  async connect() {
    const options = this.#options;
    this.#connections = await Promise.all(
      options.servers.map((server) => this.connectToServer(server, options)),
    );
  }

  async connectToServer(server: Server, options: ConnectOptions) {
    const denoConnectOps: DenoConnectOptions = {
      hostname: server.host,
      port: server.port,
    };
    if (options.tls) {
      if (options.certFile) {
        denoConnectOps.certFile = options.certFile;
      }
      if (options.keyFile) {
        if (options.keyFilePassword) {
          throw new MongoError(
            `Tls keyFilePassword not implemented in Deno driver`,
          );
          //TODO, need something like const key = decrypt(options.keyFile) ...
        }
        throw new MongoError(`Tls keyFile not implemented in Deno driver`);
        //TODO, need Deno.connectTls with something like key or keyFile option.
      }
      return await Deno.connectTls(denoConnectOps);
    } else {
      return await Deno.connect(denoConnectOps);
    }
  }

  async authenticate() {
    const options = this.#options;
    this.#protocols = await Promise.all(
      this.#connections.map((conn) => this.authenticateToServer(conn, options)),
    );
  }

  async authenticateToServer(conn: Deno.Conn, options: ConnectOptions) {
    const protocol = new WireProtocol(conn);
    if (options.credential) {
      const authContext = new AuthContext(
        protocol,
        options.credential,
        options,
      );
      const mechanism = options.credential!.mechanism;
      let authPlugin;
      if (mechanism === "SCRAM-SHA-256") {
        authPlugin = new ScramAuthPlugin("sha256"); //TODO AJUST sha256
      } else if (mechanism === "SCRAM-SHA-1") {
        authPlugin = new ScramAuthPlugin("sha1");
      } else if (mechanism === "MONGODB-X509") {
        authPlugin = new X509AuthPlugin();
      } else {
        throw new MongoError(
          `Auth mechanism not implemented in Deno driver: ${mechanism}`,
        );
      }
      const request = authPlugin.prepare(authContext);
      authContext.response = await protocol.commandSingle(
        "admin", // TODO: Should get the auth db from connectionOptions?
        request,
      );
      await authPlugin.auth(authContext);
    } else {
      await protocol.connect();
    }
    return protocol;
  }

  async updateMaster() {
    const results = await Promise.all(this.#protocols.map((protocol) => {
      return protocol.commandSingle(
        "admin",
        { isMaster: 1 },
      );
    }));
    const masterIndex = results.findIndex((result) => result.isWritablePrimary || result.ismaster);
    if (masterIndex === -1) throw new Error(`Could not find a master node`);
    this.#masterIndex = masterIndex;
  }

  private getMaster() {
    return {
      protocol: this.#protocols[this.#masterIndex],
      conn: this.#connections[this.#masterIndex],
    };
  }

  get protocol() {
    const protocol = this.getMaster().protocol;
    assert(protocol);
    return protocol;
  }

  close() {
    this.#connections.forEach((connection) => {
      try {
        Deno.close(connection.rid);
      } catch (error) {
        console.error(`Error closing connection: ${error}`);
      }
    });
  }
}
