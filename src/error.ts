export interface MongoErrorInfo {
  ok: 0;
  errmsg: string;
  code: number;
  codeName: string;
}

export class MongoError extends Error implements MongoErrorInfo {
  ok: 0;
  errmsg: string;
  code: number;
  codeName: string;

  constructor(info: MongoErrorInfo) {
    super(`MongoError: ${JSON.stringify(info)}`);

    this.ok = info.ok;
    this.errmsg = info.errmsg;
    this.code = info.code;
    this.codeName = info.codeName;
  }
}
