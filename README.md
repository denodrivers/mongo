# deno_mongo

> **deno_mongo** is a **MongoDB** database driver developed for deno, based on rust's official [`mongodb`](https://crates.io/crates/mongodb) library package.

[![tag](https://img.shields.io/github/tag/manyuanrong/deno_mongo.svg)](https://github.com/manyuanrong/deno_mongo)
[![Build Status](https://github.com/manyuanrong/deno_mongo/workflows/ci/badge.svg?branch=master)](https://github.com/manyuanrong/deno_mongo/actions)
[![license](https://img.shields.io/github/license/manyuanrong/deno_mongo.svg)](https://github.com/manyuanrong/deno_mongo)
[![tag](https://img.shields.io/badge/deno-v0.35.0-green.svg)](https://github.com/denoland/deno)

## Links

- [Guides]() TODO
- [Examples]() TODO
- [Benchmarks]() TODO

## Examples

```ts
import { init, MongoClient } from "https://deno.land/x/mongo/mod.ts";

// Initialize the plugin and specify the binary release version (because the binary currently has no idea how to associate the version in ts and the binary)
await init("0.1.0");

const client = new MongoClient();
client.connectWithUri("mongodb://localhost:27017");

const db = getClient().database("test");
const users = db.collection("users");

// insert
const insertId = await users.insertOne({
  username: "user1",
  password: "pass1"
});

// findOne
const user1 = await users.findOne({ _id: insertId });

// deleteOne
const deleteCount = await users.deleteOne({ _id: insertId });
```
