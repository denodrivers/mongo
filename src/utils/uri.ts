// mongodb://username:password@example.com:27017,example2.com:27017,...,example.comN:27017/database?key=value&keyN=valueN
import { ConnectOptions } from "../types.ts";

export function parse(uri: string): ConnectOptions {
  const uriObject = new URL(uri);
  const search: { [key: string]: any } = {};
  uriObject.searchParams.forEach((val, key) => {
    search[key] = val;
  });
  return {
    servers: [
      {
        host: uriObject.hostname,
        port: parseInt(uriObject.port) || 27017,
      },
    ],
    dbName: "admin",
    ...search,
  };
}
