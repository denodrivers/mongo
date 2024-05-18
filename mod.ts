/**
 * @module
 *
 * # deno_mongo
 *
 * **deno_mongo** is a **MongoDB** driver for Deno which also supports Deno Deploy.
 *
 * ## ATTENTION
 *
 * Deno has support for npm modules now, so you can also use `npm:mongodb`.
 * See [this](https://github.com/denodrivers/mongo/issues/380) for more details.
 *
 * ## Usage
 *
 * Replace `version` with the latest version of the driver.
 *
 * ```ts
 * import { MongoClient } from 'jsr:@db/mongo@version';
 * ```
 *
 * See [the README](https://github.com/denodrivers/mongo) for more examples.
 *
 * ## Other community resources and examples
 *
 * - [atlas_sdk](https://deno.land/x/atlas_sdk) - TypeSafe MongoDB Atlas SDK
 * - [dangoDB](https://github.com/oslabs-beta/dangoDB) - MongoDB ORM for Deno
 * - [deno-deploy-mongo](https://github.com/erfanium/deno-deploy-mongo) - A simple app with Deno, MongoDB, and Oak using MongoDB Atlas
 * - [deno_rest](https://github.com/vicky-gonsalves/deno_rest) - An Oak-based template for RESTful APIs using this driver
 * - [denomongo-unittest-utils](https://github.com/Gang-of-Fork/denomongo-unittest-utils) - Mock collection for unit tests
 */

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
} from "./deps.ts";
export { MongoClient } from "./src/client.ts";
export { Collection } from "./src/collection/mod.ts";
export { Database } from "./src/database.ts";
export { GridFSBucket } from "./src/gridfs/bucket.ts";
export * from "./src/types.ts";
