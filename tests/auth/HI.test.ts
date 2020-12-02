import { assertEquals } from "../test.deps.ts";
import { HI } from "../../src/auth/mod.ts";
const salt = "rQ9ZY3MntBeuP3E1TDVC4w";
const inter = 10000;
const data = "1c33006ec1ffd90f9cadcbcc0e118200";
Deno.test({
  name: "HI",
  fn() {
    const saltedPassword = HI(data, salt, inter).toString("hex");
    assertEquals(saltedPassword, "48549cb611401e7456e9072741898ea4006e4ee6");
  },
});
