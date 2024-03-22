import { assert, assertEquals } from "assert";
import { describe, it } from "bdd";
import { MongoClient } from "../../mod.ts";

describe("command helpers", () => {
  it({
    name: "db.dropDatabase",
    fn: async () => {
      const client = new MongoClient();
      const databaseName = `TEST_DATABASE_MUST_NOT_MATCH_${+new Date()}`;
      const db = await client.connect(
        `mongodb://127.0.0.1:27017/${databaseName}`,
      );
      const collectioName = `${databaseName}_collection`;

      // To create database physically
      await db.createCollection<{ foo: string }>(`${collectioName}`);

      // A sanity check to test existence of the collection inside the test db
      assertEquals((await db.listCollectionNames()).length, 1);
      const result = await db.dropDatabase();

      assert(result);
      assertEquals(result.ok, 1);

      // The collection inside the test db must not exist
      assertEquals((await db.listCollectionNames()).length, 0);

      client.close();
    },
  });
});
