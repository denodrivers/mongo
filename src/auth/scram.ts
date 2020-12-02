import { Credential, Document } from "../types.ts";
import { AuthPlugin } from "./base.ts";

export class ScramAuthPlugin extends AuthPlugin {
  prepare(credential: Credential): Document {
    const nonce = window.crypto.getRandomValues(new Uint8Array(24));
    return {
      nonce,
    };
  }
}
