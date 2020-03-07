import { assertThrows } from "https://deno.land/std@v0.35.0/testing/asserts.ts";
import { ObjectId } from "../types.ts";

Deno.test("ObjectId parse", function() {
  assertThrows(() => ObjectId("d3e48b03-7baf-4d98-8df7-5002a8fae5e4"));
  ObjectId("5e63a91b00d839ae0084dfe4");
});
