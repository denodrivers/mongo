export type Document = any;

export interface ConnectOptions {
  servers: {
    host: string;
    port: number;
  }[];
  dbName?: string;
  [key: string]: any;
}

export interface FindOptions {
  findOne?: boolean;
  skip?: number;
  limit?: number;
  projection?:Document;
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
