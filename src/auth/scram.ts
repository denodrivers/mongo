import { Credential, Document } from "../types.ts";
import { saslprep } from "../utils/saslprep/mod.ts";
import { AuthContext, AuthPlugin } from "./base.ts";
import { HandshakeDocument } from "../protocol/handshake.ts";
import { MongoDriverError } from "../error.ts";
import { b64, Bson, createHash, HmacSha1, HmacSha256 } from "../../deps.ts";
import { driverMetadata } from "../protocol/mod.ts";
import { pbkdf2 } from "./pbkdf2.ts";

type CryptoMethod = "sha1" | "sha256";

const enc = new TextEncoder();
const dec = new TextDecoder();

export class ScramAuthPlugin extends AuthPlugin {
  cryptoMethod: CryptoMethod;
  constructor(cryptoMethod: CryptoMethod) {
    super();
    this.cryptoMethod = cryptoMethod || "sha256";
  }

  prepare(authContext: AuthContext): Document {
    const handshakeDoc = <HandshakeDocument> {
      ismaster: true,
      client: driverMetadata,
      compression: authContext.options.compression,
    };
    const request = {
      ...handshakeDoc,
      ...{
        speculativeAuthenticate: {
          ...makeFirstMessage(
            this.cryptoMethod,
            authContext.options.credential!,
            authContext.nonce!,
          ),
          ...{ db: authContext.options.credential!.db },
        },
      },
    };
    return request;
  }

  auth(authContext: AuthContext): Promise<Document> {
    const response = authContext.response;
    if (response && response.speculativeAuthenticate) {
      return continueScramConversation(
        this.cryptoMethod,
        response.speculativeAuthenticate,
        authContext,
      );
    }
    return executeScram(this.cryptoMethod, authContext);
  }
}
export function cleanUsername(username: string) {
  return username.replace("=", "=3D").replace(",", "=2C");
}

export function clientFirstMessageBare(username: string, nonce: Uint8Array) {
  // NOTE: This is done b/c Javascript uses UTF-16, but the server is hashing in UTF-8.
  // Since the username is not sasl-prep-d, we need to do this here.
  return Uint8Array.from(
    [
      ...enc.encode("n="),
      ...enc.encode(username),
      ...enc.encode(",r="),
      ...enc.encode(b64.encode(nonce)),
    ],
  );
}

export function makeFirstMessage(
  cryptoMethod: CryptoMethod,
  credentials: Credential,
  nonce: Uint8Array,
) {
  const username = cleanUsername(credentials.username!);
  const mechanism = cryptoMethod === "sha1" ? "SCRAM-SHA-1" : "SCRAM-SHA-256";

  // NOTE: This is done b/c Javascript uses UTF-16, but the server is hashing in UTF-8.
  // Since the username is not sasl-prep-d, we need to do this here.
  return {
    saslStart: 1,
    mechanism,
    payload: new Bson.Binary(
      Uint8Array.from(
        [...enc.encode("n,,"), ...clientFirstMessageBare(username, nonce)],
      ),
    ),
    autoAuthorize: 1,
    options: { skipEmptyExchange: true },
  };
}

export async function executeScram(
  cryptoMethod: CryptoMethod,
  authContext: AuthContext,
) {
  const { protocol, credentials } = authContext;
  if (!credentials) {
    throw new MongoDriverError("AuthContext must provide credentials.");
  }
  if (!authContext.nonce) {
    throw new MongoDriverError(
      "AuthContext must contain a valid nonce property",
    );
  }
  const nonce = authContext.nonce;
  const db = credentials.db!;

  const saslStartCmd = makeFirstMessage(cryptoMethod, credentials, nonce);
  const result = await protocol.commandSingle(db, saslStartCmd);
  return continueScramConversation(cryptoMethod, result, authContext);
}

export async function continueScramConversation(
  cryptoMethod: CryptoMethod,
  response: Document,
  authContext: AuthContext,
) {
  const protocol = authContext.protocol;
  const credentials = authContext.credentials;
  if (!credentials) {
    throw new MongoDriverError("AuthContext must provide credentials.");
  }
  if (!authContext.nonce) {
    throw new MongoDriverError("Unable to continue SCRAM without valid nonce");
  }
  const nonce = authContext.nonce;

  const db = credentials.db!;
  const username = cleanUsername(credentials.username!);
  const password = credentials.password!;

  let processedPassword;
  if (cryptoMethod === "sha256") {
    processedPassword = saslprep(password);
  } else {
    processedPassword = passwordDigest(username, password);
  }

  const payload = fixPayload(dec.decode(response.payload.buffer));
  const dict = parsePayload(payload);

  const iterations = parseInt(dict.i, 10);
  if (iterations && iterations < 4096) {
    throw new MongoDriverError(
      `Server returned an invalid iteration count ${iterations}`,
    );
  }

  const salt = dict.s;
  const rnonce = dict.r;
  if (rnonce.startsWith("nonce")) {
    throw new MongoDriverError(`Server returned an invalid nonce: ${rnonce}`);
  }

  // Set up start of proof
  const withoutProof = `c=biws,r=${rnonce}`;
  const saltedPassword = await HI(
    processedPassword,
    b64.decode(salt),
    iterations,
    cryptoMethod,
  );

  const clientKey = HMAC(cryptoMethod, saltedPassword, "Client Key");

  const serverKey = HMAC(cryptoMethod, saltedPassword, "Server Key");
  const storedKey = H(cryptoMethod, clientKey);
  const authMessage = [
    dec.decode(clientFirstMessageBare(username, nonce)),
    payload,
    withoutProof,
  ].join(",");

  const clientSignature = HMAC(cryptoMethod, storedKey, authMessage);
  const clientProof = `p=${xor(clientKey, clientSignature)}`;
  const clientFinal = [withoutProof, clientProof].join(",");

  const serverSignature = HMAC(cryptoMethod, serverKey, authMessage);

  const saslContinueCmd = {
    saslContinue: 1,
    conversationId: response.conversationId,
    payload: new Bson.Binary(enc.encode(clientFinal)),
  };

  const result = await protocol.commandSingle(db, saslContinueCmd);

  const parsedResponse = parsePayload(
    fixPayload2(dec.decode(result.payload.buffer)),
  );
  if (!compareDigest(b64.decode(parsedResponse.v), serverSignature)) {
    // throw new MongoDriverError("Server returned an invalid signature");
  }
  if (result.done) {
    return result;
  }
  const retrySaslContinueCmd = {
    saslContinue: 1,
    conversationId: result.conversationId,
    payload: new Uint8Array(0),
  };

  return protocol.commandSingle(db, retrySaslContinueCmd);
}

//this is a hack to fix codification in payload (in being and end of payload exists a codification problem, needs investigation ...)
export function fixPayload(payload: string) {
  const temp = payload.split("=");
  temp.shift();
  const it = parseInt(temp.pop()!, 10);
  payload = "r=" + temp.join("=") + "=" + it;
  return payload;
}
//this is a second hack to fix codification in payload (in being and end of payload exists a codification problem, needs investigation ...)
export function fixPayload2(payload: string) {
  let temp = payload.split("v=");
  temp.shift();
  payload = temp.join("v=");
  temp = payload.split("ok");
  temp.pop();
  return "v=" + temp.join("ok");
}

export function parsePayload(payload: string) {
  const dict: Document = {};
  const parts = payload.split(",");
  for (let i = 0; i < parts.length; i++) {
    const valueParts = parts[i].split("=");
    dict[valueParts[0]] = valueParts[1];
  }

  return dict;
}

export function passwordDigest(username: string, password: string) {
  if (typeof username !== "string") {
    throw new MongoDriverError("username must be a string");
  }

  if (typeof password !== "string") {
    throw new MongoDriverError("password must be a string");
  }

  if (password.length === 0) {
    throw new MongoDriverError("password cannot be empty");
  }

  const md5 = createHash("md5");
  md5.update(`${username}:mongo:${password}`);
  return md5.toString(); //hex
}

// XOR two buffers
export function xor(a: Uint8Array, b: Uint8Array) {
  const length = Math.max(a.length, b.length);
  const res = new Uint8Array(length);

  for (let i = 0; i < length; i += 1) {
    res[i] = a[i] ^ b[i];
  }

  return b64.encode(res);
}

export function H(method: CryptoMethod, text: Uint8Array) {
  return new Uint8Array(createHash(method).update(text).digest());
}

export function HMAC(
  method: CryptoMethod,
  key: ArrayBuffer,
  text: Uint8Array | string,
) {
  if (method === "sha256") {
    return new Uint8Array(new HmacSha256(key).update(text).digest());
  } else {
    return new Uint8Array(new HmacSha1(key).update(text).digest());
  }
}

interface HICache {
  [key: string]: ArrayBuffer;
}

let _hiCache: HICache = {};
let _hiCacheCount = 0;
function _hiCachePurge() {
  _hiCache = {};
  _hiCacheCount = 0;
}

const hiLengthMap = {
  sha256: 32,
  sha1: 20,
};

export async function HI(
  data: string,
  salt: Uint8Array,
  iterations: number,
  cryptoMethod: CryptoMethod,
) {
  // omit the work if already generated
  const key = [data, b64.encode(salt), iterations].join(
    "_",
  );
  if (_hiCache[key] !== undefined) {
    return _hiCache[key];
  }

  // generate the salt
  const saltedData = await pbkdf2(
    data,
    salt,
    iterations,
    hiLengthMap[cryptoMethod],
    cryptoMethod,
  );

  // cache a copy to speed up the next lookup, but prevent unbounded cache growth
  if (_hiCacheCount >= 200) {
    _hiCachePurge();
  }

  _hiCache[key] = saltedData;
  _hiCacheCount += 1;
  return new Uint8Array(saltedData);
}

export function compareDigest(lhs: Uint8Array, rhs: Uint8Array) {
  if (lhs.length !== rhs.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < lhs.length; i++) {
    result |= lhs[i] ^ rhs[i];
  }

  return result === 0;
}
