import { Database, MongoClient } from "../mod.ts";

const hostname = "127.0.0.1";

export function testWithClient(
  name: string,
  fn: (client: MongoClient) => void | Promise<void>,
) {
  Deno.test(name, async () => {
    const client = await getClient();
    await fn(client);
    client.close();
  });
}

export function testWithTestDBClient(
  name: string,
  fn: (db: Database) => void | Promise<void>,
) {
  Deno.test(name, async () => {
    const client = await getClient();
    const db = client.database("test");
    await fn(db);
    await db.collection("mongo_test_users").drop().catch((e) => e);
    client.close();
  });
}

async function getClient(): Promise<MongoClient> {
  const client = new MongoClient();
  await client.connect(`mongodb://${hostname}:27017`);
  return client;
}
