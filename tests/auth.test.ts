import { testWithClient } from "./common.ts";

testWithClient("createUser", async (client) => {
  const db = client.database("test");
  await db.createUser("testUser", "testPassword");
});

testWithClient("dropUser", async (client) => {
  const db = client.database("test");
  await db.dropUser("testUser");
});
