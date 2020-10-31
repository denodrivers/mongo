import { Connection } from "./connection/connection.ts";

const conn = await Deno.connect({
  hostname: "localhost",
  port: 27017,
  transport: "tcp",
});

const connection = new Connection(conn);
await connection.connect();

for await (const chunk of Deno.iter(conn)) {
  console.log(chunk);
}
