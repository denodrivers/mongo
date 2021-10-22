import { MongoInvalidArgumentError } from "../../src/error.ts";
import { testWithClient } from "../common.ts";
import { assert, assertEquals, assertThrowsAsync } from "../test.deps.ts";

interface IUser {
  username?: string;
  password?: string;
  _id: string;
  uid?: number;
  date?: Date;
}

const dateNow = Date.now();

export default function curdTests() {
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

  testWithClient("testUpsertOne", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const { upsertedId } = await users.updateOne(
      { _id: "aaaaaaaaaaaaaaaaaaaaaaaa" },
      {
        $set: {
          username: "user1",
          password: "pass1",
          date: new Date(dateNow),
        },
      },
      { upsert: true },
    );

    assert(upsertedId);

    const user1 = await users.findOne({
      _id: upsertedId,
    });

    assertEquals(user1, {
      _id: upsertedId,
      username: "user1",
      password: "pass1",
      date: new Date(dateNow),
    });
  });

  testWithClient("testInsertOneTwice", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users_2");
    await users.insertOne({
      _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      username: "user1",
    });

    await assertThrowsAsync(
      () =>
        users.insertOne({
          _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
          username: "user1",
        }) as any,
      undefined,
      "E11000",
    );
  });

  testWithClient("testFindOne", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
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

  testWithClient("testInsertMany", async (client) => {
    const db = client.database("test");
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

  testWithClient("testFindAndModify-update", async (client) => {
    const db = client.database("test");
    const users = db.collection<{ username: string; counter: number }>(
      "find_and_modify",
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

  testWithClient("testFindAndModify-delete", async (client) => {
    const db = client.database("test");
    const users = db.collection<{ username: string; counter: number }>(
      "find_and_modify",
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

  testWithClient("test chain call for Find", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const user = await users.find().skip(1).limit(1).toArray();
    assertEquals(user!.length > 0, true);
  });

  testWithClient("testUpdateOne", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const result = await users.updateOne({}, { $set: { username: "USER1" } });
    assertEquals(result, {
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: undefined,
    });
  });

  testWithClient("testUpdateOne Error", async (client) => { // TODO: move tesr errors to a new file
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    try {
      await users.updateOne({}, { username: "USER1" });
      assert(false);
    } catch (e) {
      assert(e instanceof MongoInvalidArgumentError);
    }
  });

  testWithClient("testUpdateOneWithUpsert", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const result = await users.updateOne(
      { username: "user2" },
      { $set: { username: "USER2" } },
      { upsert: true },
    );
    assertEquals(result.matchedCount, 1);
    assertEquals(result.modifiedCount, 0);
    assertEquals(result.upsertedCount, 1);
  });

  testWithClient("testReplaceOne", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const result = await users.replaceOne({ username: "USER2" }, {
      username: "USER3",
    });

    assertEquals(result, {
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: undefined,
    });
  });

  testWithClient("testDeleteOne", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const deleteCount = await users.deleteOne({});
    assertEquals(deleteCount, 1);
  });

  testWithClient("testFindOr", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const user1 = await users
      .find({
        $or: [{ password: "pass1" }, { password: "pass2" }],
      })
      .toArray();
    assert(user1 instanceof Array);
    assertEquals(user1.length, 3);
  });

  testWithClient("testFind", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const findUsers = await users
      .find({ username: "many" }, { skip: 1, limit: 1 })
      .toArray();
    assert(findUsers instanceof Array);
    assertEquals(findUsers.length, 1);

    const notFound = await users.find({ test: 1 }).toArray();
    assertEquals(notFound, []);
  });

  testWithClient("test multiple queries at the same time", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");

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

  testWithClient("testCount", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const count = await users.count({ username: "many" });
    assertEquals(count, 2);
  });

  testWithClient("testCountDocuments", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const countAll = await users.countDocuments();
    assertEquals(countAll, 4);

    const count = await users.countDocuments({ username: "many" });
    assertEquals(count, 2);
  });

  testWithClient("testEstimatedDocumentCount", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const count = await users.estimatedDocumentCount();
    assertEquals(count, 4);
  });

  testWithClient("testAggregation", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const docs = await users
      .aggregate([
        { $match: { username: "many" } },
        { $group: { _id: "$username", total: { $sum: 1 } } },
      ])
      .toArray();
    assertEquals(docs, [{ _id: "many", total: 2 }]);
  });

  testWithClient("testUpdateMany", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
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

  testWithClient("testDeleteMany", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const deleteCount = await users.deleteMany({ username: "MANY" });
    assertEquals(deleteCount, 2);
  });

  testWithClient("testDistinct", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const user1 = await users.distinct("username");
    assertEquals(user1, ["USER3", "user1"]);
  });

  testWithClient("testDropConnection", async (client) => {
    const db = client.database("test");
    await db.collection("mongo_test_users_2").drop();
    await db.collection("mongo_test_users").drop();
  });

  testWithClient("testFindWithSort", async (client) => {
    const db = client.database("test");
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
  });

  testWithClient("testFindEmptyAsyncIteration", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const cursor = users.find({ nonexistent: "foo" });
    const docs = [];
    for await (const doc of cursor) {
      docs.push(doc);
    }
    assertEquals(docs, []);
  });
}
