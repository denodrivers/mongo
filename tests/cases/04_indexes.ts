import { assertEquals } from "assert";
import { afterEach, beforeEach, describe, it } from "bdd";
import { greaterOrEqual, parse } from "semver";
import { Collection, Database, Document, MongoClient } from "../../mod.ts";
import { cleanTestDb, getTestDb } from "../common.ts";

describe(
  "indexes",
  () => {
    let client: MongoClient;
    let database: Database;
    let collection: Collection<Document>;
    const testCollectionName = "mongo_test_users";

    beforeEach(async () => {
      ({ client, database } = await getTestDb());
      collection = database.collection(testCollectionName);
    });

    afterEach(async () => {
      await cleanTestDb(client, database, testCollectionName);
    });

    it("createIndexes", async () => {
      const res = await collection.createIndexes({
        indexes: [{
          name: "_name",
          key: { name: 1 },
        }],
      });
      assertEquals(
        res,
        {
          createdCollectionAutomatically: true,
          numIndexesBefore: 1,
          numIndexesAfter: 2,
          ok: 1,
        },
      );
    });

    it("listIndexes", async () => {
      await collection.createIndexes({
        indexes: [{
          name: "_name",
          key: { name: 1 },
        }],
      });
      const cursor = collection.listIndexes();
      const indexes = await cursor.toArray();

      const expected = greaterOrEqual(parse(client.buildInfo!.version), {
          major: 4,
          minor: 4,
          patch: 0,
        })
        ? [
          { v: 2, key: { _id: 1 }, name: "_id_" },
          { v: 2, key: { name: 1 }, name: "_name" },
        ]
        : [
          {
            v: 2,
            key: { _id: 1 },
            name: "_id_",
            ns: `test.${testCollectionName}`,
          },
          {
            v: 2,
            key: { name: 1 },
            name: "_name",
            ns: `test.${testCollectionName}`,
          },
        ];
      assertEquals(
        indexes,
        expected,
      );
    });

    it("dropIndexes", async () => {
      await collection.createIndexes({
        indexes: [{
          name: "_name2",
          key: { name: -1 },
        }],
      });

      await collection.dropIndexes({
        index: "*",
      });

      const indexes = await collection.listIndexes().toArray();
      const expected = greaterOrEqual(parse(client.buildInfo!.version), {
          major: 4,
          minor: 4,
          patch: 0,
        })
        ? [
          { v: 2, key: { _id: 1 }, name: "_id_" },
        ]
        : [
          {
            v: 2,
            key: { _id: 1 },
            name: "_id_",
            ns: `test.${testCollectionName}`,
          },
        ];
      assertEquals(
        indexes,
        expected,
      );
    });
  },
);
