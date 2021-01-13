import { CommandCursor, WireProtocol } from "../../protocol/mod.ts";

interface ListIndexesCursorContext {
  dbName: string;
  collectionName: string;
  protocol: WireProtocol;
}

export class ListIndexesCursor<T> extends CommandCursor<T> {
  #context: ListIndexesCursorContext;

  private async executor() {
    const { protocol, dbName, collectionName } = this.#context;
    const { cursor } = await protocol.commandSingle(dbName, {
      listIndexes: collectionName,
    });
    return {
      ...cursor,
      id: cursor.id.toString(),
    };
  }

  constructor(context: ListIndexesCursorContext) {
    super(context.protocol, () => this.executor());
    this.#context = context;
  }
}
