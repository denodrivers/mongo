import { assertEquals } from "../../test.deps.ts";
import { convert, parse } from "../type_convert.ts";
const dateNow = Date.now();

Deno.test("convert Date", () => {
  const data = [
    {
      date: new Date(dateNow),
      str: "str",
      number: 123,
      bool: true,
    },
  ];
  assertEquals(convert(data), [
    {
      date: { $date: { $numberLong: dateNow } },
      str: "str",
      number: 123,
      bool: true,
    },
  ]);
});

Deno.test("parse Date", () => {
  const data = [
    {
      date: { $date: { $numberLong: dateNow } },
      str: "str",
      number: 123,
      bool: true,
    },
  ];
  assertEquals(parse(data), [
    {
      date: new Date(dateNow),
      str: "str",
      number: 123,
      bool: true,
    },
  ]);
});
