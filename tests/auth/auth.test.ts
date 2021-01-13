import {
  cleanUsername,
  clientFirstMessageBare,
  passwordDigest,
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
  name: "clientFirstMessageBare",
  fn() {
    const username = "1234";
    const nonce = new TextEncoder().encode("qwer");
    const result: Uint8Array = clientFirstMessageBare(username, nonce);
    const expected: Uint8Array = Uint8Array.from(
      [110, 61, 49, 50, 51, 52, 44, 114, 61, 99, 88, 100, 108, 99, 103, 61, 61],
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
