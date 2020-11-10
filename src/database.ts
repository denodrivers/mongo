import { Collection } from "./collection.ts";
import { WireProtocol } from "./protocol/mod.ts";
import { Document } from "./types.ts";

export class Database {
  #protocol: WireProtocol;

  constructor(protocol: WireProtocol, readonly name: string) {
    this.#protocol = protocol;
  }

  collection(name: string): Collection {
    return new Collection(this.#protocol, this.name, name);
  }

  async listCollections(options?: {
    filter?: Document;
    nameOnly?: boolean;
    authorizedCollections?: boolean;
    comment?: Document;
  }): Promise<any[]> {
    if (!options) {
      options = {};
    }
    const res = await this.#protocol.command(this.name, {
      listCollections: 1,
      ...options,
    });

    console.log(JSON.stringify(res, undefined, 2));
    return [];
  }

  async listCollectionNames(options?: {
    filter?: Document;
    authorizedCollections?: boolean;
    comment?: Document;
  }): Promise<string[]> {
    const collections = await this.listCollections({
      ...options,
      nameOnly: true,
      authorizedCollections: true,
    });
    return collections.map((c) => c.name);
  }
}
