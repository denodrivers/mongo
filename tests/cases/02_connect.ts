import { assert, assertEquals } from "../test.deps.ts";
import { MongoClient } from "../../src/client.ts";
import { testWithClient } from "../common.ts";

const hostname = "127.0.0.1";

Deno.test("test connect", async () => {
  const client = new MongoClient();
  await client.connect(`mongodb://${hostname}:27017`);
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
  client.close();
});

Deno.test("test connect With Options", async () => {
  const client = new MongoClient();
  await client.connect({
    servers: [{ host: hostname, port: 27017 }],
    db: "admin",
  });
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
  client.close();
});

Deno.test("test default database name from connection options", async () => {
  const client = new MongoClient();
  await client.connect(`mongodb://${hostname}:27017/my-db`);
  const db = client.database();
  assertEquals(db.name, "my-db");
  client.close();
});

testWithClient("runCommand", async (client) => {
  const { databases, ok } = await client.runCommand("admin", {
    listDatabases: 1,
  });
  assert(databases.length > 0);
  assertEquals(ok, 1);
});
