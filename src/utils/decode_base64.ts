export function decodeBase64(b64: string): Uint8Array {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let base64 = b64.replace(/-/g, "+").replace(/_/g, "/");

  while (base64.length % 4) {
    base64 += "=";
  }

  let bitString = "";
  for (let i = 0; i < base64.length; i++) {
    const char = base64.charAt(i);
    if (char !== "=") {
      const charIndex = chars.indexOf(char);
      bitString += charIndex.toString(2).padStart(6, "0");
    }
  }

  const bytes = new Uint8Array(bitString.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bitString.substring(8 * i, 8 * (i + 1)), 2);
  }

  return bytes;
}
