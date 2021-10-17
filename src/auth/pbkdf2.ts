const encoder = new TextEncoder();

const algoMap = {
  sha: "SHA-1",
  "sha-1": "SHA-1",
  sha1: "SHA-1",
  sha256: "SHA-256",
  "sha-256": "SHA-256",
  sha384: "SHA-384",
  "sha-384": "SHA-384",
  "sha-512": "SHA-512",
  sha512: "SHA-512",
};

export async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
  length: number,
  _algo: "sha1" | "sha256",
) {
  const algo = algoMap[_algo];
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: {
        name: algo,
      },
    },
    key,
    length << 3,
  );
}
