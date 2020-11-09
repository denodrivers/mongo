import { WireProtocol } from "./mod.ts";

export const driverMetadata = {
  driver: {
    name: "Deno Mongo",
    version: "v0.0.1",
  },
  os: {
    type: Deno.build.os,
    name: Deno.build.os,
    architecture: Deno.build.arch,
  },
};

export async function handshake(protocol: WireProtocol) {
  const reply = await protocol.command("admin", {
    isMaster: true,
    client: driverMetadata,
  });
  console.log(reply);
}
