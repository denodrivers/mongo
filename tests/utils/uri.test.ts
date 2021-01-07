import { parse, parse_url } from "../../src/utils/uri.ts";
import { assertEquals } from "../test.deps.ts";

Deno.test({
  name: "should correctly parse mongodb://localhost",
  fn() {
    const options = parse("mongodb://localhost/");
    assertEquals(options.db, "admin");
    assertEquals(options.servers.length, 1);
    assertEquals(options.servers[0].host, "localhost");
    assertEquals(options.servers[0].port, 27017);
  },
});

Deno.test({
  name: "should correctly parse mongodb://localhost:27017",
  fn() {
    const options = parse("mongodb://localhost:27017/");
    assertEquals(options.db, "admin");
    assertEquals(options.servers.length, 1);
    assertEquals(options.servers[0].host, "localhost");
    assertEquals(options.servers[0].port, 27017);
  },
});

Deno.test({
  name:
    "should correctly parse mongodb://localhost:27017/test?appname=hello%20world",
  fn() {
    const options = parse_url(
      "mongodb://localhost:27017/test?appname=hello%20world",
    );
    assertEquals(options.appname, "hello world");
  },
});

Deno.test({
  name:
    "should correctly parse mongodb://localhost/?safe=true&readPreference=secondary",
  fn() {
    const options = parse_url(
      "mongodb://localhost/?safe=true&readPreference=secondary",
    );
    assertEquals(options.dbName, "admin");
    assertEquals(options.servers.length, 1);
    assertEquals(options.servers[0].host, "localhost");
    assertEquals(options.servers[0].port, 27017);
  },
});

Deno.test({
  name: "should correctly parse mongodb://localhost:28101/",
  fn() {
    const options = parse_url("mongodb://localhost:28101/");
    assertEquals(options.dbName, "admin");
    assertEquals(options.servers.length, 1);
    assertEquals(options.servers[0].host, "localhost");
    assertEquals(options.servers[0].port, 28101);
  },
});
Deno.test({
  name: "should correctly parse mongodb://fred:foobar@localhost/baz",
  fn() {
    const options = parse_url("mongodb://fred:foobar@localhost/baz");
    assertEquals(options.dbName, "baz");
    assertEquals(options.servers.length, 1);
    assertEquals(options.servers[0].host, "localhost");
    assertEquals(options.auth!.user, "fred");
    assertEquals(options.auth!.password, "foobar");
  },
});

Deno.test({
  name: "should correctly parse mongodb://fred:foo%20bar@localhost/baz",
  fn() {
    const options = parse_url("mongodb://fred:foo%20bar@localhost/baz");
    assertEquals(options.dbName, "baz");
    assertEquals(options.servers.length, 1);
    assertEquals(options.servers[0].host, "localhost");
    assertEquals(options.auth!.user, "fred");
    assertEquals(options.auth!.password, "foo bar");
  },
});

Deno.test({
  name: "should correctly parse mongodb://%2Ftmp%2Fmongodb-27017.sock",
  fn() {
    const options = parse_url("mongodb://%2Ftmp%2Fmongodb-27017.sock");
    assertEquals(options.servers.length, 1);
    assertEquals(options.servers[0].domain_socket, "/tmp/mongodb-27017.sock");
    assertEquals(options.dbName, "admin");
  },
});

Deno.test({
  name: "should correctly parse mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock",
  fn() {
    const options = parse_url("mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock");
    assertEquals(options.servers.length, 1);
    assertEquals(options.servers[0].domain_socket, "/tmp/mongodb-27017.sock");
    assertEquals(options.auth!.user, "fred");
    assertEquals(options.auth!.password, "foo");
    assertEquals(options.dbName, "admin");
  },
});

Deno.test({
  name:
    "should correctly parse mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock/somedb",
  fn() {
    const options = parse_url(
      "mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock/somedb",
    );
    assertEquals(options.servers.length, 1);
    assertEquals(options.servers[0].domain_socket, "/tmp/mongodb-27017.sock");
    assertEquals(options.auth!.user, "fred");
    assertEquals(options.auth!.password, "foo");
    assertEquals(options.dbName, "somedb");
  },
});

Deno.test({
  name:
    "should correctly parse mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock/somedb?safe=true",
  fn() {
    const options = parse_url(
      "mongodb://fred:foo@%2Ftmp%2Fmongodb-27017.sock/somedb?safe=true",
    );
    assertEquals(options.servers.length, 1);
    assertEquals(options.servers[0].domain_socket, "/tmp/mongodb-27017.sock");
    assertEquals(options.auth!.user, "fred");
    assertEquals(options.auth!.password, "foo");
    assertEquals(options.dbName, "somedb");
    assertEquals(options.db_options.safe, true);
  },
});
// TODO: add more tests (https://github.com/mongodb/node-mongodb-native/blob/3.6/test/functional/url_parser.test.js)
