import { assertEquals } from "../test.deps.ts";
import { HI } from "../../src/auth/mod.ts";

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
