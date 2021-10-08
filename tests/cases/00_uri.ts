import { parse, parseSrvUrl } from "../../src/utils/uri.ts";
import { assertEquals } from "./../test.deps.ts";

export default function uriTests() {
  Deno.test({
    name: "should correctly parse mongodb://localhost",
    async fn() {
      const options = await parse("mongodb://localhost/");
      assertEquals(options.db, "test");
      assertEquals(options.servers.length, 1);
      assertEquals(options.servers[0].host, "localhost");
      assertEquals(options.servers[0].port, 27017);
    },
  });

  Deno.test({
    name: "should correctly parse mongodb://localhost:27017",
    async fn() {
      const options = await parse("mongodb://localhost:27017/");
      assertEquals(options.db, "test");
      assertEquals(options.servers.length, 1);
      assertEquals(options.servers[0].host, "localhost");
      assertEquals(options.servers[0].port, 27017);
    },
  });

  Deno.test({
    name:
      "should correctly parse mongodb://localhost:27017/test?appname=hello%20world",
    async fn() {
      const options = await parse(
        "mongodb://localhost:27017/test?appname=hello%20world",
      );
      assertEquals(options.appname, "hello world");
    },
  });

  Deno.test({
    name:
      "should correctly parse mongodb://localhost/?safe=true&readPreference=secondary",
    async fn() {
      const options = await parse(
        "mongodb://localhost/?safe=true&readPreference=secondary",
      );
      assertEquals(options.db, "test");
      assertEquals(options.servers.length, 1);
      assertEquals(options.servers[0].host, "localhost");
      assertEquals(options.servers[0].port, 27017);
    },
  });

  Deno.test({
    name: "should correctly parse mongodb://localhost:28101/",
    async fn() {
      const options = await parse("mongodb://localhost:28101/");
      assertEquals(options.db, "test");
      assertEquals(options.servers.length, 1);
      assertEquals(options.servers[0].host, "localhost");
      assertEquals(options.servers[0].port, 28101);
    },
  });
  Deno.test({
    name: "should correctly parse mongodb://fred:foobar@localhost/baz",
    async fn() {
      const options = await parse("mongodb://fred:foobar@localhost/baz");
      assertEquals(options.db, "baz");
      assertEquals(options.servers.length, 1);
      assertEquals(options.servers[0].host, "localhost");
      assertEquals(options.credential!.username, "fred");
      assertEquals(options.credential!.password, "foobar");
      assertEquals(options.credential!.db, "baz");
    },
  });

  Deno.test({
    name: "should correctly parse mongodb://fred:foo%20bar@localhost/baz",
    async fn() {
      const options = await parse("mongodb://fred:foo%20bar@localhost/baz");
      assertEquals(options.db, "baz");
      assertEquals(options.servers.length, 1);
      assertEquals(options.servers[0].host, "localhost");
      assertEquals(options.credential!.username, "fred");
      assertEquals(options.credential!.password, "foo bar");
      assertEquals(options.credential!.db, "baz");
    },
  });

  Deno.test({
    name: "should correctly parse mongodb://%2Ftmp%2Fmongodb-27017.sock",
    async fn() {
      const options = await parse("mongodb://%2Ftmp%2Fmongodb-27017.sock");
      assertEquals(options.servers.length, 1);
      assertEquals(options.servers[0].domainSocket, "/tmp/mongodb-27017.sock");
      assertEquals(options.db, "test");
    },
  });

  Deno.test({
    name:
      "should correctly parse mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock",
    async fn() {
      const options = await parse(
        "mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock",
      );
      assertEquals(options.servers.length, 1);
      assertEquals(options.servers[0].domainSocket, "/tmp/mongodb-27017.sock");
      assertEquals(options.credential!.username, "fred");
      assertEquals(options.credential!.password, "foo");
      assertEquals(options.db, "test");
    },
  });

  Deno.test({
    name:
      "should correctly parse mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock/somedb",
    async fn() {
      const options = await parse(
        "mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock/somedb",
      );
      assertEquals(options.servers.length, 1);
      assertEquals(options.servers[0].domainSocket, "/tmp/mongodb-27017.sock");
      assertEquals(options.credential!.username, "fred");
      assertEquals(options.credential!.password, "foo");
      assertEquals(options.credential!.db, "somedb");
      assertEquals(options.db, "somedb");
    },
  });

  Deno.test({
    name:
      "should correctly parse mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock/somedb?safe=true",
    async fn() {
      const options = await parse(
        "mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock/somedb?safe=true",
      );
      assertEquals(options.servers.length, 1);
      assertEquals(options.servers[0].domainSocket, "/tmp/mongodb-27017.sock");
      assertEquals(options.credential!.username, "fred");
      assertEquals(options.credential!.password, "foo");
      assertEquals(options.credential!.db, "somedb");
      assertEquals(options.db, "somedb");
      assertEquals(options.safe, true);
    },
  });
  Deno.test({
    name:
      "should correctly parse mongodb://fred:foobar@localhost,server2.test:28101/baz",
    async fn() {
      const options = await parse(
        "mongodb://fred:foobar@localhost,server2.test:28101/baz",
      );
      assertEquals(options.db, "baz");
      assertEquals(options.servers.length, 2);
      assertEquals(options.servers[0].host, "localhost");
      assertEquals(options.servers[0].port, 27017);
      assertEquals(options.servers[1].host, "server2.test");
      assertEquals(options.servers[1].port, 28101);
      assertEquals(options.credential!.username, "fred");
      assertEquals(options.credential!.password, "foobar");
      assertEquals(options.credential!.db, "baz");
    },
  });
  // TODO: add more tests (https://github.com/mongodb/node-mongodb-native/blob/3.6/test/functional/url_parser.test.js)

  Deno.test({
    name: "should correctly parse uris with authSource and dbName",
    async fn() {
      const options = await parse(
        "mongodb://a:b@localhost:27017/dbName?authSource=admin2",
      );

      assertEquals(options.db, "dbName");
      assertEquals(options.servers[0].host, "localhost");
      assertEquals(options.servers[0].port, 27017);
      assertEquals(options.credential!.username, "a");
      assertEquals(options.credential!.password, "b");
      assertEquals(options.credential!.db, "admin2");
    },
  }),
    Deno.test({
      name: "should correctly parse uris with authSource and dbName",
      fn() {
        const options = parseSrvUrl(
          "mongodb+srv://a:b@somesubdomain.somedomain.com/dbName?authSource=admin2",
        );

        assertEquals(options.db, "dbName");
        assertEquals(options.credential!.username, "a");
        assertEquals(options.credential!.password, "b");
        assertEquals(options.credential!.db, "admin2");
      },
    }),
    Deno.test({
      name:
        "should correctly parse mongodb+srv://someUser:somePassword@somesubdomain.somedomain.com/someDatabaseName?retryWrites=true&w=majority",
      fn() {
        const options = parseSrvUrl(
          "mongodb+srv://someUser:somePassword@somesubdomain.somedomain.com/someDatabaseName?retryWrites=true&w=majority",
        );
        assertEquals(options.db, "someDatabaseName");
        assertEquals(options.credential?.username, "someUser");
        assertEquals(options.credential?.password, "somePassword");
        assertEquals(options.retryWrites, true);
        // @ts-ignore
        assertEquals(options["servers"], undefined);
      },
    });
}
