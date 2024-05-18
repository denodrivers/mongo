import type { Cluster } from "./cluster.ts";
import { Collection } from "./collection/mod.ts";
import { CommandCursor } from "./protocol/mod.ts";
import type {
  CreateCollectionOptions,
  CreateUserOptions,
  Document,
} from "./types.ts";
import type { WriteConcern } from "./types/read_write_concern.ts";

interface ListCollectionsReponse {
  cursor: {
    id: bigint;
    ns: string;
    firstBatch: [
      {
        name: string;
        type: "collection";
      },
    ];
  };
  ok: 1;
}

export interface ListCollectionsResult {
  name: string;
  type: "collection";
}

/** A Database on a MongoDB Server */
export class Database {
  #cluster: Cluster;

  constructor(cluster: Cluster, readonly name: string) {
    this.#cluster = cluster;
  }

  /** Drop a database, optionally providing a writeConcern */
  async dropDatabase(writeConcern?: WriteConcern): Promise<Document> {
    return await this.#cluster.protocol.commandSingle(this.name, {
      dropDatabase: 1,
      writeConcern,
    });
  }

  /** Get a collection by name */
  collection<T extends Document = Document>(name: string): Collection<T> {
    return new Collection<T>(this.#cluster.protocol, this.name, name);
  }

  /** List all collections in the database */
  listCollections(options: {
    filter?: Document;
    nameOnly?: boolean;
    authorizedCollections?: boolean;
    comment?: Document;
  } = {}): CommandCursor<ListCollectionsResult> {
    return new CommandCursor<ListCollectionsResult>(
      this.#cluster.protocol,
      async () => {
        const { cursor } = await this.#cluster.protocol.commandSingle<
          ListCollectionsReponse
        >(this.name, {
          listCollections: 1,
          ...options,
        });
        return {
          id: cursor.id,
          ns: cursor.ns,
          firstBatch: cursor.firstBatch,
        };
      },
    );
  }

  /** List all collection names in the database */
  async listCollectionNames(options: {
    filter?: Document;
    authorizedCollections?: boolean;
    comment?: Document;
  } = {}): Promise<string[]> {
    const cursor = this.listCollections({
      ...options,
      nameOnly: true,
      authorizedCollections: true,
    });
    const names: string[] = [];
    for await (const item of cursor) {
      names.push(item.name);
    }
    return names;
  }

  /**
   * `createCollection` executes a create command to create a new collection with the specified name and options.
   *
   * https://www.mongodb.com/docs/manual/reference/command/create/#mongodb-dbcommand-dbcmd.create
   */
  async createCollection<T extends Document>(
    name: string,
    options?: CreateCollectionOptions,
  ): Promise<Collection<T>> {
    await this.#cluster.protocol.commandSingle(
      this.name,
      { create: name, ...options },
    );

    return this.collection<T>(name);
  }

  /** Create a user on the Database */
  createUser(
    username: string,
    password: string,
    options?: CreateUserOptions,
  ): Promise<Document> {
    return this.#cluster.protocol.commandSingle(this.name, {
      createUser: options?.username ?? username,
      pwd: options?.password ?? password,
      customData: options?.customData,
      roles: options?.roles ?? [],
      writeConcern: options?.writeConcern,
      authenticationRestrictions: options?.authenticationRestrictions,
      mechanisms: options?.mechanisms,
      digestPassword: options?.digestPassword,
      comment: options?.comment,
    });
  }

  dropUser(username: string, options: {
    writeConcern?: Document;
    comment?: Document;
  } = {}): Promise<Document> {
    return this.#cluster.protocol.commandSingle(this.name, {
      dropUser: username,
      writeConcern: options?.writeConcern,
      comment: options?.comment,
    });
  }

  /** Run a command on the Database */
  // deno-lint-ignore no-explicit-any
  runCommand<T = any>(body: Document): Promise<T> {
    return this.#cluster.protocol.commandSingle(this.name, body);
  }
}
