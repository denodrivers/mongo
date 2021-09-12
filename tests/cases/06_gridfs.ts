import { GridFSBucket } from "../../mod.ts";
import { testWithClient } from "../common.ts";
import { assert, assertEquals } from "../test.deps.ts";

export default function gridfsTests() {
  testWithClient("GridFS: Echo small Hello World", async (client) => {
    const bucket = new GridFSBucket(client.database("gridfs"), {
      bucketName: "test",
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
    const bucket = new GridFSBucket(client.database("gridfs"), {
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

    assertEquals(actual, await expected.arrayBuffer());
  });
}
