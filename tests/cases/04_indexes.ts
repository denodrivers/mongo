import { testWithClient } from "../common.ts";
import { assertEquals } from "../test.deps.ts";

export default function indexesTests() {
  testWithClient("createIndexes", async (client) => {
    const db = client.database("test");
    const users = db.collection("mongo_test_users");
    const res = await users.createIndexes({
      indexes: [{
        name: "_name",
        key: { name: 1 },
      }],
    });
    assertEquals(
      res,
      {
        createdCollectionAutomatically: false,
        numIndexesBefore: 1,
        numIndexesAfter: 2,
        ok: 1,
      },
    );
  });

  testWithClient("listIndexes", async (client) => {
    const db = client.database("test");
    const users = db.collection("mongo_test_users");
    const cursor = users.listIndexes();
    const indexes = await cursor.toArray();
    assertEquals(
      indexes,
      [
        { v: 2, key: { _id: 1 }, name: "_id_", ns: "test.mongo_test_users" },
        { v: 2, key: { name: 1 }, name: "_name", ns: "test.mongo_test_users" },
      ],
    );
  });
}
