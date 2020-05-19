import { assertEquals, assertThrows } from "../../test.deps.ts";
import { ObjectId } from "../types.ts";

const { test } = Deno;

test("ObjectId parse", () => {
  let $oid = "d3e48b03-7baf-4d98-8df7-5002a8fae5e4";
  assertThrows(() => ObjectId($oid));

  $oid = "5e63a91b00d839ae0084dfe4";
  assertEquals(ObjectId($oid), { $oid });

  $oid = "INVALID-5e63a91b00d839ae0084dfe4";
  assertThrows(() => ObjectId($oid));

  $oid = "5e63a91b00d839ae0084dfe4-INVALID";
  assertThrows(() => ObjectId($oid));
});
