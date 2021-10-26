import { assert, Bson } from "../../deps.ts";
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
import { checkIndexes } from "./indexes.ts";
import { createUploadStream } from "./upload.ts";

export class GridFSBucket {
  #chunksCollection: Collection<Chunk>;
  #filesCollection: Collection<File>;
  #chunkSizeBytes: number;
  #checkedIndexes = false;

  private readonly getBucketData = () => ({
    filesCollection: this.#filesCollection,
    chunksCollection: this.#chunksCollection,
    chunkSizeBytes: this.#chunkSizeBytes,
  });

  /**
   * Create a new GridFSBucket object on @db with the given @options.
   */
  constructor(
    db: Database,
    options: GridFSBucketOptions = {},
  ) {
    const newLocal = options.bucketName ?? "fs";
    this.#chunksCollection = db.collection(`${newLocal}.chunks`);
    this.#filesCollection = db.collection(`${newLocal}.files`);
    this.#chunkSizeBytes = options.chunkSizeBytes ?? 255 * 1024;
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
  ) {
    return this.openUploadStreamWithId(
      new Bson.ObjectId(),
      filename,
      options,
    );
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
  ) {
    if (!this.#checkedIndexes) this.#checkIndexes();
    return createUploadStream(this.getBucketData(), filename, id, options);
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
    source: ReadableStream,
    options?: GridFSUploadOptions,
  ): ObjectId {
    const objectid = new ObjectId();
    source.pipeTo(this.openUploadStreamWithId(objectid, filename, options));
    return objectid;
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
    source: ReadableStream,
    options: GridFSUploadOptions,
  ): void {
    source.pipeTo(this.openUploadStreamWithId(id, filename, options));
  }

  /** Opens a Stream from which the application can read the contents of the stored file
   * specified by @id.
   *
   * Returns a Stream.
   */
  openDownloadStream(id: FileId) {
    if (!this.#checkedIndexes) this.#checkIndexes();

    return new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const collection = this.#chunksCollection.find({ files_id: id });
        await collection.forEach((value) =>
          controller.enqueue(value?.data.buffer)
        );
        controller.close();
      },
    });
  }

  /**
   * Downloads the contents of the stored file specified by @id and writes
   * the contents to the @destination Stream.
   */
  async downloadToStream(
    id: FileId,
    destination: WritableStream<Uint8Array>,
  ) {
    this.openDownloadStream(id).pipeTo(destination);
  }

  /**
   * Given a @id, delete this stored file’s files collection document and
   * associated chunks from a GridFS bucket.
   */
  async delete(id: FileId) {
    await this.#filesCollection.deleteOne({ _id: id });
    const response = await this.#chunksCollection.deleteMany({ files_id: id });
    assert(response, `File not found for id ${id}`);
  }

  /**
   * Find and return the files collection documents that match @filter.
   */
  find(
    filter: Filter<File>,
    options: GridFSFindOptions = {},
  ): FindCursor<File> {
    return this.#filesCollection.find(filter ?? {}, options);
  }

  /**
   * Drops the files and chunks collections associated with
   * this bucket.
   */
  async drop() {
    await this.#filesCollection.drop();
    await this.#chunksCollection.drop();
  }

  #checkIndexes = () =>
    checkIndexes(
      this.#filesCollection,
      this.#chunksCollection,
      (value) => this.#checkedIndexes = value,
    );
}
