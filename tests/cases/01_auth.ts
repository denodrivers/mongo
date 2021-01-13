import {
  cleanUsername,
  clientFirstMessageBare,
  HI,
  passwordDigest,
} from "../../src/auth/mod.ts";
import { MongoClient } from "../../src/client.ts";
import { testWithClient } from "../common.ts";
import { assert, assertEquals } from "../test.deps.ts";

const hostname = "127.0.0.1";

interface PasswordValid {
  username: string;
  password: string;
  digest: string;
}

const passwordValdis: PasswordValid[] = [
  {
    username: "user",
    password: "pencil",
    digest: "1c33006ec1ffd90f9cadcbcc0e118200",
  },
  {
    username: "test",
    password: "test",
    digest: "a6de521abefc2fed4f5876855a3484f5",
  },
];

export default function authTests() {
  passwordValdis.forEach(({ username, password, digest }) => {
    Deno.test({
      name: `passwordDigest:${username}:${password}`,
      fn() {
        const digestRes: string = passwordDigest(username, password);
        assertEquals(digestRes, digest);
      },
    });
  });

  Deno.test({
    name: "clientFirstMessageBare",
    fn() {
      const username = "1234";
      const nonce = new TextEncoder().encode("qwer");
      const result: Uint8Array = clientFirstMessageBare(username, nonce);
      const expected: Uint8Array = Uint8Array.from(
        [
          110,
          61,
          49,
          50,
          51,
          52,
          44,
          114,
          61,
          99,
          88,
          100,
          108,
          99,
          103,
          61,
          61,
        ],
      );
      assertEquals(expected, result);
    },
  });

  Deno.test({
    name: "cleanUsername",
    fn() {
      const username: string = "first=12,last=34";
      const expected: string = "first=3D12=2Clast=34";
      const result: string = cleanUsername(username);
      assertEquals(expected, result);
    },
  });

  const salt = "rQ9ZY3MntBeuP3E1TDVC4w";
  const iter = 10000;
  const data = "1c33006ec1ffd90f9cadcbcc0e118200";

  Deno.test({
    name: "HI",
    fn() {
      const saltedPassword = HI(
        data,
        (new TextEncoder()).encode(salt),
        iter,
        "sha1",
      );
      assertEquals(
        saltedPassword,
        [
          72,
          84,
          156,
          182,
          17,
          64,
          30,
          116,
          86,
          233,
          7,
          39,
          65,
          137,
          142,
          164,
          0,
          110,
          78,
          230,
        ],
      );
    },
  });

  testWithClient("createUser", async (client) => {
    const db = client.database("test");
    await db.createUser("user1", "y3mq3mpZ3J6PGfgg");
    await db.createUser("user2", "Qa6WkQSuXF425sWZ");
  });

  Deno.test("connect authorization test 1 - test db", async () => {
    var username = "user1";
    var password = "y3mq3mpZ3J6PGfgg";
    const client = new MongoClient();
    await client.connect(
      `mongodb://${username}:${password}@${hostname}:27017/test`,
    );
    const names = await client.listDatabases();
    assert(names instanceof Array);
    assert(names.length > 0);
    client.close();
  });

  Deno.test("connect authorization test 2 - test db", async () => {
    var username = "user2";
    var password = "Qa6WkQSuXF425sWZ";
    const client = new MongoClient();
    await client.connect(
      `mongodb://${username}:${password}@${hostname}:27017/test`,
    );
    const names = await client.listDatabases();
    assert(names instanceof Array);
    assert(names.length > 0);
    client.close();
  });

  testWithClient("dropUser", async (client) => {
    const db = client.database("test");
    await db.dropUser("user1");
    await db.dropUser("user2");
  });
}
