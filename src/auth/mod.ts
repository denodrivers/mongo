import { createHash, HmacSha1, pbkdf2Sync, randomBytes } from "../../deps.ts";
import { Binary } from "../../bson/mod.ts";

export function passwordDigest(username: string, password: string): string {
  const hash = createHash("md5");
  hash.update(`${username}:mongo:${password}`);
  return hash.toString();
}
export function HI(data: string, salt: string, iterations: number) {
  return pbkdf2Sync(data, salt, iterations, 20, "sha1");
}
export function clientKeyFor(key: string) {
  return keyFor(key, "Client Key");
}

/**
 * @param serverKey
 * @param key
 * @return string
 */
function keyFor(key: string, serverKey: string): string {
  return new HmacSha1(key).update(serverKey).hex();
}

export function serverKeyFor(key: string) {
  return keyFor(key, "Server Key");
}

export function storedKeyFor(data: string) {
  return createHash("sha1").update(data).toString();
}

export function nonceFor() {
  return randomBytes(24);
}
export function clientFirstMessageBare(username: string, nonce: Uint8Array) {
  return Uint8Array.from(
    [
      ...getUint8Array("n="),
      ...getUint8Array(username),
      ...getUint8Array(",r="),
      ...nonce,
    ],
  );
}

/**
 * @param input
 */
function getUint8Array(input: string) {
  return new TextEncoder().encode(input);
}

export function cleanUsername(username: string) {
  return username.replace("=", "=3D").replace(",", "=2C");
}

export function makeFirstMessage(
  credentials: { username: string },
  nonce: Uint8Array,
) {
  const username = cleanUsername(credentials.username);
  const mechanism = "SCRAM-SHA-1";
  return {
    saslStart: 1,
    mechanism,
    autoAuthorize: 1,
    payload: new Binary(
      Uint8Array.from(
        [...getUint8Array("n,,"), ...clientFirstMessageBare(username, nonce)],
      ),
    ),
    options: {
      skipEmptyExchange: true,
    },
  };
}
