import { parseSrvUrl } from "./uri.ts";
import { ConnectOptions } from "../types.ts";

enum AllowedOption {
  authSource = "authSource",
  replicaSet = "replicaSet",
  loadBalanced = "loadBalanced",
}

function isAllowedOption(key: unknown): key is AllowedOption {
  return Object.values(AllowedOption).includes(key as AllowedOption);
}

interface Resolver {
  resolveDns: typeof Deno.resolveDns;
}

interface SRVResolveResultOptions {
  authSource?: string;
  replicaSet?: string;
  loadBalanced?: string;
}

interface SRVResolveResult {
  servers: { host: string; port: number }[];
  options: SRVResolveResultOptions;
}

class SRVError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "SRVError";
  }
}

export class Srv {
  resolver: Resolver;

  constructor(resolver = { resolveDns: Deno.resolveDns }) {
    this.resolver = resolver;
  }

  async resolveSrvUrl(urlString: string): Promise<ConnectOptions> {
    const options = parseSrvUrl(urlString);
    const { srvServer, ...connectOptions } = options;
    if (!srvServer) {
      throw new SRVError(
        `Could not parse srv server address from ${urlString}`,
      );
    }
    const resolveResult = await this.resolve(srvServer);
    return {
      servers: resolveResult.servers,
      // TODO: Check and throw on invalid options
      ...resolveResult.options,
      ...connectOptions,
    };
  }

  async resolve(url: string): Promise<SRVResolveResult> {
    const tokens = url.split(".");
    if (tokens.length < 3) {
      throw new SRVError(
        `Expected url in format 'host.domain.tld', received ${url}`,
      );
    }

    const srvRecord = await this.resolver.resolveDns(
      `_mongodb._tcp.${url}`,
      "SRV",
    );
    if (!(srvRecord?.length > 0)) {
      throw new SRVError(
        `Expected at least one SRV record, received ${srvRecord?.length} for url ${url}`,
      );
    }
    const txtRecords = await this.resolver.resolveDns(url, "TXT");
    if (txtRecords?.length !== 1) {
      throw new SRVError(
        `Expected exactly one TXT record, received ${txtRecords?.length} for url ${url}`,
      );
    }

    const servers = srvRecord.map((record) => {
      return {
        host: record.target,
        port: record.port,
      };
    });

    const optionsUri = txtRecords[0].join("");
    const options: { valid: SRVResolveResultOptions; illegal: string[] } = {
      valid: {},
      illegal: [],
    };
    for (const option of optionsUri.split("&")) {
      const [key, value] = option.split("=");
      if (isAllowedOption(key) && !!value) options.valid[key] = value;
      else options.illegal.push(option);
    }

    if (options.illegal.length !== 0) {
      throw new SRVError(
        `Illegal uri options: ${options.illegal}. Allowed options: ${
          Object.values(AllowedOption)
        }`,
      );
    }

    return {
      servers,
      options: options.valid,
    };
  }
}
