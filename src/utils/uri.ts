// mongodb://username:password@example.com:27017,example2.com:27017,...,example.comN:27017/database?key=value&keyN=valueN
import { ConnectOptions, Credential, Server } from "../types.ts";
import { Srv } from "./srv.ts";

interface Parts {
  auth?: { user: string; password?: string };
  hash?: any;
  servers?: Server[];
  href?: string;
  path?: string;
  pathname?: string;
  protocol?: string;
  search?: any;
}

//adapted from https://github.com/QubitProducts/urlite
export function parse_url(url: string): Parts {
  const fragments = [
    "protocol",
    "auth",
    "hostname",
    "port",
    "pathname",
    "search",
    "hash",
  ];
  const pattern =
    /([^:/?#]+:)?(?:(?:\/\/)(?:([^/?#]*:?[^@/]+)@)?([^/:?#]+)(?:(?::)(\d+))?)?(\/?[^?#]*)?(\?[^#]*)?(#[^\s]*)?/;

  const multipleServerPattern =
    /([^:/?#]+:)?(?:(?:\/\/)(?:([^/?#]*:?[^@/]+)@)?((?:(?:[^/:?#]+)(?:(?::)(?:\d+))?)+))?/;

  function parse_simple(url: string): any {
    const parts: any = {};
    parts.href = url;
    const multiServerMatch = url.match(multipleServerPattern);
    if ((multiServerMatch![3]).includes(",")) {
      const serversName = multiServerMatch![3].split(",");
      const parts = parse_simple(
        url.replace(multiServerMatch![3], serversName[0]),
      );
      var subServer: any;
      for (var i = 1; i < serversName.length; i++) {
        subServer = parse_simple(`temp://${serversName[i]}`);
        parts["servers"].push(subServer["servers"][0]);
      }
      return parts;
    }
    const matches = url.match(pattern);
    var l = fragments.length;
    while (l--) {
      parts[fragments[l]] = matches![l + 1]
        ? decodeURIComponent(matches![l + 1])
        : matches![l + 1];
    }
    parts["servers"] = [
      { host: parts["hostname"], port: parseInt(parts["port"]) },
    ];
    delete parts["hostname"];
    delete parts["port"];
    parts.path = parts.search
      ? (parts.pathname ? parts.pathname + parts.search : parts.search)
      : parts.pathname;
    return parts;
  }

  function parse(url: string): Parts {
    const parsed: any = parse_simple(url);
    if (parsed.auth) parsed.auth = decodeAuth(parsed.auth);
    parsed.search = parsed.search ? queryString("?", parsed.search) : {};
    parsed.hash = parsed.hash ? queryString("#", parsed.hash) : {};
    return parsed;
  }

  function decodeAuth(auth: string): any {
    const split = auth.split(":");
    return {
      user: split[0],
      password: split[1],
    };
  }

  function queryString(identifier: string, qs: string): any {
    const obj: any = {};
    const params = decodeURI(qs || "").replace(
      new RegExp("\\" + identifier),
      "",
    ).split(/&amp;|&/);
    const l = params.length;
    for (var i = 0; i < l; i++) {
      if (params[i]) {
        var index = params[i].indexOf("=");
        if (index === -1) index = params[i].length;
        const key = params[i].substring(0, index);
        const val = params[i].substring(index + 1);
        if (obj.hasOwnProperty(key)) {
          if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
          obj[key].push(val);
        } else {
          obj[key] = val || true;
        }
      }
    }
    return obj;
  }
  return parse(url);
}

export function isSrvUrl(url: string) {
  return /^mongodb\+srv/.test(url);
}

export type SrvConnectOptions = Omit<ConnectOptions, "servers"> & {
  srvServer?: string;
};

export function parseSrvUrl(url: string): SrvConnectOptions {
  const data = parse_url(url);
  const connectOptions: SrvConnectOptions = {
    db: (data.pathname && data.pathname.length > 1)
      ? data.pathname.substring(1)
      : "admin",
  };

  if (data.auth) {
    connectOptions.credential = <Credential> {
      username: data.auth.user,
      password: data.auth.password,
      db: connectOptions.db,
      mechanism: data.search.authMechanism || "SCRAM-SHA-256",
    };
  }
  connectOptions.compression = data.search.compressors
    ? data.search.compressors.split(",")
    : [];
  connectOptions.srvServer = data.servers?.[0].host;

  if (data.search.appname) {
    connectOptions.appname = data.search.appname;
  }
  if (data.search.tls) {
    connectOptions.tls = data.search.tls === "true";
  } else {
    connectOptions.tls = true;
  }
  if (data.search.tlsCAFile) {
    connectOptions.certFile = data.search.tlsCAFile;
  }
  if (data.search.tlsCertificateKeyFile) {
    connectOptions.keyFile = data.search.tlsCertificateKeyFile;
  }
  if (data.search.tlsCertificateKeyFilePassword) {
    connectOptions.keyFilePassword = data.search.tlsCertificateKeyFilePassword;
  }
  if (data.search.safe) {
    connectOptions.safe = data.search.safe === "true";
  }
  if (data.search.retryWrites) {
    connectOptions.retryWrites = data.search.retryWrites === "true";
  }
  return connectOptions;
}

export function parse(url: string): Promise<ConnectOptions> {
  return isSrvUrl(url)
    ? new Srv().resolveSrvUrl(url)
    : Promise.resolve(parseNormalUrl(url));
}

function parseNormalUrl(url: string): ConnectOptions {
  const data = parse_url(url);
  const connectOptions: ConnectOptions = { servers: data.servers!, db: "" };
  for (var i = 0; i < connectOptions.servers.length; i++) {
    if (connectOptions.servers[i].host.includes(".sock")) {
      connectOptions.servers[i].domainSocket = connectOptions.servers[i].host;
    }
    connectOptions.servers[i].port = connectOptions.servers[i].port || 27017;
  }
  connectOptions.db = (data.pathname && data.pathname.length > 1)
    ? data.pathname.substring(1)
    : "admin";
  if (data.auth) {
    connectOptions.credential = <Credential> {
      username: data.auth.user,
      password: data.auth.password,
      db: connectOptions.db,
      mechanism: data.search.authMechanism || "SCRAM-SHA-256",
    };
  }
  connectOptions.compression = data.search.compressors
    ? data.search.compressors.split(",")
    : [];
  if (data.search.appname) {
    connectOptions.appname = data.search.appname;
  }
  if (data.search.tls) {
    connectOptions.tls = data.search.tls === "true";
  }
  if (data.search.tlsCAFile) {
    connectOptions.certFile = data.search.tlsCAFile;
  }
  if (data.search.tlsCertificateKeyFile) {
    connectOptions.keyFile = data.search.tlsCertificateKeyFile;
  }
  if (data.search.tlsCertificateKeyFilePassword) {
    connectOptions.keyFilePassword = data.search.tlsCertificateKeyFilePassword;
  }
  if (data.search.safe) {
    connectOptions.safe = data.search.safe === "true";
  }
  return connectOptions;
}
