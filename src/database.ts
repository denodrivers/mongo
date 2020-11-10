import { Collection } from "./collection.ts";
import { WireProtocol } from "./protocol/mod.ts";

export class Database {
  #protocol: WireProtocol;

  constructor(protocol: WireProtocol, readonly name: string) {
    this.#protocol = protocol;
  }

  collection(name: string): Collection {
    return new Collection(this.#protocol, this.name, name);
  }
}
