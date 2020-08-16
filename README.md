# deno_mongo

> **deno_mongo** is a **MongoDB** database driver developed for deno, based on rust's official [`mongodb`](https://crates.io/crates/mongodb) library package.

[![tag](https://img.shields.io/github/tag/manyuanrong/deno_mongo.svg)](https://github.com/manyuanrong/deno_mongo/releases)
[![Build Status](https://github.com/manyuanrong/deno_mongo/workflows/ci/badge.svg?branch=master)](https://github.com/manyuanrong/deno_mongo/actions)
[![license](https://img.shields.io/github/license/manyuanrong/deno_mongo.svg)](https://github.com/manyuanrong/deno_mongo)
[![downloads](https://img.shields.io/github/downloads/manyuanrong/deno_mongo/total)](https://github.com/manyuanrong/deno_mongo)
[![tag](https://img.shields.io/badge/deno-v1.0.5-green.svg)](https://github.com/denoland/deno)

## Links

- [Guides]() TODO
- [Examples]() TODO
- [Benchmarks]() TODO

## Important

Because the plug-in API of Deno is still in an unstable state, the `--unstable` flag needs to be used. The minimum permissions required to run deno_mongo should be

```sh
deno run --allow-net --allow-write --allow-read --allow-plugin --unstable xxx.ts
```

## Examples

```ts
import { MongoClient } from "https://deno.land/x/mongo@v0.10.0/mod.ts";

const client = new MongoClient();
client.connectWithUri("mongodb://localhost:27017");

// Defining schema interface
interface UserSchema {
  _id: { $oid: string };
  username: string;
  password: string;
}

const db = client.database("test");
const users = db.collection<UserSchema>("users");

// insert
const insertId = await users.insertOne({
  username: "user1",
  password: "pass1",
});

// insertMany
const insertIds = await users.insertMany([
  {
    username: "user1",
    password: "pass1",
  },
  {
    username: "user2",
    password: "pass2",
  },
]);

// findOne
const user1 = await users.findOne({ _id: insertId });
// Returns:
// { _id: { $oid: "<oid>" }, username: "user1", password: "pass1" }

// find
const all_users = await users.find({ username: { $ne: null } });

// find by ObjectId
const user1_id = await users.findOne({ _id: { $oid: "<oid>" } });

// count
const count = await users.count({ username: { $ne: null } });

// aggregation
const docs = await users.aggregate([
  { $match: { username: "many" } },
  { $group: { _id: "$username", total: { $sum: 1 } } },
]);

// updateOne
const { matchedCount, modifiedCount, upsertedId } = await users.updateOne(
  { username: { $ne: null } },
  { $set: { username: "USERNAME" } }
);

// updateMany
const { matchedCount, modifiedCount, upsertedId } = await users.updateMany(
  { username: { $ne: null } },
  { $set: { username: "USERNAME" } }
);

// deleteOne
const deleteCount = await users.deleteOne({ _id: insertId });

// deleteMany
const deleteCount2 = await users.deleteMany({ username: "test" });

// Skip
const skipTwo = await users.skip(2).find();

// Limit
const featuredUser = await users.limit(5).find();
```
