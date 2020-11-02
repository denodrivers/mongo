import { driverMetadata } from "../utils/metadata.ts";
import { CommandQuery } from "./commands/query.ts";

let nextRequestId = 0;
export class Connection {
  constructor(private readonly conn: Deno.Conn) {}

  async connect() {
    await this.command("admin.$cmd", {
      isMaster: true,
      client: driverMetadata,
    });
  }

  async command(ns: string, command: any) {
    const query = new CommandQuery(ns, command);
    for (const chunk of query.serialize(nextRequestId++)) {
      await Deno.writeAll(this.conn, chunk);
    }
  }
}
