import { passwordDigest } from "../../src/auth/mod.ts";
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
