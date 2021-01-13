import { testWithClient } from "../common.ts";
import { assert, assertEquals, assertThrowsAsync } from "../test.deps.ts";

interface IUser {
  username: string;
  password: string;
  _id: { $oid: string };
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
        username: "user1",
        password: "pass1",
        date: new Date(dateNow),
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
    const users = db.collection("mongo_test_users");
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

  testWithClient("test chain call for Find", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const user = await users.find().skip(1).limit(1).toArray();
    assertEquals(user!.length > 0, true);
  });

  testWithClient("testUpdateOne", async (client) => {
    const db = client.database("test");
    const users = db.collection("mongo_test_users");
    const result = await users.updateOne({}, { username: "USER1" });
    assertEquals(result, {
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: undefined,
    });
  });

  testWithClient("testUpdateOneWithUpsert", async (client) => {
    const db = client.database("test");
    const users = db.collection("mongo_test_users");
    const result = await users.updateOne(
      { username: "user2" },
      { username: "USER2" },
      { upsert: true },
    );
    assertEquals(result.matchedCount, 1);
    assertEquals(result.modifiedCount, 0);
    assertEquals(result.upsertedCount, 1);
  });

  testWithClient("testDeleteOne", async (client) => {
    const db = client.database("test");
    const users = db.collection("mongo_test_users");
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
    const users = db.collection("mongo_test_users");
    const findUsers = await users
      .find({ username: "many" }, { skip: 1, limit: 1 })
      .toArray();
    assert(findUsers instanceof Array);
    assertEquals(findUsers.length, 1);

    const notFound = await users.find({ test: 1 }).toArray();
    assertEquals(notFound, []);
  });

  testWithClient("testCount", async (client) => {
    const db = client.database("test");
    const users = db.collection("mongo_test_users");
    const count = await users.count({ username: "many" });
    assertEquals(count, 2);
  });

  testWithClient("testAggregation", async (client) => {
    const db = client.database("test");
    const users = db.collection("mongo_test_users");
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
    const users = db.collection("mongo_test_users");
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
    const users = db.collection("mongo_test_users");
    const deleteCount = await users.deleteMany({ username: "MANY" });
    assertEquals(deleteCount, 2);
  });

  testWithClient("testDistinct", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");
    const user1 = await users.distinct("username");
    assertEquals(user1, ["USER2", "user1"]);
  });

  // // TODO mongdb_rust official library has not implemented this feature
  // // testWithClient("testCreateIndexes", async (client) => {
  // //   const db = client.database("test");
  // //   const collection = db.collection("mongo_indexes");
  // //   const result = await collection.createIndexes([
  // //     { keys: { created_at: 1 }, options: { expireAfterSeconds: 10000 } }
  // //   ]);
  // //   console.log(result);
  // // });

  testWithClient("testDropConnection", async (client) => {
    const db = client.database("test");
    await db.collection("mongo_test_users_2").drop();
    await db.collection("mongo_test_users").drop();
  });

  testWithClient("testFindWithSort", async (client) => {
    const db = client.database("test");
    const users = db.collection<IUser>("mongo_test_users");

    const condition = { uid: { $ne: null } };

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
