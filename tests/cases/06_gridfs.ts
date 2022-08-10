import { GridFSBucket } from "../../mod.ts";
import { testWithClient } from "../common.ts";
import {
  assert,
  assertEquals,
  assertNotEquals,
  readAll,
  readerFromStreamReader,
} from "../test.deps.ts";

async function streamReadAll(readable: ReadableStream): Promise<Uint8Array> {
  const reader = readerFromStreamReader(readable.getReader());
  const result = await readAll(reader);
  return result;
}

testWithClient("GridFS: Echo small Hello World", async (client) => {
  const bucket = new GridFSBucket(client.database("test"), {
    bucketName: "echo",
  });
  const upstream = await bucket.openUploadStream("test.txt");
  const writer = upstream.getWriter();
  await writer.write(new TextEncoder().encode("Hello World! 👋"));
  await writer.close();

  const getId = (await bucket.find({ filename: "test.txt" }).toArray())[0]._id;

  assert(getId);

  const text = await new Response(await bucket.openDownloadStream(getId))
    .text();

  assertEquals(text, "Hello World! 👋");
});

testWithClient("GridFS: Echo large Image", async (client) => {
  const bucket = new GridFSBucket(client.database("test"), {
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

testWithClient(
  "GridFS: Echo large Image (compare with different Image)",
  async (client) => {
    const bucket = new GridFSBucket(client.database("test"), {
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

testWithClient(
  "GridFS: Metadata does get stored correctly",
  async (client) => {
    const bucket = new GridFSBucket(client.database("test"), {
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

    const file = (await bucket.find({ filename: "metadata.txt" }).toArray())[0];

    assertEquals("this is a test", file.metadata?.helloWorld);
  },
);

testWithClient(
  "GridFS: Delete does work as expected",
  async (client) => {
    const bucket = new GridFSBucket(client.database("test"), {
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
testWithClient(
  "GridFS: Creating indexes - skip index creation on same index keys",
  async (client) => {
    const addAsset = async (index: number) => {
      const db = client.database("test");
      const bucket = new GridFSBucket(db, {
        bucketName: "sameKeys",
      });
      const upstream = await bucket.openUploadStream(`test-asset-${index}`);
      const writer = upstream.getWriter();
      await writer.write(new TextEncoder().encode(`[asset${index}]`));
      await writer.close();
      return {
        files: await db.collection("sameKeys.files").listIndexes().toArray(),
        chunks: await db.collection("sameKeys.chunks").listIndexes().toArray(),
      };
    };
    assertEquals(await addAsset(0), await addAsset(1));
  },
);
