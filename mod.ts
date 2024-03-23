export { MongoClient } from "./src/client.ts";
export { Database } from "./src/database.ts";
export { Collection } from "./src/collection/mod.ts";
export * from "./src/types.ts";
export * as Bson from "web-bson";
export type Document = Record<string, any>;
export {
  Binary,
  BSONRegExp,
  BSONSymbol,
  Code,
  DBRef,
  Decimal128,
  Double,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  Timestamp,
  UUID,
} from "web-bson";
export { GridFSBucket } from "./src/gridfs/bucket.ts";
