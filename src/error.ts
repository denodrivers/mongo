export interface MongoErrorInfo {
  ok: 0;
  errmsg: string;
  code: number;
  codeName: string;
}

export abstract class MongoError extends Error {

  constructor(info: MongoErrorInfo | string) {
    super(`MongoError: ${JSON.stringify(info)}`);
  }
}

export class MongoDriverError extends MongoError {

  constructor(info: string) {
    super(info);
  }
}

export class MongoServerError extends MongoError implements MongoErrorInfo {
  ok: 0;
  errmsg: string;
  code: number;
  codeName: string;

  constructor(info: MongoErrorInfo) {
    super(info);

    this.ok = info.ok;
    this.errmsg = info.errmsg;
    this.code = info.code;
    this.codeName = info.codeName;
  }
}
