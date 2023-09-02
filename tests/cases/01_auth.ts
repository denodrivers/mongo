import { afterAll } from "https://deno.land/std@0.201.0/testing/bdd.ts";
import { Database } from "../../mod.ts";
import {
  cleanUsername,
  clientFirstMessageBare,
  HI,
  passwordDigest,
} from "../../src/auth/mod.ts";
import { MongoClient } from "../../src/client.ts";
import { cleanTestDb, getTestDb } from "../common.ts";
import { assert, assertEquals, beforeAll, describe, it } from "../test.deps.ts";

describe("auth", () => {
  describe("prerequisites", () => {
    it({
      name: "passwordDigest:username:password",
      async fn() {
        const passwordValids: {
          username: string;
          password: string;
          digest: string;
        }[] = [
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
        for (const { username, password, digest } of passwordValids) {
          const digestRes: string = await passwordDigest(username, password);
          assertEquals(digestRes, digest);
        }
      },
    });

    it({
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

    it({
      name: "cleanUsername",
      fn() {
        const username = "first=12,last=34";
        const expected = "first=3D12=2Clast=34";
        const result = cleanUsername(username);
        assertEquals(expected, result);
      },
    });

    it({
      name: "HI",
      async fn() {
        const salt = "rQ9ZY3MntBeuP3E1TDVC4w";
        const iter = 10000;
        const data = "1c33006ec1ffd90f9cadcbcc0e118200";
        const saltedPassword = await HI(
          data,
          (new TextEncoder()).encode(salt),
          iter,
          "sha1",
        );
        assertEquals(
          new Uint8Array(saltedPassword),
          Uint8Array.from([
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
          ]),
        );
      },
    });
  });

  describe("connection", () => {
    let database: Database;
    let client: MongoClient;
    const hostname = "127.0.0.1";

    beforeAll(async () => {
      ({ client, database } = await getTestDb());
      await database.createUser("user1", "y3mq3mpZ3J6PGfgg");
      await database.createUser("user2", "Qa6WkQSuXF425sWZ");
    });

    afterAll(async () => {
      await database.dropUser("user1");
      await database.dropUser("user2");
      await cleanTestDb(client, database);
    });

    it("should connect with correct credentials, case 1", async () => {
      const username = "user1";
      const password = "y3mq3mpZ3J6PGfgg";
      const client = new MongoClient();
      await client.connect(
        `mongodb://${username}:${password}@${hostname}:27017/test`,
      );
      const names = await client.listDatabases();
      assert(names instanceof Array);
      assert(names.length > 0);
      client.close();
    });

    it("should connect with correct credentials, case 2", async () => {
      const username = "user2";
      const password = "Qa6WkQSuXF425sWZ";
      const client = new MongoClient();
      await client.connect(
        `mongodb://${username}:${password}@${hostname}:27017/test`,
      );
      const names = await client.listDatabases();
      assert(names instanceof Array);
      assert(names.length > 0);
      client.close();
    });
  });
});
