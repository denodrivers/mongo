import { assert, assertEquals, describe, it } from "../test.deps.ts";
import { MongoClient } from "../../src/client.ts";
import {
  afterEach,
  beforeEach,
} from "https://deno.land/std@0.201.0/testing/bdd.ts";

const hostname = "127.0.0.1";

describe("connect", () => {
  let client: MongoClient;

  beforeEach(() => {
    client = new MongoClient();
  });

  afterEach(() => {
    client.close();
  });

  it("test connect", async () => {
    await client.connect(`mongodb://${hostname}:27017`);
    const names = await client.listDatabases();
    assert(names instanceof Array);
    assert(names.length > 0);
  });

  it("test connect With Options", async () => {
    await client.connect({
      servers: [{ host: hostname, port: 27017 }],
      db: "admin",
    });
    const names = await client.listDatabases();
    assert(names instanceof Array);
    assert(names.length > 0);
  });

  it("test default database name from connection options", async () => {
    await client.connect(`mongodb://${hostname}:27017/my-db`);
    const db = client.database();
    assertEquals(db.name, "my-db");
  });

  it("runCommand", async () => {
    await client.connect(`mongodb://${hostname}:27017`);
    const { databases, ok } = await client.runCommand("admin", {
      listDatabases: 1,
    });
    assert(databases.length > 0);
    assertEquals(ok, 1);
  });
});
