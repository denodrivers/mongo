import { MongoClient } from "./lib.ts";
import { test, runTests } from "https://deno.land/std/testing/mod.ts";

test(async function testConnectWithUri() {
  const client = new MongoClient();
  client.connectWithUri("mongodb://root:root@localhost:27017");
  const names = await client.listDatabases();
  console.log(names);
});

test(async function testConnectWithOptions() {
  const client = new MongoClient();
  client.connectWithOptions({
    hosts: ["localhost:27017"],
    username: "root",
    password: "root"
  });
  const names = await client.listDatabases();
  console.log(names);
});

runTests();
