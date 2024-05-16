import { MongoClient, type Database } from "../mod.ts";

const hostname = "127.0.0.1";

export async function getClient(): Promise<MongoClient> {
  const client = new MongoClient();
  await client.connect(`mongodb://${hostname}:27017`);
  return client;
}

export async function getTestDb(): Promise<
  { client: MongoClient; database: Database }
> {
  const client = await getClient();
  return {
    client,
    database: client.database("test"),
  };
}

export async function cleanTestDb(
  client: MongoClient,
  database: Database,
  collectionNames?: string[] | string,
) {
  if (typeof collectionNames === "string") {
    collectionNames = [collectionNames];
  }
  if (collectionNames !== undefined) {
    for (const collectionName of collectionNames) {
      await database.collection(collectionName).drop().catch((e) => e);
    }
  }
  await database.dropDatabase().catch((e) => e);
  client.close();
}
