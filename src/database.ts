import { Collection } from "./collection/mod.ts";
import { CommandCursor, WireProtocol } from "./protocol/mod.ts";
import { Document } from "./types.ts";

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

export class Database {
  #protocol: WireProtocol;

  constructor(protocol: WireProtocol, readonly name: string) {
    this.#protocol = protocol;
  }

  collection<T>(name: string): Collection<T> {
    return new Collection(this.#protocol, this.name, name);
  }

  listCollections(options?: {
    filter?: Document;
    nameOnly?: boolean;
    authorizedCollections?: boolean;
    comment?: Document;
  }): CommandCursor<ListCollectionsResult> {
    if (!options) {
      options = {};
    }
    return new CommandCursor<ListCollectionsResult>(
      this.#protocol,
      async () => {
        const { cursor } = await this.#protocol.commandSingle<
          ListCollectionsReponse
        >(this.name, {
          listCollections: 1,
          ...options,
          batchSize: 1,
        });
        return {
          id: cursor.id,
          ns: cursor.ns,
          firstBatch: cursor.firstBatch,
        };
      },
    );
  }

  async listCollectionNames(options?: {
    filter?: Document;
    authorizedCollections?: boolean;
    comment?: Document;
  }): Promise<string[]> {
    const cursor = this.listCollections({
      ...options,
      nameOnly: true,
      authorizedCollections: true,
    });
    const names: string[] = [];
    for await (const item of cursor) {
      names.push(item!.name);
    }
    return names;
  }
}
