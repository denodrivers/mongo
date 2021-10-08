import { Binary, ObjectId } from "../../deps.ts";
import { Document, ReadPreference } from "../types.ts";
import { ReadConcern, WriteConcern } from "../types/read_write_concern.ts";

export type FileId = ObjectId;

export interface Chunk {
  _id: ObjectId;
  files_id: ObjectId;
  n: number;
  data: Binary;
}

export interface File {
  _id: ObjectId;
  length: number;
  chunkSize: number;
  uploadDate: Date;
  filename: string;
  metadata?: Document;
}

export interface GridFSBucketOptions {
  /**
   * The bucket name. Defaults to 'fs'.
   */
  bucketName?: string;

  /**
   * The chunk size in bytes. Defaults to 255 KiB.
   */
  chunkSizeBytes?: number;

  /**
   * The write concern. Defaults to the write concern of the database.
   */
  writeConcern?: WriteConcern;

  /**
   * The read concern. Defaults to the read concern of the database.
   */
  readConcern?: ReadConcern;

  /**
   * The read preference. Defaults to the read preference of the database.
   */
  readPreference?: ReadPreference;
}

export interface GridFSUploadOptions {
  /**
   * The number of bytes per chunk of this file. Defaults to the
   * chunkSizeBytes in the GridFSBucketOptions.
   */
  chunkSizeBytes?: number;

  /**
   * User data for the 'metadata' field of the files collection document.
   * If not provided the driver MUST omit the metadata field from the
   * files collection document.
   */
  metadata?: Document;
}

export class GridFSFindOptions {
  /**
   * Enables writing to temporary files on the server. When set to true, the server
   * can write temporary data to disk while executing the find operation on the files collection.
   *
   * This option is sent only if the caller explicitly provides a value. The default
   * is to not send a value. For servers < 3.2, this option is ignored and not sent
   * as allowDiskUse does not exist in the OP_QUERY wire protocol.
   *
   * @see https://docs.mongodb.com/manual/reference/command/find/
   */
  allowDiskUse?: boolean;

  /**
   * The number of documents to return per batch.
   */
  batchSize?: number;

  /**
   * The maximum number of documents to return.
   */
  limit?: number;

  /**
   * The maximum amount of time to allow the query to run.
   */
  maxTimeMS?: number;

  /**
   * The server normally times out idle cursors after an inactivity period (10 minutes)
   * to prevent excess memory use. Set this option to prevent that.
   */
  noCursorTimeout?: boolean;

  /**
   * The number of documents to skip before returning.
   */
  skip?: number;

  /**
   * The order by which to sort results. Defaults to not sorting.
   */
  sort?: Document;
}
