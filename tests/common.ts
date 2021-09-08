import { MongoClient } from "../mod.ts";

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

export function compareVersion(
  client: MongoClient,
  version: number[],
  skipPatch = true,
) {
  const [thisMajor, thisMinor, thisPatch] = client.buildInfo?.versionArray!;
  const [major, minor, patch] = version;

  return compareNumber(thisMajor, major) ||
    compareNumber(thisMinor, minor) ||
    (skipPatch ? 0 : compareNumber(thisPatch, patch));
}

function compareNumber(a: number, b: number) {
  return a === b ? 0 : a > b ? 1 : -1;
}

async function getClient(): Promise<MongoClient> {
  const client = new MongoClient();
  await client.connect(`mongodb://${hostname}:27017`);
  return client;
}
