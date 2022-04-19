import { GridFSBucket } from "../../src/gridfs/bucket.ts";
import { testWithClient } from "../common.ts";

testWithClient("cleanup", async (client) => {
  const db = client.database("test");
  try {
    await db.collection("mongo_test_users").drop().catch((e) => e);
    await db.collection("mongo_test_places").drop().catch((e) => e);
    await db.collection("mongo_test_positions").drop().catch((e) => e);
    await db.collection("mongo_test_neighborhoods").drop().catch((e) => e);
    await new GridFSBucket(db, { bucketName: "deno_logo" })
      .drop().catch((e) => e);
    await new GridFSBucket(db, { bucketName: "echo" })
      .drop().catch((e) => e);
    await new GridFSBucket(db, { bucketName: "metadata" })
      .drop().catch((e) => e);
    await new GridFSBucket(db, { bucketName: "delete" })
      .drop().catch((e) => e);
  } catch {
    // pass
  }
});
