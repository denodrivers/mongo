export interface MongoErrorInfo {
  ok: 0;
  errmsg: string;
  code: number;
  codeName: string;
}

export class MongoError extends Error {
  constructor(info: MongoErrorInfo | string) {
    super(`MongoError: ${JSON.stringify(info)}`);
  }
}
