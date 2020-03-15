import { exists } from "https://deno.land/std@v0.36.0/fs/mod.ts";
import {
  assert,
  assertEquals
} from "https://deno.land/std@v0.36.0/testing/asserts.ts";
import { cargoBuild } from "./build.ts";
import { init, MongoClient } from "./mod.ts";
import "./ts/tests/types-check.test.ts";
import { ObjectId } from "./ts/types.ts";

const { test, runTests } = Deno;

function getClient(): MongoClient {
  const client = new MongoClient();
  client.connectWithUri("mongodb://localhost:27017");
  return client;
}

test(async function testConnectWithUri() {
  const client = new MongoClient();
  client.connectWithUri("mongodb://localhost:27017");
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
});

test(async function testConnectWithOptions() {
  const client = new MongoClient();
  client.connectWithOptions({
    hosts: ["localhost:27017"]
  });
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
});

test(async function testListCollectionNames() {
  const db = getClient().database("local");
  const names = await db.listCollectionNames();
  assertEquals(names, ["startup_log"]);
});

test(async function testInsertOne() {
  const db = getClient().database("test");
  const users = db.collection("mongo_test_users");
  const insertId: ObjectId = await users.insertOne({
    username: "user1",
    password: "pass1"
  });

  assertEquals(Object.keys(insertId), ["$oid"]);

  const user1 = await users.findOne({
    _id: ObjectId(insertId.$oid)
  });

  assertEquals(user1, {
    _id: insertId,
    username: "user1",
    password: "pass1"
  });
});

test(async function testFindOne() {
  const db = getClient().database("test");
  const users = db.collection("mongo_test_users");
  const user1 = await users.findOne();
  assert(user1 instanceof Object);
  assertEquals(Object.keys(user1), ["_id", "username", "password"]);

  const findNull = await users.findOne({ test: 1 });
  assertEquals(findNull, null);
});

test(async function testUpdateOne() {
  const db = getClient().database("test");
  const users = db.collection("mongo_test_users");
  const result = await users.updateOne({}, { username: "USER1" });
  assertEquals(result, { matchedCount: 1, modifiedCount: 1, upsertedId: null });
});

test(async function testDeleteOne() {
  const db = getClient().database("test");
  const users = db.collection("mongo_test_users");
  const deleteCount = await users.deleteOne({});
  assertEquals(deleteCount, 1);
});

test(async function testInsertMany() {
  const db = getClient().database("test");
  const users = db.collection("mongo_test_users");
  const insertIds = await users.insertMany([
    {
      username: "many",
      password: "pass1"
    },
    {
      username: "many",
      password: "pass2"
    }
  ]);

  assertEquals(insertIds.length, 2);
});

test(async function testFind() {
  const db = getClient().database("test");
  const users = db.collection("mongo_test_users");
  const findUsers = await users.find(
    { username: "many" },
    { skip: 1, limit: 1 }
  );
  assert(findUsers instanceof Array);
  assertEquals(findUsers.length, 1);

  const notFound = await users.find({ test: 1 });
  assertEquals(notFound, []);
});

test(async function testAggregation() {
  const db = getClient().database("test");
  const users = db.collection("mongo_test_users");
  const docs = await users.aggregation([
    { $match: { username: "many" } },
    { $group: { _id: "$username", total: { $sum: 1 } } }
  ]);
  assertEquals(docs, [{ _id: "many", total: 2 }]);
});

test(async function testUpdateMany() {
  const db = getClient().database("test");
  const users = db.collection("mongo_test_users");
  const result = await users.updateMany(
    { username: "many" },
    { $set: { username: "MANY" } }
  );
  assertEquals(result, { matchedCount: 2, modifiedCount: 2, upsertedId: null });
});

test(async function testDeleteMany() {
  const db = getClient().database("test");
  const users = db.collection("mongo_test_users");
  const deleteCount = await users.deleteMany({ username: "MANY" });
  assertEquals(deleteCount, 2);
});

if (await exists(".deno_plugins")) {
  await Deno.remove(".deno_plugins", { recursive: true });
}
await cargoBuild();
await init("file://./target/release");
await runTests();
