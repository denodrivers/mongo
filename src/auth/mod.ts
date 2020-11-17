import {createHash} from '../../deps.ts';

export function passwordDigest(username:string, password:string):string{
  const hash = createHash('md5');
  hash.update(`${username}:mongo:${password}`);
  return hash.toString();
}
