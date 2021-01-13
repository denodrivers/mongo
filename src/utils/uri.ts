// mongodb://username:password@example.com:27017,example2.com:27017,...,example.comN:27017/database?key=value&keyN=valueN
import { ConnectOptions, Credential } from "../types.ts";

interface Parts {
  auth?: { user: string; password?: string };
  hash?: any;
  hostname?: string;
  href?: string;
  path?: string;
  pathname?: string;
  port?: string;
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

  function parse_simple(url: string): any {
    const parts: any = {};
    parts.href = url;
    const matches = url.match(pattern);
    var l = fragments.length;
    while (l--) {
      parts[fragments[l]] = matches![l + 1]
        ? decodeURIComponent(matches![l + 1])
        : matches![l + 1];
    }
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
export function parse(url: string, optOverride: any = {}): ConnectOptions {
  const data = parse_url(url);
  const connectOptions: ConnectOptions = { servers: [], db: "" };
  var server: any = {
    host: data.hostname,
    port: data.port ? parseInt(data.port) : 27017,
  };
  if (data.hostname!.includes(".sock")) {
    server.domainSocket = data.hostname;
  }
  connectOptions.servers = [server];
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
  return { ...connectOptions, ...optOverride } as ConnectOptions;
}
