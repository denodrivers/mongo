import { Database, MongoClient } from "../mod.ts";
import { assertEquals } from "./test.deps.ts";

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

export function assertArrayBufferEquals(
  actual: ArrayBuffer,
  expected: ArrayBuffer,
) {
  assertEquals(arrayBufferEquals(actual, expected), true);
}

export function assertArrayBufferNotEquals(
  actual: ArrayBuffer,
  expected: ArrayBuffer,
) {
  assertEquals(arrayBufferEquals(actual, expected), false);
}

function arrayBufferEquals(buf1: ArrayBuffer, buf2: ArrayBuffer): unknown {
  if (buf1 === buf2) {
    return true;
  }

  if (buf1.byteLength !== buf2.byteLength) {
    return false;
  }

  const view1 = new DataView(buf1);
  const view2 = new DataView(buf2);

  let i = buf1.byteLength;
  while (i--) {
    if (view1.getUint8(i) !== view2.getUint8(i)) {
      return false;
    }
  }

  return true;
}
