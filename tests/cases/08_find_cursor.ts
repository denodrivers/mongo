import { FindCursor } from "../../src/collection/commands/find.ts";
import { WireProtocol } from "../../src/protocol/protocol.ts";
import { assertEquals } from "../test.deps.ts";

export default function findCursorTests() {
  Deno.test({
    name: "FindCursor: Options object is immutable and not shared between cursors",
    fn: () => {
      const FIND_OPTIONS: { limit?: number } = {};

      const cursor_a = new FindCursor<{ id: number }>({
        filter: {},
        protocol: {} as WireProtocol,
        collectionName: 'test-collection-name',
        dbName: 'test-db-name',
        options: FIND_OPTIONS
      });

      cursor_a.limit(10);

      assertEquals(FIND_OPTIONS.limit, undefined);
    },
  });
}
