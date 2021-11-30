# deno_mongo

> **deno_mongo** is a **MongoDB** database driver developed for deno

[![tag](https://img.shields.io/github/tag/manyuanrong/deno_mongo.svg)](https://github.com/manyuanrong/deno_mongo/releases)
[![Build Status](https://github.com/manyuanrong/deno_mongo/workflows/ci/badge.svg?branch=main)](https://github.com/manyuanrong/deno_mongo/actions)
[![license](https://img.shields.io/github/license/manyuanrong/deno_mongo.svg)](https://github.com/manyuanrong/deno_mongo)
[![Discord server](https://img.shields.io/discord/768918486575480863?color=blue&label=Ask%20for%20help%20here&logo=discord&style=flat-square)](https://discord.gg/HEdTCvZUSf)

## Links

- [Docs](https://doc.deno.land/https/deno.land/x/mongo/mod.ts)
- [Benchmarks]() TODO

## Examples

### Import

Replace `LATEST_VERSION` with
[current latest version](https://deno.land/x/mongo)

```ts
import {
  Bson,
  MongoClient,
} from "https://deno.land/x/mongo@LATEST_VERSION/mod.ts";
```

### Connect

```ts
const client = new MongoClient();

// Connecting to a Local Database
await client.connect("mongodb://localhost:27017");

// Connecting to a Mongo Atlas Database
await client.connect({
  db: "<db_name>",
  tls: true,
  servers: [
    {
      host: "<db_cluster_url>",
      port: 27017,
    },
  ],
  credential: {
    username: "<username>",
    password: "<password>",
    db: "<db_name>",
    mechanism: "SCRAM-SHA-1",
  },
});

// Connect using srv url
await client.connect(
  "mongodb+srv://<username>:<password>@<db_cluster_url>/<db_name>?authMechanism=SCRAM-SHA-1",
);
```

### Access Collection

```ts
// Defining schema interface
interface UserSchema {
  _id: Bson.ObjectId;
  username: string;
  password: string;
}

const db = client.database("test");
const users = db.collection<UserSchema>("users");
```

### Insert

```ts
const insertId = await users.insertOne({
  username: "user1",
  password: "pass1",
});

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
```

### Find

```ts
const user1 = await users.findOne({ _id: insertId });

const all_users = await users.find({ username: { $ne: null } }).toArray();

// find by ObjectId
const user1_id = await users.findOne({
  _id: new Bson.ObjectId("SOME OBJECTID STRING"),
});
```

### Count

```ts
const count = await users.countDocuments({ username: { $ne: null } });

const estimatedCount = await users.estimatedDocumentCount({
  username: { $ne: null },
});
```

### Aggregation

```ts
const docs = await users.aggregate([
  { $match: { username: "many" } },
  { $group: { _id: "$username", total: { $sum: 1 } } },
]).toArray();
```

### Update

```ts
const { matchedCount, modifiedCount, upsertedId } = await users.updateOne(
  { username: { $ne: null } },
  { $set: { username: "USERNAME" } },
);

const { matchedCount, modifiedCount, upsertedId } = await users.updateMany(
  { username: { $ne: null } },
  { $set: { username: "USERNAME" } },
);
```

### Replace

```ts
const { matchedCount, modifiedCount, upsertedId } = await users.replaceOne(
  { username: "a" },
  {
    username: "user1",
    password: "pass1",
  }, // new document
);
```

### Delete

```ts
const deleteCount = await users.deleteOne({ _id: insertId });

const deleteCount2 = await users.deleteMany({ username: "test" });
```

### Cursor methods

```ts
const cursor = users.find();

// Skip & Limit
cursor.skip(10).limit(10);

// iterate results
for await (const user of cursor) {
  console.log(user);
}

// or save results to array (uses more memory)
const users = await cursor.toArray();
```

### GridFS

```ts
// Upload
const bucket = new GridFSBucket(db);
const upstream = bucket.openUploadStream("test.txt");

const writer = upstream.getWriter();
writer.write(fileContents);

await writer.close();

// Download
const file = await new Response(bucket.openDownloadStream(id)).text();
```

## Contributing

### Command to be implemented

https://docs.mongodb.com/manual/reference/command/

### API style refer to

http://mongodb.github.io/node-mongodb-native/3.6/api/
