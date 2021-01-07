// mongodb://username:password@example.com:27017,example2.com:27017,...,example.comN:27017/database?key=value&keyN=valueN
import { ConnectOptions, Credential } from "../types.ts";

export function parse_url(url: string): any {
  // Variables
  var connection_part: string | string[] = "";
  var auth_part = "";
  var query_string_part = "";
  var dbName = "admin";
  // if url supplied is null it defaults to localhost
  if (!url || url.indexOf("/") < 0) {
    url = "127.0.0.1/" + url;
  }
  // Must start with mongodb
  if (url.indexOf("mongodb://") != 0) {
    url = "mongodb://" + url;
  }
  // If we have a ? mark cut the query elements off
  if (url.indexOf("?") != -1) {
    query_string_part = url.substr(url.indexOf("?") + 1);
    connection_part = url.substring("mongodb://".length, url.indexOf("?"));
  } else {
    connection_part = url.substring("mongodb://".length);
  }

  // Check if we have auth params
  if (connection_part.indexOf("@") != -1) {
    auth_part = connection_part.split("@")[0];
    connection_part = connection_part.split("@")[1];
  }

  // Check if the connection string has a db
  if (connection_part.indexOf(".sock") != -1) {
    if (connection_part.indexOf(".sock/") != -1) {
      dbName = connection_part.split(".sock/")[1];
      connection_part = connection_part.split(
        "/",
        connection_part.indexOf(".sock") + ".sock".length,
      );
    }
  } else if (connection_part.indexOf("/") != -1) {
    dbName = connection_part.split("/")[1];
    connection_part = connection_part.split("/")[0];
  }

  // Result object
  var object: any = {};

  // Pick apart the authentication part of the string
  var authPart = auth_part || "";
  var auth = authPart.split(":", 2);

  // Decode the URI components
  auth[0] = decodeURIComponent(auth[0]);
  if (auth[1]) {
    auth[1] = decodeURIComponent(auth[1]);
  }

  // Add auth to final object if we have 2 elements
  if (auth.length == 2) object.auth = { user: auth[0], password: auth[1] };

  // Variables used for temporary storage
  var hostPart;
  var urlOptions;
  var servers;
  var compression;
  var serverOptions: any = { socketOptions: {} };
  var dbOptions: any = { read_preference_tags: [] };
  var replSetServersOptions: any = { socketOptions: {} };
  let mongosOptions: any = { socketOptions: {} };
  // Add server options to final object
  object.server_options = serverOptions;
  object.db_options = dbOptions;
  object.rs_options = replSetServersOptions;
  object.mongos_options = {};

  // Let's check if we are using a domain socket
  if (url.match(/\.sock/)) {
    // Split out the socket part
    var domainSocket = url.substring(
      url.indexOf("mongodb://") + "mongodb://".length,
      url.lastIndexOf(".sock") + ".sock".length,
    );
    // Clean out any auth stuff if any
    if (domainSocket.indexOf("@") != -1) {
      domainSocket = domainSocket.split("@")[1];
    }
    servers = [{ domain_socket: domainSocket }];
  } else {
    // Split up the db
    hostPart = connection_part;
    // Parse all server results
    servers = hostPart.toString().split(",").map(function (h) {
      var _host, _port, ipv6match;
      //check if it matches [IPv6]:port, where the port number is optional
      if ((ipv6match = /\[([^\]]+)\](?:\:(.+))?/.exec(h))) {
        _host = ipv6match[1];
        _port = parseInt(ipv6match[2], 10) || 27017;
      } else {
        //otherwise assume it's IPv4, or plain hostname
        var hostPort = h.split(":", 2);
        _host = hostPort[0] || "localhost";
        _port = hostPort[1] != null ? parseInt(hostPort[1], 10) : 27017;
        // Check for localhost?safe=true style case
        if (_host.indexOf("?") != -1) _host = _host.split(/\?/)[0];
      }
      // Return the mapped object
      return { host: _host, port: _port };
    });
  }

  // Get the db name
  object.dbName = dbName || "admin";
  // Split up all the options
  urlOptions = (query_string_part || "").split(/[&;]/);
  // Ugh, we have to figure out which options go to which constructor manually.
  urlOptions.forEach(function (opt) {
    if (!opt) return;
    var splitOpt = opt.split("="), name = splitOpt[0], value = splitOpt[1];
    // Options implementations
    switch (name) {
      case "slaveOk":
      case "slave_ok":
        serverOptions.slave_ok = value === "true";
        dbOptions.slaveOk = value === "true";
        break;
      case "maxPoolSize":
      case "poolSize":
        serverOptions.poolSize = parseInt(value, 10);
        replSetServersOptions.poolSize = parseInt(value, 10);
        break;
      case "appname":
        object.appname = decodeURIComponent(value);
        break;
      case "autoReconnect":
      case "auto_reconnect":
        serverOptions.auto_reconnect = value === "true";
        break;
      case "ssl":
        if (value === "prefer") {
          serverOptions.ssl = value;
          replSetServersOptions.ssl = value;
          mongosOptions.ssl = value;
          break;
        }
        serverOptions.ssl = value === "true";
        replSetServersOptions.ssl = value === "true";
        mongosOptions.ssl = value === "true";
        break;
      case "sslValidate":
        serverOptions.sslValidate = value === "true";
        replSetServersOptions.sslValidate = value === "true";
        mongosOptions.sslValidate = value === "true";
        break;
      case "replicaSet":
      case "rs_name":
        replSetServersOptions.rs_name = value;
        break;
      case "reconnectWait":
        replSetServersOptions.reconnectWait = parseInt(value, 10);
        break;
      case "retries":
        replSetServersOptions.retries = parseInt(value, 10);
        break;
      case "readSecondary":
      case "read_secondary":
        replSetServersOptions.read_secondary = value === "true";
        break;
      case "fsync":
        dbOptions.fsync = value === "true";
        break;
      case "journal":
        dbOptions.j = value === "true";
        break;
      case "safe":
        dbOptions.safe = value === "true";
        break;
      case "nativeParser":
      case "native_parser":
        dbOptions.native_parser = value === "true";
        break;
      case "readConcernLevel":
        dbOptions.readConcern = value; // TODO new ReadConcern(value);
        break;
      case "connectTimeoutMS":
        serverOptions.socketOptions.connectTimeoutMS = parseInt(value, 10);
        replSetServersOptions.socketOptions.connectTimeoutMS = parseInt(
          value,
          10,
        );
        mongosOptions.socketOptions.connectTimeoutMS = parseInt(value, 10);
        break;
      case "socketTimeoutMS":
        serverOptions.socketOptions.socketTimeoutMS = parseInt(value, 10);
        replSetServersOptions.socketOptions.socketTimeoutMS = parseInt(
          value,
          10,
        );
        mongosOptions.socketOptions.socketTimeoutMS = parseInt(value, 10);
        break;
      case "w":
        dbOptions.w = parseInt(value, 10);
        if (isNaN(dbOptions.w)) dbOptions.w = value;
        break;
      case "authSource":
        dbOptions.authSource = value;
        break;
      case "gssapiServiceName":
        dbOptions.gssapiServiceName = value;
        break;
      case "authMechanism":
        if (value === "GSSAPI") {
          // If no password provided decode only the principal
          if (object.auth == null) {
            let urlDecodeAuthPart = decodeURIComponent(authPart);
            if (urlDecodeAuthPart.indexOf("@") === -1) {
              throw new Error("GSSAPI requires a provided principal");
            }
            object.auth = { user: urlDecodeAuthPart, password: null };
          } else {
            object.auth.user = decodeURIComponent(object.auth.user);
          }
        } else if (value === "MONGODB-X509") {
          object.auth = { user: decodeURIComponent(authPart) };
        }

        // Only support GSSAPI or MONGODB-CR for now
        if (
          value !== "GSSAPI" &&
          value !== "MONGODB-X509" &&
          value !== "MONGODB-CR" &&
          value !== "DEFAULT" &&
          value !== "SCRAM-SHA-1" &&
          value !== "SCRAM-SHA-256" &&
          value !== "PLAIN"
        ) {
          throw new Error(
            "Only DEFAULT, GSSAPI, PLAIN, MONGODB-X509, or SCRAM-SHA-1 is supported by authMechanism",
          );
        }

        // Authentication mechanism
        dbOptions.authMechanism = value;
        break;
      case "authMechanismProperties":
        {
          // Split up into key, value pairs
          let values = value.split(",");
          let o: any = {};
          // For each value split into key, value
          values.forEach(function (x) {
            let v = x.split(":");
            o[v[0]] = v[1];
          });

          // Set all authMechanismProperties
          dbOptions.authMechanismProperties = o;
          // Set the service name value
          if (typeof o.SERVICE_NAME === "string") {
            dbOptions.gssapiServiceName = o.SERVICE_NAME;
          }
          if (typeof o.SERVICE_REALM === "string") {
            dbOptions.gssapiServiceRealm = o.SERVICE_REALM;
          }
          if (typeof o.CANONICALIZE_HOST_NAME === "string") {
            dbOptions.gssapiCanonicalizeHostName =
              o.CANONICALIZE_HOST_NAME === "true" ? true : false;
          }
        }
        break;
      case "wtimeoutMS":
        dbOptions.wtimeout = parseInt(value, 10);
        break;
      case "readPreference":
        dbOptions.readPreference = value;
        break;
      case "maxStalenessSeconds":
        dbOptions.maxStalenessSeconds = parseInt(value, 10);
        break;
      case "readPreferenceTags":
        {
          // Decode the value
          value = decodeURIComponent(value);
          // Contains the tag object
          let tagObject: any = {};
          if (value == null || value === "") {
            dbOptions.read_preference_tags.push(tagObject);
            break;
          }

          // Split up the tags
          let tags = value.split(/,/);
          for (let i = 0; i < tags.length; i++) {
            let parts = tags[i].trim().split(/:/);
            tagObject[parts[0]] = parts[1];
          }

          // Set the preferences tags
          dbOptions.read_preference_tags.push(tagObject);
        }
        break;
      case "compressors":
        {
          compression = serverOptions.compression || {};
          let compressors = value.split(",");
          if (
            !compressors.every(function (compressor) {
              return compressor === "snappy" || compressor === "zlib";
            })
          ) {
            throw new Error(
              "Compressors must be at least one of snappy or zlib",
            );
          }

          compression.compressors = compressors;
          serverOptions.compression = compression;
        }
        break;
      case "zlibCompressionLevel":
        {
          compression = serverOptions.compression || {};
          let zlibCompressionLevel = parseInt(value, 10);
          if (zlibCompressionLevel < -1 || zlibCompressionLevel > 9) {
            throw new Error(
              "zlibCompressionLevel must be an integer between -1 and 9",
            );
          }

          compression.zlibCompressionLevel = zlibCompressionLevel;
          serverOptions.compression = compression;
        }
        break;
      case "retryWrites":
        dbOptions.retryWrites = value === "true";
        break;
      case "minSize":
        dbOptions.minSize = parseInt(value, 10);
        break;
      default:
        {
          console.log(`${name} is not supported as a connection string option`);
        }
        break;
    }
  });

  // No tags: should be null (not [])
  if (dbOptions.read_preference_tags.length === 0) {
    dbOptions.read_preference_tags = null;
  }

  // Validate if there are an invalid write concern combinations
  if (
    (dbOptions.w == -1 || dbOptions.w == 0) && (
      dbOptions.journal == true ||
      dbOptions.fsync == true ||
      dbOptions.safe == true
    )
  ) {
    throw new Error(
      "w set to -1 or 0 cannot be combined with safe/w/journal/fsync",
    );
  }

  // If no read preference set it to primary
  if (!dbOptions.read_preference) dbOptions.read_preference = "primary";

  // Add servers to result
  object.servers = servers;
  // Returned parsed object
  return object;
}
export function parse(url: string, optOverride: any = {}): ConnectOptions {
  var data = { ...parse_url(url), ...optOverride };
  var connectOptions: any = {};
  connectOptions.servers = data.servers;
  connectOptions.db = data.dbName;
  if (data.compression) {
    connectOptions.compression = data.compression;
  }
  if (data.auth) {
    connectOptions.credential = <Credential> {
      username: data.auth.user,
      password: data.auth.password,
      db: data.dbName,
      mechanism: data.db_options.authMechanism || "SCRAM-SHA-256",
    };
  }
  connectOptions.compression = data.server_options.compression
    ? data.server_options.compression.compressors
    : [];
  return connectOptions as ConnectOptions;
}
