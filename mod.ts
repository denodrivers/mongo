import { init } from "./ts/util.ts";

export * from "./ts/client.ts";
export * from "./ts/collection.ts";
export * from "./ts/database.ts";
export * from "./ts/result.ts";
export { ObjectId, UpdateOptions } from "./ts/types.ts";
export * from "./ts/util.ts";
export const VERSION = "v0.11.1";
export const RELEASE_URL =
  `https://github.com/manyuanrong/deno_mongo/releases/download/${VERSION}`;

await init(RELEASE_URL);
