import { ConnectOptions, Credential, Document } from "../types.ts";
import { WireProtocol } from "../protocol/mod.ts";

export abstract class AuthPlugin {
  abstract prepare(
    authContext: AuthContext,
  ): Document;
  abstract auth(
    authContext: AuthContext,
  ): Document;
}
/** Context used during authentication */
export class AuthContext {
  /** The connection to authenticate */
  protocol: WireProtocol;
  /** The credentials to use for authentication */
  credentials?: Credential;
  /** The options passed to the `connect` method */
  options: ConnectOptions;

  /** A response from an initial auth attempt, only some mechanisms use this (e.g, SCRAM) */
  response?: Document;
  /** A random nonce generated for use in an authentication conversation */
  nonce?: Uint8Array;

  constructor(
    protocol: WireProtocol,
    credentials: Credential | undefined,
    options: ConnectOptions,
  ) {
    this.protocol = protocol;
    this.credentials = credentials;
    this.options = options;
    this.nonce = globalThis.crypto.getRandomValues(new Uint8Array(24));
  }
}
