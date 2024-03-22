import { assert, assertEquals, assertNotEquals } from "assert";
import { afterAll, afterEach, beforeEach, describe, it } from "bdd";
import { GridFSBucket, MongoClient } from "../../mod.ts";
import { getClient } from "../common.ts";

async function streamReadAll(readable: ReadableStream): Promise<Uint8Array> {
  return new Uint8Array(await new Response(readable).arrayBuffer());
}

describe("GridFS", () => {
  let client: MongoClient;
  const testDatabaseName = "test";

  beforeEach(async () => {
    client = await getClient();
  });

  afterEach(() => {
    client.close();
  });

  afterAll(async () => {
    const client = await getClient();
    const database = client.database(testDatabaseName);

    await new GridFSBucket(database, { bucketName: "deno_logo" })
      .drop().catch((e) => e);
    await new GridFSBucket(database, { bucketName: "echo" })
      .drop().catch((e) => e);
    await new GridFSBucket(database, { bucketName: "metadata" })
      .drop().catch((e) => e);
    await new GridFSBucket(database, { bucketName: "delete" })
      .drop().catch((e) => e);

    await database.dropDatabase().catch((e) => e);
    client.close();
  });

  it("GridFS: Echo small Hello World", async () => {
    const bucket = new GridFSBucket(client.database(testDatabaseName), {
      bucketName: "echo",
    });
    const upstream = await bucket.openUploadStream("test.txt");
    const writer = upstream.getWriter();
    await writer.write(new TextEncoder().encode("Hello World! 👋"));
    await writer.close();

    const getId =
      (await bucket.find({ filename: "test.txt" }).toArray())[0]._id;

    assert(getId);

    const text = await new Response(await bucket.openDownloadStream(getId))
      .text();

    assertEquals(text, "Hello World! 👋");
  });

  it("GridFS: Echo large Image", async () => {
    const bucket = new GridFSBucket(client.database(testDatabaseName), {
      bucketName: "A",
    });

    // Set an impractically low chunkSize to test chunking algorithm
    const upstream = await bucket.openUploadStream("1.jpg", {
      chunkSizeBytes: 255 * 8,
    });

    const image = await Deno.open("tests/assets/1.jpg", { read: true });
    await image.readable.pipeTo(upstream);

    const [{ _id }] = await bucket.find({ filename: "1.jpg" }).toArray();

    const expected = await Deno.readFile("tests/assets/1.jpg");
    const actual = await streamReadAll(await bucket.openDownloadStream(_id));

    assertEquals(actual, expected);
  });

  it(
    "GridFS: Echo large Image (compare with different Image)",
    async () => {
      const bucket = new GridFSBucket(client.database(testDatabaseName), {
        bucketName: "A",
      });

      // Set an impractically low chunkSize to test chunking algorithm
      const upstream = await bucket.openUploadStream("1.jpg", {
        chunkSizeBytes: 255 * 8,
      });

      const image = await Deno.open("tests/assets/1.jpg", { read: true });
      await image.readable.pipeTo(upstream);

      const [{ _id }] = await bucket.find({ filename: "1.jpg" }).toArray();

      const notExpected = await Deno.readFile("tests/assets/2.jpg");
      const actual = await streamReadAll(await bucket.openDownloadStream(_id));

      assertNotEquals(actual, notExpected);
    },
  );
  it(
    "GridFS: Metadata does get stored correctly",
    async () => {
      const bucket = new GridFSBucket(client.database(testDatabaseName), {
        bucketName: "metadata",
      });
      const upstream = await bucket.openUploadStream("metadata.txt", {
        metadata: {
          helloWorld: "this is a test",
        },
      });
      const writer = upstream.getWriter();
      await writer.write(new TextEncoder().encode("Hello World! 👋"));
      await writer.close();

      const file =
        (await bucket.find({ filename: "metadata.txt" }).toArray())[0];

      assertEquals("this is a test", file.metadata?.helloWorld);
    },
  );

  it(
    "GridFS: Delete does work as expected",
    async () => {
      const bucket = new GridFSBucket(client.database(testDatabaseName), {
        bucketName: "delete",
      });
      const upstream = await bucket.openUploadStream("stuff.txt");
      const writer = upstream.getWriter();
      await writer.write(new TextEncoder().encode("[redacted]"));
      await writer.close();

      let file = await bucket.find({ filename: "stuff.txt" }).toArray();
      assert(file[0]);
      await bucket.delete(file[0]._id);
      file = await bucket.find({ filename: "stuff.txt" }).toArray();
      assert(!file[0]);
    },
  );

  // https://www.mongodb.com/docs/manual/reference/command/createIndexes/#considerations
  it(
    "GridFS: Creating indexes - skip index creation on same index keys",
    async () => {
      const addAsset = async (index: number) => {
        const database = client.database(testDatabaseName);
        const bucket = new GridFSBucket(database, {
          bucketName: "sameKeys",
        });
        const upstream = await bucket.openUploadStream(`test-asset-${index}`);
        const writer = upstream.getWriter();
        await writer.write(new TextEncoder().encode(`[asset${index}]`));
        await writer.close();
        return {
          files: await database.collection("sameKeys.files").listIndexes()
            .toArray(),
          chunks: await database.collection("sameKeys.chunks").listIndexes()
            .toArray(),
        };
      };
      assertEquals(await addAsset(0), await addAsset(1));
    },
  );
});
