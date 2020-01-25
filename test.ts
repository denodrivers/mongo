import { MongoClient } from "./lib.ts";

async function main() {
  const client = new MongoClient();
  client.connectWithUri("mongodb://root:root@localhost:27001");
  const names = await client.listDatabases();
  console.log(names);
}

main();
