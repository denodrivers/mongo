import { GridFSBucket } from "../../mod.ts";
import {
  assertArrayBufferEquals,
  assertArrayBufferNotEquals,
  testWithClient,
} from "../common.ts";
import { assert, assertEquals } from "../test.deps.ts";

export default function gridfsTests() {
  testWithClient("GridFS: Echo small Hello World", async (client) => {
    const bucket = new GridFSBucket(client.database("test"), {
      bucketName: "echo",
    });
    const upstream = bucket.openUploadStream("test.txt");
    const writer = upstream.getWriter();
    writer.write(new TextEncoder().encode("Hello World! 👋"));
    await writer.close();

    const getId =
      (await bucket.find({ filename: "test.txt" }).toArray())[0]._id;

    assert(getId);

    const text = await new Response(bucket.openDownloadStream(getId)).text();

    assertEquals(text, "Hello World! 👋");
  });

  testWithClient("GridFS: Echo large Image", async (client) => {
    const bucket = new GridFSBucket(client.database("test"), {
      bucketName: "deno_logo",
    });

    const upstream = bucket.openUploadStream("deno_logo.png");

    await (await fetch("https://deno.land/images/deno_logo.png")).body!.pipeTo(
      upstream,
    );

    const getId =
      (await bucket.find({ filename: "deno_logo.png" }).toArray())[0]._id;

    const expected = await fetch("https://deno.land/images/deno_logo.png");
    const actual = await new Response(bucket.openDownloadStream(getId))
      .arrayBuffer();

    assertArrayBufferEquals(actual, await expected.arrayBuffer());
  });

  testWithClient(
    "GridFS: Echo large Image (compare with different Image)",
    async (client) => {
      const bucket = new GridFSBucket(client.database("test"), {
        bucketName: "deno_logo",
      });

      const upstream = bucket.openUploadStream("deno_logo.png");

      await (await fetch("https://deno.land/images/deno_logo.png")).body!
        .pipeTo(
          upstream,
        );

      const getId =
        (await bucket.find({ filename: "deno_logo.png" }).toArray())[0]._id;

      const expected = await fetch("https://deno.land/images/deno_logo_4.gif");
      const actual = await new Response(bucket.openDownloadStream(getId))
        .arrayBuffer();

      assertArrayBufferNotEquals(actual, await expected.arrayBuffer());
    },
  );

  testWithClient(
    "GridFS: Metadata does get stored correctly",
    async (client) => {
      const bucket = new GridFSBucket(client.database("test"), {
        bucketName: "metadata",
      });
      const upstream = bucket.openUploadStream("metadata.txt", {
        metadata: {
          helloWorld: "this is a test",
        },
      });
      const writer = upstream.getWriter();
      writer.write(new TextEncoder().encode("Hello World! 👋"));
      await writer.close();

      const file =
        (await bucket.find({ filename: "metadata.txt" }).toArray())[0];

      assertEquals("this is a test", file.metadata?.helloWorld);
    },
  );

  testWithClient(
    "GridFS: Delete does work as expected",
    async (client) => {
      const bucket = new GridFSBucket(client.database("test"), {
        bucketName: "delete",
      });
      const upstream = bucket.openUploadStream("stuff.txt");
      const writer = upstream.getWriter();
      writer.write(new TextEncoder().encode("[redacted]"));
      await writer.close();

      let file = await bucket.find({ filename: "stuff.txt" }).toArray();
      assert(file[0]);
      await bucket.delete(file[0]._id);
      file = await bucket.find({ filename: "stuff.txt" }).toArray();
      assert(!file[0]);
    },
  );
}
