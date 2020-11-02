import { Bson } from "../../deps.ts";

export type BsonObject = any;

export function serializeBson(target: BsonObject): Uint8Array {
  return Bson.serialize(target);
}

export function deserializeBson(buffer: Uint8Array): BsonObject {
  return Bson.deserialize(buffer);
}
