// mongodb://username:password@example.com:27017,example2.com:27017,...,example.comN:27017/database?key=value&keyN=valueN
import { ConnectOptions } from "../types.ts";

export function parse(uri: string): ConnectOptions {
  const uriObject = new URL(decodeURIComponent(uri));
  const search: { [key: string]: any } = {};
  uriObject.searchParams.forEach((val, key) => {
    search[key] = val;
  });
  const dbName = getDbName();
  const domain_socket = getDomainSocket();
  const auth = {
    user: decodeURIComponent(uriObject.username),
    password: decodeURIComponent(uriObject.password),
  };
  return {
    servers: [
      {
        host: uriObject.hostname,
        port: parseInt(uriObject.port) || 27017,
        domain_socket,
      },
    ],
    dbName,
    auth,
    ...search,
  };

  function getDomainSocket() {
    if (uriObject.pathname.endsWith(".sock")) {
      return decodeURIComponent(uriObject.pathname);
    }
    return "";
  }

  function getDbName() {
    if (uriObject.pathname.endsWith(".sock")) {
      return "admin";
    }
    return uriObject.pathname.slice(1) || "admin";
  }
}
