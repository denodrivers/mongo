import { MongoClient } from "./src/client.ts";
import { assert, assertEquals } from "./test.deps.ts";
interface IUser {
  username: string;
  password: string;
  _id: { $oid: string };
  date?: Date;
}
const { test } = Deno;
const dateNow = Date.now();

async function testWithClient(
  name: string,
  fn: (client: MongoClient) => void | Promise<void>,
) {
  test(name, async () => {
    const client = await getClient();
    await fn(client);
    client.close();
  });
}

async function getClient(): Promise<MongoClient> {
  const client = new MongoClient();
  await client.connect("mongodb://localhost:27017");
  return client;
}

test("testConnectWithUri", async () => {
  const client = new MongoClient();
  await client.connect("mongodb://localhost:27017");
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
  client.close();
});

test("testConnectWithOptions", async () => {
  const client = new MongoClient();
  await client.connect({
    servers: [{ host: "localhost", port: 27017 }],
  });
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
  client.close();
});

testWithClient("testListCollectionNames", async (client) => {
  const db = client.database("local");
  const names = await db.listCollectionNames();
  assertEquals(names, ["startup_log"]);
});

testWithClient("testInsertOne", async (client) => {
  const db = client.database("test");
  const users = db.collection<IUser>("mongo_test_users");
  const insertId = await users.insertOne({
    username: "user1",
    password: "pass1",
    date: new Date(dateNow),
  });

  assertEquals(insertId.toString().length, 24);

  const user1 = await users.findOne({
    _id: insertId,
  });

  assertEquals(user1, {
    _id: insertId,
    username: "user1",
    password: "pass1",
    date: new Date(dateNow),
  });
});

// test("testUpsertOne", async () => {
//   const db = getClient().database("test");
//   const users = db.collection<IUser>("mongo_test_users");
//   const { upsertedId } = await users.updateOne(
//     {
//       _id: ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa"),
//     },
//     {
//       username: "user1",
//       password: "pass1",
//       date: new Date(dateNow),
//     },
//     { upsert: true },
//   );

//   assert(upsertedId);
//   assertEquals(Object.keys(upsertedId), ["$oid"]);

//   const user1 = await users.findOne({
//     _id: ObjectId(upsertedId.$oid),
//   });

//   assertEquals(user1, {
//     _id: upsertedId,
//     username: "user1",
//     password: "pass1",
//     date: new Date(dateNow),
//   });
// });

// test("testInsertOneTwice", async () => {
//   const db = getClient().database("test");
//   const users = db.collection<IUser>("mongo_test_users_2");
//   const insertId: ObjectId = await users.insertOne({
//     _id: ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa"),
//     username: "user1",
//   });

//   await assertThrowsAsync(
//     () =>
//       users.insertOne({
//         _id: ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa"),
//         username: "user1",
//       }) as any,
//     undefined,
//     "E11000",
//   );
// });

testWithClient("testFindOne", async (client) => {
  const db = client.database("test");
  const users = db.collection<IUser>("mongo_test_users");
  const user1 = await users.findOne();
  assertEquals(Object.keys(user1!), ["_id", "username", "password", "date"]);

  const query = { test: 1 };
  const findNull = await users.findOne(query);
  assertEquals(findNull, undefined);
  const projectionUser = await users.findOne({},{projection:{_id:0,username:1}});
  assertEquals(Object.keys(projectionUser!),["username"]);
  const projectionUserWithId = await users.findOne({},{projection:{username:1}});
  assertEquals(Object.keys(projectionUserWithId!),['_id','username']);
});

// test("testUpdateOne", async () => {
//   const db = getClient().database("test");
//   const users = db.collection("mongo_test_users");
//   const result = await users.updateOne({}, { username: "USER1" });
//   assertEquals(result, { matchedCount: 1, modifiedCount: 1, upsertedId: null });
// });

// test("testDeleteOne", async () => {
//   const db = getClient().database("test");
//   const users = db.collection("mongo_test_users");
//   const deleteCount = await users.deleteOne({});
//   assertEquals(deleteCount, 1);
// });

// test("testInsertMany", async () => {
//   const db = getClient().database("test");
//   const users = db.collection("mongo_test_users");
//   const insertIds = await users.insertMany([
//     {
//       username: "many",
//       password: "pass1",
//     },
//     {
//       username: "many",
//       password: "pass2",
//     },
//   ]);

//   assertEquals(insertIds.length, 2);
// });

// test("testFindOr", async () => {
//   const db = getClient().database("test");
//   const users = db.collection<IUser>("mongo_test_users");
//   const user1 = await users.find({
//     $or: [
//       {
//         password: "pass1",
//       },
//       {
//         password: "pass2",
//       },
//     ],
//   });

//   assert(user1 instanceof Array);
//   assertEquals(user1.length, 3);
// });

// test("testFind", async () => {
//   const db = getClient().database("test");
//   const users = db.collection("mongo_test_users");
//   const findUsers = await users.find(
//     { username: "many" },
//     { skip: 1, limit: 1 },
//   );
//   assert(findUsers instanceof Array);
//   assertEquals(findUsers.length, 1);

//   const notFound = await users.find({ test: 1 });
//   assertEquals(notFound, []);
// });

// test("testCount", async () => {
//   const db = getClient().database("test");
//   const users = db.collection("mongo_test_users");
//   const count = await users.count({ username: "many" });
//   assertEquals(count, 2);
// });

// test("testAggregation", async () => {
//   const db = getClient().database("test");
//   const users = db.collection("mongo_test_users");
//   const docs = await users.aggregate([
//     { $match: { username: "many" } },
//     { $group: { _id: "$username", total: { $sum: 1 } } },
//   ]);
//   assertEquals(docs, [{ _id: "many", total: 2 }]);
// });

// test("testUpdateMany", async () => {
//   const db = getClient().database("test");
//   const users = db.collection("mongo_test_users");
//   const result = await users.updateMany(
//     { username: "many" },
//     { $set: { username: "MANY" } },
//   );
//   assertEquals(result, { matchedCount: 2, modifiedCount: 2, upsertedId: null });
// });

// test("testDeleteMany", async () => {
//   const db = getClient().database("test");
//   const users = db.collection("mongo_test_users");
//   const deleteCount = await users.deleteMany({ username: "MANY" });
//   assertEquals(deleteCount, 2);
// });

// test("testDistinct", async () => {
//   const db = getClient().database("test");
//   const users = db.collection<IUser>("mongo_test_users");
//   const user1 = await users.distinct("username");
//   assertEquals(user1, ["user1"]);
// });

// // TODO mongdb_rust official library has not implemented this feature
// // test("testCreateIndexes", async () => {
// //   const db = getClient().database("test");
// //   const collection = db.collection("mongo_indexes");
// //   const result = await collection.createIndexes([
// //     { keys: { created_at: 1 }, options: { expireAfterSeconds: 10000 } }
// //   ]);
// //   console.log(result);
// // });

// test("testDropConnection", async () => {
//   const db = getClient().database("test");
//   db.collection("mongo_test_users_2").drop();
//   db.collection("mongo_test_users").drop();
//   // assertEquals(result, { success: true });
// });
