import { Binary, ObjectId } from "../../deps.ts";
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
  id: ObjectId,
  options?: GridFSUploadOptions,
) {
  const chunkSizeBytesCombined = options?.chunkSizeBytes ?? chunkSizeBytes;
  const uploadBuffer = new Uint8Array(new ArrayBuffer(chunkSizeBytesCombined));
  let bufferPosition = 0;
  let chunksInserted = 0;
  let fileSizeBytes = 0;
  return new WritableStream<Uint8Array>({
    write: async (chunk: Uint8Array) => {
      const loop = async (chunk: Uint8Array) => {
        const int8 = new Uint8Array(chunk);
        const spaceRemaining = chunkSizeBytesCombined - bufferPosition;
        if (chunk.byteLength < spaceRemaining) {
          uploadBuffer.set(int8, bufferPosition);
          bufferPosition += chunk.byteLength;
          fileSizeBytes += chunk.byteLength;
          return;
        } else {
          const sliced = int8.slice(0, spaceRemaining);
          const remnant = int8.slice(spaceRemaining);
          uploadBuffer.set(sliced, bufferPosition);

          await chunksCollection.insertOne({
            files_id: id,
            n: chunksInserted,
            data: new Binary(uploadBuffer),
          });

          bufferPosition = 0;
          fileSizeBytes += sliced.byteLength;
          ++chunksInserted;
          await loop(remnant);
        }
      };
      await loop(chunk);
    },
    close: async () => {
      // Write the last bytes that are left in the buffer
      if (bufferPosition) {
        await chunksCollection.insertOne({
          files_id: id,
          n: chunksInserted,
          data: new Binary(uploadBuffer.slice(0, bufferPosition)),
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
