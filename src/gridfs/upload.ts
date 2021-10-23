import { Bson } from "../../deps.ts";
import { Collection } from "../../mod.ts";
import { Chunk, File, GridFSUploadOptions } from "../types/gridfs.ts";

export interface BucketInfo {
  filesCollection: Collection<File>;
  chunksCollection: Collection<Chunk>;
  chunkSizeBytes: number;
}

export function createUploadStream(
  { chunkSizeBytes, chunksCollection, filesCollection }: BucketInfo,
  filename: string,
  id: Bson.ObjectId,
  options?: GridFSUploadOptions,
) {
  const chunkSizeBytesCombined = options?.chunkSizeBytes ?? chunkSizeBytes;
  const uploadBuffer = new Uint8Array(new ArrayBuffer(chunkSizeBytesCombined));
  let bufferPosition = 0;
  let chunksInserted = 0;
  let fileSizeBytes = 0;
  return new WritableStream<Uint8Array>({
    write: async (chunk: Uint8Array) => {
      let remaining = chunk;
      while (remaining.byteLength) {
        const availableBuffer = chunkSizeBytesCombined - bufferPosition;
        if (remaining.byteLength < availableBuffer) {
          uploadBuffer.set(remaining, bufferPosition);
          bufferPosition += remaining.byteLength;
          fileSizeBytes += remaining.byteLength;
          break;
        }
        const sliced = remaining.slice(0, availableBuffer);
        remaining = remaining.slice(availableBuffer);
        uploadBuffer.set(sliced, bufferPosition);

        await chunksCollection.insertOne({
          files_id: id,
          n: chunksInserted,
          data: new Bson.Binary(uploadBuffer),
        });

        bufferPosition = 0;
        fileSizeBytes += sliced.byteLength;
        ++chunksInserted;
      }
    },
    close: async () => {
      // Write the last bytes that are left in the buffer
      if (bufferPosition) {
        await chunksCollection.insertOne({
          files_id: id,
          n: chunksInserted,
          data: new Bson.Binary(uploadBuffer.slice(0, bufferPosition)),
        });
      }

      await filesCollection.insertOne({
        _id: id,
        length: fileSizeBytes,
        chunkSize: chunkSizeBytesCombined,
        uploadDate: new Date(),
        filename: filename,
        metadata: options?.metadata,
      });
    },
  });
}
