import { decodeBase64 } from "../../src/utils/decode_base64.ts";

import { assertEquals, describe, it } from "./../test.deps.ts";

describe("decodeBase64", () => {
  it({
    name: "should correctly decode a standard base64 encoded string",
    fn() {
      const encoded = "SGVsbG8gV29ybGQ="; // "Hello World" in base64
      const decoded = decodeBase64(encoded);
      assertEquals(new TextDecoder().decode(decoded), "Hello World");
    },
  });

  it({
    name: "should correctly decode a URL-safe base64 encoded string",
    fn() {
      const encoded = "SGVsbG8tV29ybGRf"; // URL-safe base64 variant
      const decoded = decodeBase64(encoded);
      assertEquals(new TextDecoder().decode(decoded), "Hello-World_");
    },
  });

  it({
    name: "should handle base64 strings with missing padding",
    fn() {
      const encoded = "SGVsbG8gV29ybGQ"; // Missing '=' at the end
      const decoded = decodeBase64(encoded);
      assertEquals(new TextDecoder().decode(decoded), "Hello World");
    },
  });

  it({
    name: "should return an empty array for an empty string",
    fn() {
      const encoded = "";
      const decoded = decodeBase64(encoded);
      assertEquals(decoded.length, 0);
    },
  });
});
