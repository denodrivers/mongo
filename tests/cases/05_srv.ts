import { assertEquals, assertThrowsAsync } from "../test.deps.ts";
import { Srv } from "../../src/utils/srv.ts";

function mockResolver(
  srvRecords: Partial<Deno.SRVRecord>[] = [],
  txtRecords: string[][] = [],
) {
  return {
    resolveDns: (_url: string, type: Deno.RecordType) => {
      if (type === "SRV") return srvRecords;
      if (type === "TXT") return txtRecords;
    },
  } as any;
}

export default function srvTests() {
  Deno.test({
    name: "SRV: it throws an error if url doesn't have subdomain",
    fn() {
      assertThrowsAsync(
        () => new Srv().resolve("foo.bar"),
        Error,
        "Expected url in format 'host.domain.tld', received foo.bar",
      );
    },
  });

  Deno.test({
    name:
      "SRV: it throws an error if SRV resolution doesn't return any SRV records",
    fn() {
      assertThrowsAsync(
        () => new Srv(mockResolver()).resolve("mongohost.mongodomain.com"),
        Error,
        "Expected at least one SRV record, received 0 for url mongohost.mongodomain.com",
      );
    },
  });

  Deno.test({
    name: "SRV: it throws an error if TXT resolution returns no records",
    fn() {
      assertThrowsAsync(
        () =>
          new Srv(mockResolver([{ target: "mongohost1.mongodomain.com" }]))
            .resolve("mongohost.mongodomain.com"),
        Error,
        "Expected exactly one TXT record, received 0 for url mongohost.mongodomain.com",
      );
    },
  });

  Deno.test({
    name:
      "SRV: it throws an error if TXT resolution returns more than one record",
    fn() {
      assertThrowsAsync(
        () =>
          new Srv(
            mockResolver(
              [{ target: "mongohost1.mongodomain.com" }],
              [["replicaSet=rs-0"], ["authSource=admin"]],
            ),
          )
            .resolve("mongohost.mongodomain.com"),
        Error,
        "Expected exactly one TXT record, received 2 for url mongohost.mongodomain.com",
      );
    },
  });

  Deno.test({
    name: "SRV: it throws an error if TXT record contains illegal options",
    fn() {
      assertThrowsAsync(
        () =>
          new Srv(
            mockResolver(
              [{ target: "mongohost1.mongodomain.com" }],
              [["replicaSet=rs-0&authSource=admin&ssl=true"]],
            ),
          )
            .resolve("mongohost.mongodomain.com"),
        Error,
        "Illegal uri options: ssl=true",
      );
    },
  });

  Deno.test({
    name: "SRV: it correctly parses seedlist and options for valid records",
    async fn() {
      const result = await new Srv(
        mockResolver([
          {
            target: "mongohost1.mongodomain.com",
            port: 27015,
          },
          {
            target: "mongohost2.mongodomain.com",
            port: 27017,
          },
        ], [["replicaSet=rs-0&authSource=admin"]]),
      ).resolve("mongohost.mongodomain.com");
      assertEquals(result.servers.length, 2);
      const server1 = result.servers.find(
        (server) => server.host === "mongohost1.mongodomain.com",
      );
      const server2 = result.servers.find((server) =>
        server.host === "mongohost2.mongodomain.com"
      );
      assertEquals(server1!.port, 27015);
      assertEquals(server2!.port, 27017);
      assertEquals(result.options.replicaSet, "rs-0");
      assertEquals(result.options.authSource, "admin");
      assertEquals(result.options.loadBalanced, undefined);
    },
  });

  Deno.test({
    name:
      "SRV: it correctly parses seedlist and options for options split in two strings",
    async fn() {
      const result = await new Srv(
        mockResolver([
          {
            target: "mongohost1.mongodomain.com",
            port: 27015,
          },
          {
            target: "mongohost2.mongodomain.com",
            port: 27017,
          },
        ], [["replicaS", "et=rs-0&authSource=admin"]]),
      ).resolve("mongohost.mongodomain.com");
      assertEquals(result.servers.length, 2);
      const server1 = result.servers.find(
        (server) => server.host === "mongohost1.mongodomain.com",
      );
      const server2 = result.servers.find((server) =>
        server.host === "mongohost2.mongodomain.com"
      );
      assertEquals(server1!.port, 27015);
      assertEquals(server2!.port, 27017);
      assertEquals(result.options.replicaSet, "rs-0");
      assertEquals(result.options.authSource, "admin");
      assertEquals(result.options.loadBalanced, undefined);
    },
  });
}
