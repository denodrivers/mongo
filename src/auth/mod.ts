import {createHash, HmacSha1, pbkdf2Sync} from "../../deps.ts";

export function passwordDigest(username: string, password: string): string {
  const hash = createHash("md5");
  hash.update(`${username}:mongo:${password}`);
  return hash.toString();
}
export function HI(data: string, salt: string, iterations: number) {
  return pbkdf2Sync(data, salt, iterations, 20, "sha1");
}
export function clientKeyFor(key:string){
  return new HmacSha1(key).update('Client Key').hex();
}
export function serverKeyFor(key:string){
  return new HmacSha1(key).update('Server Key').hex();
}
