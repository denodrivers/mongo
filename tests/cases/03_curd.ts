import { MongoInvalidArgumentError } from "../../src/error.ts";
import { testWithClient, testWithTestDBClient } from "../common.ts";
import {
  assert,
  assertEquals,
  AssertionError,
  assertRejects,
  semver,
} from "../test.deps.ts";

interface IUser {
  username?: string;
  password?: string;
  _id: string;
  uid?: number;
  date?: Date;
}

const dateNow = Date.now();

testWithClient("testListCollectionNames", async (client) => {
  const db = client.database("local");
  const names = await db.listCollectionNames();
  assertEquals(names, ["startup_log"]);
});

testWithTestDBClient("testInsertOne", async (db) => {
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

testWithTestDBClient("testUpsertOne", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertOne({
    username: "user1",
    password: "pass1",
    date: new Date(dateNow),
  });
  const { upsertedId } = await users.updateOne(
    { _id: "aaaaaaaaaaaaaaaaaaaaaaaa" },
    {
      $set: {
        username: "user2",
        password: "pass2",
        date: new Date(dateNow),
      },
    },
    { upsert: true },
  );

  assert(upsertedId);

  const user2 = await users.findOne({
    _id: upsertedId,
  });

  assertEquals(user2, {
    _id: upsertedId,
    username: "user2",
    password: "pass2",
    date: new Date(dateNow),
  });
});

testWithTestDBClient("testInsertOneTwice", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertOne({
    _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    username: "user1",
  });

  await assertRejects(
    () =>
      users.insertOne({
        _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
        username: "user1",
        // deno-lint-ignore no-explicit-any
      }) as any,
    undefined,
    "E11000",
  );
});

testWithTestDBClient("testFindOne", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertOne({
    username: "user1",
    password: "pass1",
    date: new Date(dateNow),
  });
  const user1 = await users.findOne();
  assertEquals(Object.keys(user1!), ["_id", "username", "password", "date"]);

  const query = { test: 1 };
  const findNull = await users.findOne(query);
  assertEquals(findNull, undefined);
  const projectionUser = await users.findOne(
    {},
    { projection: { _id: 0, username: 1 } },
  );
  assertEquals(Object.keys(projectionUser!), ["username"]);
  const projectionUserWithId = await users.findOne(
    {},
    { projection: { username: 1 } },
  );
  assertEquals(Object.keys(projectionUserWithId!), ["_id", "username"]);
});

testWithTestDBClient("testInsertMany", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  const { insertedCount, insertedIds } = await users.insertMany([
    {
      username: "many",
      password: "pass1",
    },
    {
      username: "many",
      password: "pass2",
    },
  ]);

  assertEquals(insertedCount, 2);
  assertEquals(insertedIds.length, 2);
});

testWithTestDBClient("testFindAndModify-update", async (db) => {
  const users = db.collection<{ username: string; counter: number }>(
    "mongo_test_users",
  );
  await users.insertOne({ username: "counter", counter: 5 });
  const updated = await users.findAndModify({ username: "counter" }, {
    update: { $inc: { counter: 1 } },
    new: true,
  });

  assert(updated !== undefined);
  assertEquals(updated.counter, 6);
  assertEquals(updated.username, "counter");
});

testWithTestDBClient("testFindAndModify-delete", async (db) => {
  const users = db.collection<{ username: string; counter: number }>(
    "mongo_test_users",
  );
  await users.insertOne({ username: "delete", counter: 10 });
  const updated = await users.findAndModify({ username: "delete" }, {
    remove: true,
  });

  assert(updated !== undefined);
  assertEquals(updated.counter, 10);
  assertEquals(updated.username, "delete");

  const tryFind = await users.findOne({ username: "delete" });
  assertEquals(tryFind, undefined);
});

testWithTestDBClient("test chain call for Find", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertMany([
    {
      username: "user1",
      password: "pass1",
    },
    {
      username: "user2",
      password: "pass2",
    },
    {
      username: "user3",
      password: "pass3",
    },
  ]);
  const user = await users.find().skip(1).limit(1).toArray();
  assertEquals(user!.length > 0, true);
});

testWithTestDBClient("testUpdateOne", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertOne({
    username: "user1",
    password: "pass1",
  });
  const result = await users.updateOne({}, { $set: { username: "USER1" } });
  assertEquals(result, {
    matchedCount: 1,
    modifiedCount: 1,
    upsertedCount: 0,
    upsertedId: undefined,
  });
});

testWithTestDBClient("testUpdateOne Error", async (db) => { // TODO: move tesr errors to a new file
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertOne({
    username: "user1",
    password: "pass1",
  });
  try {
    await users.updateOne({}, { username: "USER1" });
    assert(false);
  } catch (e) {
    assert(e instanceof MongoInvalidArgumentError);
  }
});

testWithTestDBClient("testUpdateOneWithUpsert", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertOne({
    username: "user1",
    password: "pass1",
  });
  const result = await users.updateOne(
    { username: "user2" },
    { $set: { username: "USER2" } },
    { upsert: true },
  );
  assertEquals(result.matchedCount, 1);
  assertEquals(result.modifiedCount, 0);
  assertEquals(result.upsertedCount, 1);
});

testWithTestDBClient("testReplaceOne", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertOne({
    username: "user1",
    password: "pass1",
  });
  const result = await users.replaceOne({ username: "user1" }, {
    username: "user2",
  });

  assertEquals(result, {
    matchedCount: 1,
    modifiedCount: 1,
    upsertedCount: 0,
    upsertedId: undefined,
  });
});

testWithTestDBClient("testDeleteOne", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertOne({
    username: "user1",
    password: "pass1",
  });
  const deleteCount = await users.deleteOne({});
  assertEquals(deleteCount, 1);
});

testWithTestDBClient("testFindOr", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertMany([
    {
      username: "user1",
      password: "pass1",
    },
    {
      username: "user2",
      password: "pass1",
    },
    {
      username: "user3",
      password: "pass2",
    },
  ]);
  const user1 = await users
    .find({
      $or: [{ password: "pass1" }, { password: "pass2" }],
    })
    .toArray();
  assert(user1 instanceof Array);
  assertEquals(user1.length, 3);
});

testWithTestDBClient("testFind", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertMany([
    {
      username: "user",
      password: "pass1",
    },
    {
      username: "user",
      password: "pass2",
    },
    {
      username: "user",
      password: "pass3",
    },
  ]);
  const findUsers = await users
    .find({ username: "user" }, { skip: 1, limit: 1 })
    .toArray();
  assert(findUsers instanceof Array);
  assertEquals(findUsers.length, 1);

  const notFound = await users.find({ test: 1 }).toArray();
  assertEquals(notFound, []);
});

testWithTestDBClient("test multiple queries at the same time", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertOne({
    _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    username: "user1",
    password: "pass1",
  });
  const result = await Promise.all([
    users.findOne({}, { projection: { username: 1 } }),
    users.findOne({}, { projection: { username: 1 } }),
    users.findOne({}, { projection: { username: 1 } }),
  ]);

  assertEquals(result, [
    { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", username: "user1" },
    { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", username: "user1" },
    { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", username: "user1" },
  ]);
});

testWithTestDBClient("testCount", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertMany([
    {
      username: "user",
      password: "pass1",
    },
    {
      username: "many",
      password: "pass2",
    },
    {
      username: "many",
      password: "pass3",
    },
  ]);
  const count = await users.count({ username: "many" });
  assertEquals(count, 2);
});

testWithTestDBClient("testCountDocuments", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertMany([
    {
      username: "user1",
      password: "pass1",
    },
    {
      username: "user2",
      password: "pass2",
    },
    {
      username: "many",
      password: "pass3",
    },
    {
      username: "many",
      password: "pass4",
    },
  ]);
  const countAll = await users.countDocuments();
  assertEquals(countAll, 4);

  const count = await users.countDocuments({ username: "many" });
  assertEquals(count, 2);
});

testWithTestDBClient("testEstimatedDocumentCount", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertMany([
    {
      username: "user1",
      password: "pass1",
    },
    {
      username: "user2",
      password: "pass2",
    },
    {
      username: "many",
      password: "pass3",
    },
    {
      username: "many",
      password: "pass4",
    },
  ]);
  const count = await users.estimatedDocumentCount();
  assertEquals(count, 4);
});

testWithTestDBClient("testAggregation", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertMany([
    {
      username: "user1",
      password: "pass1",
    },
    {
      username: "user2",
      password: "pass2",
    },
    {
      username: "many",
      password: "pass3",
    },
    {
      username: "many",
      password: "pass4",
    },
  ]);
  const docs = await users
    .aggregate([
      { $match: { username: "many" } },
      { $group: { _id: "$username", total: { $sum: 1 } } },
    ])
    .toArray();
  assertEquals(docs, [{ _id: "many", total: 2 }]);
});

testWithTestDBClient("testUpdateMany", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertMany([
    {
      username: "user1",
      password: "pass1",
    },
    {
      username: "user2",
      password: "pass2",
    },
    {
      username: "many",
      password: "pass3",
    },
    {
      username: "many",
      password: "pass4",
    },
  ]);
  const result = await users.updateMany(
    { username: "many" },
    { $set: { username: "MANY" } },
  );
  assertEquals(result, {
    matchedCount: 2,
    modifiedCount: 2,
    upsertedCount: 0,
    upsertedIds: undefined,
  });
});

testWithTestDBClient("testDeleteMany", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertMany([
    {
      username: "user1",
      password: "pass1",
    },
    {
      username: "user2",
      password: "pass2",
    },
    {
      username: "many",
      password: "pass3",
    },
    {
      username: "many",
      password: "pass4",
    },
  ]);
  const deleteCount = await users.deleteMany({ username: "many" });
  assertEquals(deleteCount, 2);
});

testWithTestDBClient("testDistinct", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertMany([
    {
      username: "user1",
      password: "pass1",
    },
    {
      username: "user2",
      password: "pass2",
    },
    {
      username: "many",
      password: "pass3",
    },
    {
      username: "many",
      password: "pass4",
    },
  ]);
  const user1 = await users.distinct("username");
  assertEquals(user1, ["many", "user1", "user2"]);
});

testWithTestDBClient("testDropConnection", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  await users.insertOne({
    _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    username: "user1",
    password: "pass1",
  });

  await db.collection("mongo_test_users").drop();
});

testWithTestDBClient("testFindWithSort", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");

  const condition = { uid: { $exists: true } };

  // prepare data
  for (let i = 0; i < 10; i++) {
    await users.insertOne({
      username: "testFindWithSort",
      password: "pass1",
      uid: i,
    });
  }
  const all = await users.find().toArray();

  // test sorting
  const acceding = await users
    .find(condition, { sort: { uid: 1 } })
    .toArray();
  const descending = await users
    .find(condition, { sort: { uid: -1 } })
    .toArray();

  assertEquals(
    acceding,
    all.sort((lhs, rhs) => {
      return lhs.uid! - rhs.uid!;
    }),
  );
  assertEquals(
    descending,
    all.sort((lhs, rhs) => {
      return -lhs.uid! - rhs.uid!;
    }),
  );

  await db.collection("mongo_test_users").drop();
});

testWithTestDBClient("testFindEmptyAsyncIteration", async (db) => {
  const users = db.collection<IUser>("mongo_test_users");
  for (let i = 0; i < 10; i++) {
    await users.insertOne({
      username: "testFindWithSort",
      password: "pass1",
      uid: i,
    });
  }
  const cursor = users.find({ nonexistent: "foo" });
  const docs = [];
  for await (const doc of cursor) {
    docs.push(doc);
  }
  assertEquals(docs, []);

  await db.collection("mongo_test_users").drop();
});

testWithClient("testFindWithMaxTimeMS", async (client) => {
  const db = client.database("local");

  const supportsMaxTimeMSInFindOne = semver.gte(
    client.buildInfo!.version,
    "4.2.0",
  );

  const users = db.collection<IUser>("mongo_test_users");
  for (let i = 0; i < 10; i++) {
    await users.insertOne({
      username: "testFindWithMaxTimeMS",
      password: "pass1",
      uid: i,
    });
  }
  const users1 = await users.find({
    uid: 0,
  }, { maxTimeMS: 100 }).toArray();

  assertEquals(users1.length, 1);

  const user1 = await users.findOne({
    uid: 0,
  }, { maxTimeMS: 100 });

  assertEquals(user1!.uid, 0);

  try {
    await users.find({
      uid: 0,
      $where: "sleep(10) || true",
    }, { maxTimeMS: 1 }).toArray();
    assert(false);
  } catch (e) {
    assertEquals(e.ok, 0);
    assertEquals(e.codeName, "MaxTimeMSExpired");
    assertEquals(e.errmsg, "operation exceeded time limit");
  }

  if (supportsMaxTimeMSInFindOne) {
    try {
      await users.findOne({
        uid: 0,
        $where: "sleep(10) || true",
      }, { maxTimeMS: 1 });
      assert(false);
    } catch (e) {
      assertEquals(e.ok, 0);
      assertEquals(e.codeName, "MaxTimeMSExpired");
      assertEquals(e.errmsg, "operation exceeded time limit");
    }
  }

  await db.collection("mongo_test_users").drop();
});
