import {
  clientKeyFor,
  passwordDigest,
  serverKeyFor,
  storedKeyFor,
} from "../../src/auth/mod.ts";
import { assertEquals } from "../test.deps.ts";

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
  name: "clientKey",
  fn() {
    const key: string = "48549cb611401e7456e9072741898ea4006e4ee6";
    const expected = `6f7ca2af959e3b7823886dca969c04b166ed3b7d`;
    const result: string = clientKeyFor(key);
    assertEquals(expected, result);
  },
});

Deno.test({
  name: "serverKey",
  fn() {
    const key: string = "48549cb611401e7456e9072741898ea4006e4ee6";
    const expected: string = `550083f8dbe04acbb85a0081a6eacf1607b4835e`;
    const result: string = serverKeyFor(key);
    assertEquals(expected, result);
  },
});

Deno.test({
  name: "storedKey",
  fn() {
    const data: string = "48549cb611401e7456e9072741898ea4006e4ee6";
    const expected: string = "504ce7448255f3996b66ca99c09a6c5463d18dd7";
    const result: string = storedKeyFor(data);
    assertEquals(expected, result);
  },
});
