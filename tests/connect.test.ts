import { assert } from "./test.deps.ts";
import { MongoClient } from "../src/client.ts";

const hostname = "127.0.0.1";

Deno.test("test connect", async () => {
  const client = new MongoClient();
  await client.connect(`mongodb://${hostname}:27017`);
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
  client.close();
});

Deno.test("testconnect With Options", async () => {
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

Deno.test("connect authorization test 1 - admin db", async () => {
  var username = "user1";
  var password = "y3mq3mpZ3J6PGfgg";
  const client = new MongoClient();
  await client.connect(`mongodb://${username}:${password}@${hostname}:27017`);
  const names = await client.listDatabases();
  console.log(names);
  assert(names instanceof Array);
  assert(names.length > 0);
  client.close();
});

Deno.test("connect authorization test 2 - admin db", async () => {
  var username = "user2";
  var password = "Qa6WkQSuXF425sWZ";
  const client = new MongoClient();
  await client.connect(`mongodb://${username}:${password}@${hostname}:27017`);
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
  client.close();
});
