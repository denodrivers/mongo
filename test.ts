import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { MongoClient } from "./mod.ts";

const { test, runTests } = Deno;

function getClient(): MongoClient {
  const client = new MongoClient();
  client.connectWithUri("mongodb://localhost:27017");
  return client;
}

test(async function testConnectWithUri() {
  const client = new MongoClient();
  client.connectWithUri("mongodb://localhost:27017");
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
});

test(async function testConnectWithOptions() {
  const client = new MongoClient();
  client.connectWithOptions({
    hosts: ["localhost:27017"]
  });
  const names = await client.listDatabases();
  assert(names instanceof Array);
  assert(names.length > 0);
});

test(async function testListCollectionNames() {
  const db = getClient().database("local");
  const names = await db.listCollectionNames();
  assertEquals(names, ["startup_log"]);
});

await runTests({ exitOnFail: true });
