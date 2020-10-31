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
