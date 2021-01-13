import { testWithClient } from "../common.ts";

export default function cleanup() {
  testWithClient("cleanup", async (client) => {
    const db = client.database("test");
    try {
      await db.collection("mongo_test_users_2").drop().catch((e) => e);
      await db.collection("mongo_test_users").drop().catch((e) => e);
    } catch {
    }
  });
}
