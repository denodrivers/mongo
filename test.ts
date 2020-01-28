import { MongoClient } from "./mod.ts";
import { test, runTests } from "https://deno.land/std/testing/mod.ts";

function getClient(): MongoClient {
  const client = new MongoClient();
  client.connectWithUri("mongodb://localhost:27017");
  return client;
}

test(async function testConnectWithUri() {
  const client = new MongoClient();
  client.connectWithUri("mongodb://localhost:27017");
  const names = await client.listDatabases();
  console.log(names);
});

test(async function testConnectWithOptions() {
  const client = new MongoClient();
  client.connectWithOptions({
    hosts: ["localhost:27017"]
  });
  const names = await client.listDatabases();
  console.log(names);
});

test(async function testListCollectionNames() {
  const db = getClient().database("local");
  const names = await db.listCollectionNames();
  console.log(names);
});

runTests();
