/**
 * Representation of a MongoDB server error response.
 * @public
 */
export interface MongoErrorInfo {
  ok: 0;
  errmsg: string;
  code: number;
  codeName: string;
}

/**
 * A base class from which Mongo errors are derived.
 * @public
 */
export abstract class MongoError extends Error {
  constructor(info: MongoErrorInfo | string) {
    super(`MongoError: ${JSON.stringify(info)}`);
  }
}

/**
 * A class representation of an error ocurring during the driver's execution.
 * @public
 */
export class MongoDriverError extends MongoError {
  /**
   * @param info A string containing the error's message.
   */
  constructor(info: string) {
    super(info);
  }
}

/**
 * A class representation of an error returned by MongoDB server.
 * @public
 */
export class MongoServerError extends MongoError implements MongoErrorInfo {
  ok: 0;
  errmsg: string;
  code: number;
  codeName: string;

  /**
   * @param info An object representing the server's error response.
   */
  constructor(info: MongoErrorInfo) {
    super(info);

    this.ok = info.ok;
    this.errmsg = info.errmsg;
    this.code = info.code;
    this.codeName = info.codeName;
  }
}

/**
 * A class representation of a command with invalid arguments
 * @public
 */
export class MongoInvalidArgumentError extends MongoError {
  /**
   * @param info A string containing the error's message.
   */
  constructor(info: string) {
    super(info);
  }
}
