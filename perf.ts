import { assert, assertEquals } from "./deps.ts";
import { Document, MongoClient } from "./mod.ts";
// import {
//   Document,
//   MongoClient,
// } from "https://raw.githubusercontent.com/denodrivers/deno_mongo/main/mod.ts";
const client = new MongoClient();

await client.connect("mongodb://localhost:27017");
console.log("mongodb connected");

const db = client.database("app");
const col = db.collection<Document>("events");

// 1000 times
const times: number[] = [];

for (let i = 0; i < 100; i++) {
  const t0 = performance.now();
  const result = await col.find({}).toArray();
  const t1 = performance.now();
  assertEquals(result.length, 494);
  times.push(t1 - t0);
}

const mean = times.reduce((a, b) => a + b, 0) / times.length;

console.log(`took ${mean} ms`);
