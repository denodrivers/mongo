import { assert } from "./test.deps.ts";
import { MongoClient } from "../src/client.ts";

const hostname = "127.0.0.1";

Deno.test("testConnectWithUri", async () => {
  const client = new MongoClient();
  await client.connect(`mongodb://${hostname}:27017`);
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
  client.close();
});

Deno.test("testConnectWithOptions", async () => {
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
