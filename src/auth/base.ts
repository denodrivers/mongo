import { Credential, Document } from "../types.ts";

export abstract class AuthPlugin {
  abstract prepare(credential: Credential): Document;
  auth() {}
}
