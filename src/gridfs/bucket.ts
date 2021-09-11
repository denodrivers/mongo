import { assert, ObjectId } from "../../deps.ts";
import { Collection } from "../collection/collection.ts";
import { FindCursor } from "../collection/commands/find.ts";
import { Database } from "../database.ts";
import { Filter } from "../types.ts";
import {
  Chunk,
  File,
  FileId,
  GridFSBucketOptions,
  GridFSFindOptions,
  GridFSUploadOptions,
} from "../types/gridfs.ts";

export class GridFSBucket {
  #chunksCollection: Collection<Chunk>;
  #fileCollection: Collection<File>;

  /**
   * Create a new GridFSBucket object on @db with the given @options.
   */
  constructor(
    db: Database,
    options: GridFSBucketOptions = { bucketName: "fs" },
  ) {
    this.#chunksCollection = db.collection(options.bucketName + ".chunks");
    this.#fileCollection = db.collection(options.bucketName + ".files");
  }

  /**
   * Opens a Stream that the application can write the contents of the file to.
   * The driver generates the file id.
   *
   * Returns a Stream to which the application will write the contents.
   *
   * Note: this method is provided for backward compatibility. In languages
   * that use generic type parameters, this method may be omitted since
   * the TFileId type might not be an ObjectId.
   */
  openUploadStream(
    filename: string,
    options?: GridFSUploadOptions,
  ): WritableStream {
    return new WritableStream();
  }

  /**
   * Opens a Stream that the application can write the contents of the file to.
   * The application provides a custom file id.
   *
   * Returns a Stream to which the application will write the contents.
   */
  openUploadStreamWithId(
    id: FileId,
    filename: string,
    options?: GridFSUploadOptions,
  ): WritableStream {
    return new WritableStream();
  }

  /**
   * Uploads a user file to a GridFS bucket. The driver generates the file id.
   *
   * Reads the contents of the user file from the @source Stream and uploads it
   * as chunks in the chunks collection. After all the chunks have been uploaded,
   * it creates a files collection document for @filename in the files collection.
   *
   * Returns the id of the uploaded file.
   *
   * Note: this method is provided for backward compatibility. In languages
   * that use generic type parameters, this method may be omitted since
   * the TFileId type might not be an ObjectId.
   */
  uploadFromStream(
    filename: string,
    source: WritableStream,
    options?: GridFSUploadOptions,
  ): ObjectId {
    return ObjectId.generate();
  }

  /**
   * Uploads a user file to a GridFS bucket. The application supplies a custom file id.
   *
   * Reads the contents of the user file from the @source Stream and uploads it
   * as chunks in the chunks collection. After all the chunks have been uploaded,
   * it creates a files collection document for @filename in the files collection.
   *
   * Note: there is no need to return the id of the uploaded file because the application
   * already supplied it as a parameter.
   */
  uploadFromStreamWithId(
    id: FileId,
    filename: string,
    source: WritableStream,
    options: GridFSUploadOptions,
  ): void {
  }

  /** Opens a Stream from which the application can read the contents of the stored file
   * specified by @id.
   *
   * Returns a Stream.
   */
  openDownloadStream<Type>(id: FileId): ReadableStream<Type> {
    return new ReadableStream();
  }

  /**
   * Downloads the contents of the stored file specified by @id and writes
   * the contents to the @destination Stream.
   */
  downloadToStream(id: FileId, destination: ReadableStream): void {
  }

  /**
   * Given a @id, delete this stored file’s files collection document and
   * associated chunks from a GridFS bucket.
   */
  async delete(id: FileId) {
    await this.#fileCollection.deleteOne({ _id: id });
    const response = await this.#chunksCollection.deleteMany({ files_id: id });
    assert(response, `File not found for id ${id}`);
  }

  /**
   * Find and return the files collection documents that match @filter.
   */
  find(
    filter: Filter<File>,
    options?: GridFSFindOptions,
  ): FindCursor<File> {
    return this.#fileCollection.find(filter ?? {}, options ?? {});
  }
}
