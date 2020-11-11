export interface MongoErrorInfo {
  ok: 0;
  errmsg: string;
  code: number;
  codeName: string;
}

export class MongoError extends Error {
  constructor(info: MongoErrorInfo) {
    super(`MongoError: ${JSON.stringify(info)}`);
  }
}
