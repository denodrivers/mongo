import { GridFSBucket } from "../../mod.ts";
import { testWithClient } from "../common.ts";
import { assert, assertEquals, bytesEquals } from "../test.deps.ts";

function bufferEquals(a: ArrayBuffer, b: ArrayBuffer) {
  return bytesEquals(new Uint8Array(a), new Uint8Array(b));
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
    bucketName: "deno_logo",
  });

  // Set an impractically low chunkSize to test chunking algorithm
  const upstream = await bucket.openUploadStream("deno_logo.png", {
    chunkSizeBytes: 255 * 8,
  });

  await (await fetch("https://deno.land/images/deno_logo.png")).body!.pipeTo(
    upstream,
  );

  const getId =
    (await bucket.find({ filename: "deno_logo.png" }).toArray())[0]._id;

  const expected = await fetch("https://deno.land/images/deno_logo.png");
  const actual = await new Response(await bucket.openDownloadStream(getId))
    .arrayBuffer();

  assert(bufferEquals(actual, await expected.arrayBuffer()));
});

testWithClient(
  "GridFS: Echo large Image (compare with different Image)",
  async (client) => {
    const bucket = new GridFSBucket(client.database("test"), {
      bucketName: "deno_logo",
    });

    const upstream = await bucket.openUploadStream("deno_logo.png");

    await (await fetch("https://deno.land/images/deno_logo.png")).body!
      .pipeTo(
        upstream,
      );

    const getId =
      (await bucket.find({ filename: "deno_logo.png" }).toArray())[0]._id;

    const expected = await fetch("https://deno.land/images/deno_logo_4.gif");
    const actual = await new Response(await bucket.openDownloadStream(getId))
      .arrayBuffer();

    assert(!bufferEquals(actual, await expected.arrayBuffer()));
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
            const bucket = new GridFSBucket(client.database("test"), {
                bucketName: "sameKeys"
            });
            const upstream = await bucket.openUploadStream(`test-asset-${index}`);
            const writer = upstream.getWriter();
            await writer.write(new TextEncoder().encode(`[asset${index}]`));
            await writer.close();
        }
        await addAsset(0);
        await addAsset(1);
    },
);
