import { Bson } from "../deps.ts";

export type Document = Bson.Document;

export interface ConnectOptions {
  servers: {
    host: string;
    port: number;
  }[];
  dbName?: string;
  [key: string]: any;
}

export interface CountOptions {
  limit?: number;
  skip?: number;
  hint?: Document | string;
  comment?: Document;
  readConcern?: Document;
  collation?: Document;
}

export interface FindOptions {
  findOne?: boolean;
  skip?: number;
  limit?: number;
  projection?: Document;
}

export interface ListDatabaseInfo {
  name: string;
  sizeOnDisk?: number;
  empty?: false;
}

export interface InsertOptions {
  /**
   * Optional. If true, then when an insert of a document fails, return without inserting any remaining documents listed in the inserts array.
   * If false, then when an insert of a document fails, continue to insert the remaining documents. Defaults to true.
   */
  ordered?: boolean;

  /**
   * Optional. A document that expresses the write concern of the insert command. Omit to use the default write concern.
   * Do not explicitly set the write concern for the operation if run in a transaction. To use write concern with transactions, see Transactions and Write Concern.
   */
  writeConcern?: Document;

  /**
   * Optional. Enables insert to bypass document validation during the operation. This lets you insert documents that do not meet the validation requirements.
   */
  bypassDocumentValidation?: boolean;

  /**
   * Optional. A user-provided comment to attach to this command.
   */
  comment?: Document;
}
export interface UpdateOptions {
  /**
   * An array of one or more update statements to perform on the named collection. For details of the update statements
   */
  updates: Document[];
  /**
   * Optional. If true, then when an update statement fails, return without performing the remaining update statements. If false, then when an update fails, continue with the remaining update statements, if any. Defaults to true.
   */
  ordered?: boolean;
  /**
   * Optional. A document expressing the write concern of the update command. Omit to use the default write concern.

   Do not explicitly set the write concern for the operation if run in a transaction. To use write concern with transactions, see Transactions and Write Concern.
   */
  writeConcern?: Document;
  /**
   * Optional. Enables update to bypass document validation during the operation. This lets you update documents that do not meet the validation requirements.
   New in version 3.2.
   */
  bypassDocumentValidation?: boolean;
  /**
   * Optional. A user-provided comment to attach to this command. Once set, this comment appears alongside records of this command in the following locations:
   *
   mongod log messages, in the attr.command.cursor.comment field.
   Database profiler output, in the command.comment field.
   currentOp output, in the command.comment field.
   A comment can be any valid BSON type (string, integer, object, array, etc).
   */
  comment?: any;
}
export interface DeleteOptions {
  /**
   * Optional. If true, then when a delete statement fails, return without performing the remaining delete statements.
   * If false, then when a delete statement fails, continue with the remaining delete statements, if any. Defaults to true.
   */
  ordered?: boolean;

  /**
   * Optional. A document expressing the write concern of the delete command. Omit to use the default write concern.
   */
  writeConcern?: Document;

  /**
   * Optional. Specifies the collation to use for the operation.
   * See https://docs.mongodb.com/manual/reference/command/delete/#deletes-array-collation
   */
  collation?: Document;

  /**
   * Optional. A user-provided comment to attach to this command.
   */
  comment?: Document;

  /**
   * The number of matching documents to delete. Specify either a 0 to delete all matching documents or 1 to delete a single document.
   */
  limit?: number;

  /**
   * Optional. A document or string that specifies the index to use to support the query predicate.
   * The option can take an index specification document or the index name string.
   * If you specify an index that does not exist, the operation errors.
   */
  hint?: Document | string;
}
