import { Bson } from "../deps.ts";

export type Document = Bson.Document;

export interface Server {
  host: string;
  port: number;
  domainSocket?: string;
}

export interface ConnectOptions {
  compression?: string[];
  certFile?: string;
  keyFile?: string;
  keyFilePassword?: string;
  tls?: boolean;
  safe?: boolean;
  credential?: Credential;
  db: string;
  servers: Server[];
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
  sort?: Document;
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
   * Optional. A document expressing the write concern of the update command. Omit to use the default write concern.
   */
  writeConcern?: Document;

  /**
   * 	Optional. If true, then when an update statement fails, return without performing the remaining update statements.
   *  If false, then when an update fails, continue with the remaining update statements, if any. Defaults to true.
   */
  ordered?: boolean;

  /**
   * 	Optional. If true, updates all documents that meet the query criteria.
   *  If false, limit the update to one document that meet the query criteria. Defaults to false.
   */
  multi?: boolean;

  /**
   * optional list of array filters referenced in filtered positional operators
   */
  arrayFilters?: Document[];

  /**
   * Specify collation (MongoDB 3.4 or higher) settings for update operation (see 3.4 documentation for available fields).
   */
  collation?: Document;

  /**
   * Allow driver to bypass schema validation in MongoDB 3.2 or higher
   */
  bypassDocumentValidation?: boolean;

  /**
   * An optional hint for query optimization. See the update (https://docs.mongodb.com/manual/reference/command/update/#update-command-hint) command reference for more information.
   */
  hint?: Document;

  /**
   * When true, creates a new document if no document matches the query.
   */
  upsert?: boolean;

  /**
   * The write concern timeout.
   */
  wtimeout?: number;

  /**
   * If true, will throw if bson documents start with $ or include a . in any key value
   */
  checkKeys?: boolean;

  /**
   * Serialize functions on any object.
   */
  serializeFunctions?: boolean;

  /**
   * Specify if the BSON serializer should ignore undefined fields.
   */
  ignoreUndefined?: boolean;

  /**
   * Optional. A user-provided comment to attach to this command.
   */
  comment?: Document;

  /**
   * optional session to use for this operation
   */
  // session?: ClientSession
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

export interface DropOptions {
  /**
   * Optional. A document expressing the write concern of the drop command. Omit to use the default write concern.
   */
  writeConcern?: Document;

  /**
   * Optional. A user-provided comment to attach to this command.
   */
  comment?: any;
}

export interface DistinctOptions {
  /**
   * The preferred read preference (ReadPreference.PRIMARY, ReadPreference.PRIMARY_PREFERRED, ReadPreference.SECONDARY, ReadPreference.SECONDARY_PREFERRED, ReadPreference.NEAREST).
   */
  readPreference?: string;
  /**
   * Number of milliseconds to wait before aborting the query.
   */
  maxTimeMS?: number;
  /**
   * pecify collation settings for operation. See aggregation documentation(https://docs.mongodb.com/manual/reference/command/aggregate).
   */
  collation?: Document;
  /**
   * optional session to use for this operation
   */
  // session?:ClientSession;
}

export interface AggregateOptions {
  /**
   * The preferred read preference (ReadPreference.PRIMARY, ReadPreference.PRIMARY_PREFERRED, ReadPreference.SECONDARY, ReadPreference.SECONDARY_PREFERRED, ReadPreference.NEAREST).
   */
  readPreference?: string;
  /**
   * @default 1000
   * The number of documents to return per batch. See aggregation documentation(https://docs.mongodb.com/manual/reference/command/aggregate).
   */
  batchSize?: number;
  /**
   * @default false
   * Explain returns the aggregation execution plan (requires mongodb 2.6 >).
   */
  explain?: boolean;
  /**
   * @default false
   * allowDiskUse lets the server know if it can use disk to store temporary results for the aggregation (requires mongodb 2.6 >).
   */
  allowDiskUse?: boolean;
  /**
   * maxTimeMS specifies a cumulative time limit in milliseconds for processing operations on the cursor. MongoDB interrupts the operation at the earliest following interrupt point.
   */
  maxTimeMS?: number;
  /**
   * @default false
   * Allow driver to bypass schema validation in MongoDB 3.2 or higher.
   */
  bypassDocumentValidation?: boolean;
  /**
   * @default false
   *Return document results as raw BSON buffers.
   */
  raw?: boolean;
  /**
   * @default true
   * Promotes Long values to number if they fit inside the 53 bits resolution.
   */
  promoteLongs?: boolean;
  /**
   * @default true
   * Promotes BSON values to native types where possible, set to false to only receive wrapper types.
   */
  promoteValues?: boolean;
  /**
   * @default false
   * Promotes Binary BSON values to native Node Buffers.
   */
  promoteBuffers?: boolean;
  /**
   * Specify collation settings for operation. See aggregation documentation(https://docs.mongodb.com/manual/reference/command/aggregate).
   */
  collation?: Document;
  /**
   * Add a comment to an aggregation command
   */
  comment?: string;
  /**
   * Add an index selection hint to an aggregation command
   */
  hint?: string | Document;
  /**
   * optional session to use for this operation
   */
  // session?:ClientSession;
}

export interface CreateUserOptions {
  /**
   * The name of the new user.
   */
  username?: string;

  /**
   * The user’s password. The pwd field is not required if you run createUser on the $external database to create users who have credentials stored externally to MongoDB.
   */
  password?: string;

  /**
   * Optional. Any arbitrary information. This field can be used to store any data an admin wishes to associate with this particular user. For example, this could be the user’s full name or employee id.
   */
  customData?: Document;

  /**
   * The roles granted to the user. Can specify an empty array [] to create users without roles.
   */
  roles?: (string | {
    role: string;
    db: string;
  })[];

  /**
   * Optional. Indicates whether the server or the client digests the password.
   * See https://docs.mongodb.com/manual/reference/command/createUser/#dbcmd.createUser
   */
  digestPassword?: boolean;

  /**
   * Optional. The level of write concern for the creation operation. The writeConcern document takes the same fields as the getLastError command.
   */
  writeConcern?: Document;

  /**
   * Optional. The authentication restrictions the server enforces on the created user. Specifies a list of IP addresses and CIDR ranges from which the user is allowed to connect to the server or from which the server can accept users.
   */
  authenticationRestrictions?: Document[];

  /**
   * Optional. Specify the specific SCRAM mechanism or mechanisms for creating SCRAM user credentials.
   */
  mechanisms?: ("SCRAM-SHA-1" | "SCRAM-SHA-256")[];

  /**
   * Optional. A user-provided comment to attach to this command.
   */
  comment?: Document;
}

export interface Credential {
  /**
   * The username to authenticate with. This applies to all mechanisms but may be omitted when authenticating via MONGODB-X509.
   */
  username?: string;

  /**
   * The password to authenticate with. This does not apply to all mechanisms.
   */
  password?: string;

  /**
   * The database used to authenticate. This applies to all mechanisms and defaults to "admin" in SCRAM authentication mechanisms and "$external" for GSSAPI, MONGODB-X509 and PLAIN.
   */
  db?: string;

  /**
   * Which authentication mechanism to use. If not provided, one will be negotiated with the server.
   */
  mechanism?: "SCRAM-SHA-1" | "SCRAM-SHA-256" | "MONGODB-X509";
}

export interface IndexOptions {
  /**
   * Specifies the index’s fields. For each field, specify a key-value pair in which 
   * the key is the name of the field to index and the value is either the index direction 
   * or index type. If specifying direction, specify 1 for ascending or -1 for descending.
   */
  key: Document;

  /**
   * 	A name that uniquely identifies the index.
   */
  name: string;

  /**
   * Optional. Deprecated in MongoDB 4.2.
   */
  background?: boolean;

  /**
   * Optional. Creates a unique index so that the collection will not accept insertion 
   * or update of documents where the index key value matches an existing value in the index.
   * Specify true to create a unique index. The default value is false.
   */
  unique?: boolean;

  /**
   * Optional. If specified, the index only references documents that match the filter expression. 
   * See Partial Indexes for more information.
   */
  partialFilterExpression?: Document;

  /**
   * Optional. If true, the index only references documents with the specified field. 
   * These indexes use less space but behave differently in some situations (particularly sorts). 
   * The default value is false. See Sparse Indexes for more information.
   */
  sparse?: boolean;

  /**
   * Optional. Specifies a value, in seconds, as a TTL to control how long MongoDB retains 
   * documents in this collection. See Expire Data from Collections by Setting TTL for 
   * more information on this functionality. This applies only to TTL indexes.
   */
  expireAfterSeconds?: number;

  /**
   * Optional. A flag that determines whether the index is hidden from the query planner. 
   * A hidden index is not evaluated as part of query plan selection. Default is false.
   */
  hidden?: boolean;

  /**
   * Optional. Allows users to configure the storage engine on a per-index basis when creating an index.
   */
  storageEngine?: Document;

  /**
   * Optional. For text indexes, a document that contains field and weight pairs. 
   * The weight is an integer ranging from 1 to 99,999 and denotes the significance 
   * of the field relative to the other indexed fields in terms of the score. 
   * You can specify weights for some or all the indexed fields. 
   * See Control Search Results with Weights to adjust the scores. 
   * The default value is 1.
   */
  weights?: Document;

  /**
   * Optional. For text indexes, the language that determines the list of 
   * stop words and the rules for the stemmer and tokenizer. 
   * See Text Search Languages for the available languages and Specify a Language 
   * for Text Index for more information and examples. The default value is english.
   */
  default_language?: string;

  /**
   * Optional. For text indexes, the name of the field, in the collection’s documents, 
   * that contains the override language for the document. The default value is language. 
   * See Use any Field to Specify the Language for a Document for an example.
   */
  language_override?: string;

  /**
   * Optional. The text index version number. Users can use this option to override the default version number.
   */
  textIndexVersion?: number;

  /**
   * Optional. The 2dsphere index version number. Users can use this option to override the default version number.
   */
  "2dsphereIndexVersion"?: number;

  /**
   * Optional. For 2d indexes, the number of precision of the stored geohash value of the location data.
   * The bits value ranges from 1 to 32 inclusive. The default value is 26.
   */
  bits?: number;

  /**
   * Optional. For 2d indexes, the lower inclusive boundary for the longitude and latitude values. The default value is -180.0.
   */
  min?: number;

  /**
   * Optional. For 2d indexes, the upper inclusive boundary for the longitude and latitude values. The default value is 180.0.
   */
  max?: number;

  /**
   * For geoHaystack indexes, specify the number of units within which to group the location values; 
   * i.e. group in the same bucket those location values that are within the specified number 
   * of units to each other. The value must be greater than 0.
   */
  bucketSize?: number;

  /**
   * Optional. Specifies the collation for the index.
   */
  collation?: Document;

  /**
   * Allows users to include or exclude specific field paths from a wildcard index using 
   * the { "$**" : 1} key pattern. This option is only valid if creating a wildcard index 
   * on all document fields. You cannot specify this option if creating a wildcard index 
   * on a specific field path and its subfields, e.g. { "path.to.field.$**" : 1 }
   */
  wildcardProjection?: Document;
}

export interface CreateIndexOptions {
  /** 
   * Specifies the indexes to create. Each document in the array specifies a separate index.
   */
  indexes: IndexOptions[];

  /** Optional. A document expressing the write concern. Omit to use the default write concern. */
  writeConcern?: Document;

  /**
   * Optional. The minimum number of data-bearing voting replica set members (i.e. commit quorum), 
   * including the primary, that must report a successful index build before the primary marks the indexes as ready. 
   * A “voting” member is any replica set member where members[n].votes is greater than 0.
   */
  commitQuorum?: number | string;

  /** Optional. A user-provided comment to attach to this command. Once set */
  comment?: Document;
}
