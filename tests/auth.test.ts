import { assert } from "./test.deps.ts";
import { testWithClient } from "./common.ts";
import { MongoClient } from "../src/client.ts";

const hostname = "127.0.0.1";

testWithClient("createUser", async (client) => {
  const db = client.database("test");
  await db.createUser("user1", "y3mq3mpZ3J6PGfgg");
});
Deno.test("connect authorization test 1 - test db", async () => {
  var username = "user1";
  var password = "y3mq3mpZ3J6PGfgg";
  const client = new MongoClient();
  await client.connect(
    `mongodb://${username}:${password}@${hostname}:27017/test`,
  );
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
  client.close();
});
testWithClient("dropUser", async (client) => {
  const db = client.database("test");
  await db.dropUser("user1");
});

testWithClient("createUser", async (client) => {
  const db = client.database("test");
  await db.createUser("user2", "Qa6WkQSuXF425sWZ");
});
Deno.test("connect authorization test 2 - test db", async () => {
  var username = "user2";
  var password = "Qa6WkQSuXF425sWZ";
  const client = new MongoClient();
  await client.connect(
    `mongodb://${username}:${password}@${hostname}:27017/test`,
  );
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
  client.close();
});
testWithClient("dropUser", async (client) => {
  const db = client.database("test");
  await db.dropUser("user2");
});
