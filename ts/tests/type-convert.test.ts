import { assertEquals } from "../../test.deps.ts";
import { convert, parse } from "../type_convert.ts";
const dateNow = Date.now();

const { test } = Deno;

test("convert Date", function() {
  const data = [
    {
      date: new Date(dateNow),
      str: "str",
      number: 123,
      bool: true
    }
  ];
  assertEquals(convert(data), [
    {
      date: { $date: { $numberLong: dateNow } },
      str: "str",
      number: 123,
      bool: true
    }
  ]);
});

test("parse Date", function() {
  const data = [
    {
      date: { $date: { $numberLong: dateNow } },
      str: "str",
      number: 123,
      bool: true
    }
  ];
  assertEquals(parse(data), [
    {
      date: new Date(dateNow),
      str: "str",
      number: 123,
      bool: true
    }
  ]);
});
