import { Database, MongoClient, ObjectId } from "../../mod.ts";
import {
  MongoInvalidArgumentError,
  MongoServerError,
} from "../../src/error.ts";
import { CreateCollectionOptions } from "../../src/types.ts";
import { cleanTestDb, getTestDb } from "../common.ts";
import {
  afterEach,
  assert,
  assertEquals,
  assertRejects,
  beforeEach,
  describe,
  it,
  semver,
} from "../test.deps.ts";

interface User {
  _id: string | ObjectId;
  username?: string;
  password?: string;
  uid?: number;
  date?: Date;
}

interface ComplexUser {
  _id: string | ObjectId;
  username?: string;
  password?: string;
  friends: string[];
  likes: {
    drinks: string[];
    food: string[];
    hobbies: {
      indoor: string[];
      outdoor: string[];
    };
  };
}

const dateNow = Date.now();

describe("crud operations", () => {
  let client: MongoClient;
  let database: Database;
  const testCollectionName = "mongo_test_users";

  beforeEach(async () => {
    ({ client, database } = await getTestDb());
  });

  afterEach(async () => {
    await cleanTestDb(client, database, testCollectionName);
  });

  it("testListCollectionNames", async () => {
    const users = database.collection<User>(testCollectionName);
    await users.insertOne({
      username: "user1",
      password: "pass1",
    });
    const names = await database.listCollectionNames();
    assertEquals(names, [testCollectionName]);
  });

  it("testInsertOne", async () => {
    const users = database.collection<User>(testCollectionName);
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

  it("testUpsertOne", async () => {
    const users = database.collection<User>(testCollectionName);
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

  it("testInsertOneTwice", async () => {
    const users = database.collection<User>(testCollectionName);
    await users.insertOne({
      _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      username: "user1",
    });

    await assertRejects(
      () =>
        users.insertOne({
          _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
          username: "user1",
        }),
      MongoServerError,
      "E11000",
    );
  });

  it("testFindOne", async () => {
    const users = database.collection<User>(testCollectionName);
    await users.insertOne({
      username: "user1",
      password: "pass1",
      date: new Date(dateNow),
    });
    const user1 = await users.findOne();
    assertEquals(Object.keys(user1!), ["_id", "username", "password", "date"]);

    const query = { username: "does not exist" };
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

  it("testFindOneWithNestedDocument", async () => {
    const users = database.collection<ComplexUser>("mongo_test_users");
    await users.insertOne({
      username: "user1",
      password: "pass1",
      friends: ["Alice", "Bob"],
      likes: {
        drinks: ["coffee", "tea"],
        food: ["pizza", "pasta"],
        hobbies: {
          indoor: ["puzzles", "reading"],
          outdoor: ["hiking", "climbing"],
        },
      },
    });
    const user1 = await users.findOne({
      "likes.hobbies.outdoor": { $elemMatch: { $eq: "climbing" } },
    });
    assertEquals(Object.keys(user1!), [
      "_id",
      "username",
      "password",
      "friends",
      "likes",
    ]);
  });

  it("testFindOneWithNestedDocument", async () => {
    const users = database.collection<ComplexUser>("mongo_test_users");
    await users.insertOne({
      username: "user1",
      password: "pass1",
      friends: ["Alice", "Bob"],
      likes: {
        drinks: ["coffee", "tea"],
        food: ["pizza", "pasta"],
        hobbies: {
          indoor: ["puzzles", "reading"],
          outdoor: ["hiking", "climbing"],
        },
      },
    });
    const user1 = await users.findOne({
      "likes.hobbies.outdoor": { $elemMatch: { $eq: "climbing" } },
    });
    assertEquals(Object.keys(user1!), [
      "_id",
      "username",
      "password",
      "friends",
      "likes",
    ]);
  });

  it("testInsertMany", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testFindAndModify-notfound", async () => {
    const users = database.collection<{ username: string; counter: number }>(
      "mongo_test_users",
    );

    const find = await users.findAndModify(
      {
        // this query matches no document
        $and: [{ username: "a" }, { username: "b" }],
      },
      {
        update: { $inc: { counter: 1 } },
        new: false,
      },
    );

    assert(find === null);
    assert(find !== undefined);
  });

  it("testFindAndModify-update", async () => {
    const users = database.collection<{ username: string; counter: number }>(
      "mongo_test_users",
    );
    await users.insertOne({ username: "counter", counter: 5 });
    const updated = await users.findAndModify({ username: "counter" }, {
      update: { $inc: { counter: 1 } },
      new: true,
    });

    assert(updated !== null);
    assertEquals(updated.counter, 6);
    assertEquals(updated.username, "counter");
  });

  it("testFindAndModify-delete", async () => {
    const users = database.collection<{ username: string; counter: number }>(
      "mongo_test_users",
    );
    await users.insertOne({ username: "delete", counter: 10 });
    const updated = await users.findAndModify({ username: "delete" }, {
      remove: true,
    });

    assert(updated !== null);
    assertEquals(updated.counter, 10);
    assertEquals(updated.username, "delete");

    const tryFind = await users.findOne({ username: "delete" });
    assertEquals(tryFind, undefined);
  });

  it("test chain call for Find", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testUpdateOne", async () => {
    const users = database.collection<User>("mongo_test_users");
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
  it("testUpdateOneWithPush", async () => {
    const users = database.collection<ComplexUser>("mongo_test_users");
    await users.insertOne({
      likes: {
        food: ["pizza", "pasta"],
        drinks: [],
        hobbies: { indoor: [], outdoor: [] },
      },
      friends: ["Alice", "Bob"],
    });
    const result = await users.updateOne({}, {
      $push: { friends: { $each: ["Carol"] } },
    });
    assertEquals(result, {
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: undefined,
    });
  });
  it("testUpdateOneWithPull", async () => {
    const users = database.collection<ComplexUser>("mongo_test_users");
    await users.insertOne({
      likes: {
        food: ["pizza", "pasta"],
        drinks: [],
        hobbies: { indoor: [], outdoor: [] },
      },
      friends: ["Alice", "Bob"],
    });
    const result = await users.updateOne({}, {
      $pull: { friends: "Bob" },
    });
    assertEquals(result, {
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: undefined,
    });
  });
  it("testUpdateOneWithNestedPush", async () => {
    const users = database.collection<ComplexUser>("mongo_test_users");
    await users.insertOne({
      likes: {
        food: ["pizza", "pasta"],
        drinks: [],
        hobbies: { indoor: [], outdoor: [] },
      },
      friends: ["Alice", "Bob"],
    });
    const result = await users.updateOne({}, {
      $push: { "likes.hobbies.indoor": "board games" },
    });
    assertEquals(result, {
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: undefined,
    });
  });
  it("testUpdateOneWithNestedPullAll", async () => {
    const users = database.collection<ComplexUser>("mongo_test_users");
    await users.insertOne({
      likes: {
        food: ["pizza", "pasta"],
        drinks: [],
        hobbies: { indoor: ["board games", "cooking"], outdoor: [] },
      },
      friends: ["Alice", "Bob"],
    });
    const result = await users.updateOne({}, {
      $pullAll: { "likes.hobbies.indoor": ["board games", "cooking"] },
    });
    assertEquals(result, {
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: undefined,
    });
  });
  it("testUpdateOneWithNestedPull", async () => {
    const users = database.collection<ComplexUser>("mongo_test_users");
    await users.insertOne({
      likes: {
        food: ["pizza", "pasta"],
        drinks: [],
        hobbies: { indoor: ["board games", "cooking"], outdoor: [] },
      },
      friends: ["Alice", "Bob"],
    });
    const result = await users.updateOne({}, {
      $pull: { "likes.hobbies.indoor": "board games" },
    });
    assertEquals(result, {
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: undefined,
    });
  });

  it("testUpdateOne Error", async () => { // TODO: move tesr errors to a new file
    const users = database.collection<User>("mongo_test_users");
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

  it("testUpdateOneWithUpsert", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testReplaceOne", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testDeleteOne", async () => {
    const users = database.collection<User>("mongo_test_users");
    await users.insertOne({
      username: "user1",
      password: "pass1",
    });
    const deleteCount = await users.deleteOne({});
    assertEquals(deleteCount, 1);
  });

  it("testFindOr", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testFind", async () => {
    const users = database.collection<User>("mongo_test_users");
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

    const notFound = await users.find({ username: "does not exist" }).toArray();
    assertEquals(notFound, []);
  });

  it("test multiple queries at the same time", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testCount", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testCountDocuments", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testEstimatedDocumentCount", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testAggregation", async () => {
    const users = database.collection<User>("mongo_test_users");
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
      .aggregate<{ _id: string; total: number }>([
        { $match: { username: "many" } },
        { $group: { _id: "$username", total: { $sum: 1 } } },
      ])
      .toArray();
    assertEquals(docs, [{ _id: "many", total: 2 }]);
  });

  it("testUpdateMany", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testDeleteMany", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testDistinct", async () => {
    const users = database.collection<User>("mongo_test_users");
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

  it("testDropConnection", async () => {
    const users = database.collection<User>("mongo_test_users");
    await users.insertOne({
      _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      username: "user1",
      password: "pass1",
    });

    await database.collection("mongo_test_users").drop();
  });

  it("testFindWithSort", async () => {
    const users = database.collection<User>("mongo_test_users");

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

    await database.collection("mongo_test_users").drop();
  });

  it("testFindEmptyAsyncIteration", async () => {
    const users = database.collection<User>("mongo_test_users");
    for (let i = 0; i < 10; i++) {
      await users.insertOne({
        username: "testFindWithSort",
        password: "pass1",
        uid: i,
      });
    }
    const cursor = users.find({ username: "does not exist" });
    const docs = [];
    for await (const doc of cursor) {
      docs.push(doc);
    }
    assertEquals(docs, []);

    await database.collection("mongo_test_users").drop();
  });

  it("testFindWithMaxTimeMS", async () => {
    const supportsMaxTimeMSInFindOne = semver.gte(
      client.buildInfo!.version,
      "4.2.0",
    );

    const users = database.collection<User>("mongo_test_users");
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

    await database.collection("mongo_test_users").drop();
  });

  it(
    "createCollection should create a collection without options",
    async () => {
      const createdCollection = await database
        .createCollection<{ _id: string; name: string }>(
          testCollectionName,
        );

      assert(createdCollection);

      await database.collection(testCollectionName).drop();
    },
  );

  it(
    "createCollection should create a collection with options",
    async () => {
      interface IStudents {
        _id: string;
        name: string;
        year: number;
        major: string;
        gpa?: number;
        address: {
          city: string;
          street: string;
        };
      }

      // Example from https://www.mongodb.com/docs/manual/reference/operator/query/jsonSchema/#mongodb-query-op.-jsonSchema
      const options: CreateCollectionOptions = {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["name", "year", "major", "address"],
            properties: {
              name: {
                bsonType: "string",
                description: "must be a string and is required",
              },
              year: {
                bsonType: "int",
                minimum: 2017,
                maximum: 3017,
                description:
                  "must be an integer in [ 2017, 3017 ] and is required",
              },
              major: {
                enum: ["Math", "English", "Computer Science", "History", null],
                description:
                  "can only be one of the enum values and is required",
              },
              gpa: {
                bsonType: ["double"],
                description: "must be a double if the field exists",
              },
              address: {
                bsonType: "object",
                required: ["city"],
                properties: {
                  street: {
                    bsonType: "string",
                    description: "must be a string if the field exists",
                  },
                  city: {
                    bsonType: "string",
                    "description": "must be a string and is required",
                  },
                },
              },
            },
          },
        },
      };

      const createdCollection = await database
        .createCollection<IStudents>(
          testCollectionName,
          options,
        );

      assert(createdCollection);

      // sanity test to check whether the speicified validator from options works
      // error with message: "Document failed validation"
      await assertRejects(
        () =>
          createdCollection.insertOne({
            name: "Alice",
            year: 2019,
            major: "History",
            gpa: 3,
            address: {
              city: "NYC",
              street: "33rd Street",
            },
          }),
      );

      // TODO: refactor to clean up the test collection properly.
      // It should clean up the collection when above insertion succeeds in any case, which is unwanted result.
      // Refactor when test utility is more provided.
      await database.collection(testCollectionName).drop();
    },
  );

  it(
    "createCollection should throw an error with invalid options",
    async () => {
      const invalidOptions: CreateCollectionOptions = {
        capped: true,
      };

      await assertRejects(
        () =>
          database.createCollection<{ _id: string; name: string }>(
            testCollectionName,
            invalidOptions,
          ),
        // error with the message "the 'size' field is required when 'capped' is true"
        MongoServerError,
      );
    },
  );
});
