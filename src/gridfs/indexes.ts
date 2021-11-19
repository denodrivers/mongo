import { Document } from "../types.ts";
import { Collection } from "../collection/collection.ts";
import { Chunk, File } from "../types/gridfs.ts";

export function createFileIndex(collection: Collection<File>) {
  const index = { filename: 1, uploadDate: 1 };

  return collection.createIndexes({
    indexes: [
      {
        name: "gridFSFiles",
        key: index,
        background: false,
      },
    ],
  });
}
export function createChunksIndex(collection: Collection<Chunk>) {
  // deno-lint-ignore camelcase
  const index = { files_id: 1, n: 1 };

  return collection.createIndexes({
    indexes: [
      {
        name: "gridFSFiles",
        key: index,
        unique: true,
        background: false,
      },
    ],
  });
}

export async function checkIndexes(
  filesCollection: Collection<File>,
  chunksCollection: Collection<Chunk>,
  hasCheckedIndexes: (value: boolean) => void,
) {
  const filesCollectionIsEmpty = !(await filesCollection.findOne(
    {},
    {
      projection: { _id: 1 },
    },
  ));

  const chunksCollectionIsEmpty = !(await chunksCollection.findOne(
    {},
    {
      projection: { _id: 1 },
    },
  ));

  if (filesCollectionIsEmpty || chunksCollectionIsEmpty) {
    // At least one collection is empty so we create indexes
    await createFileIndex(filesCollection);
    await createChunksIndex(chunksCollection);
    hasCheckedIndexes(true);
    return;
  }

  // Now check that the right indexes are there
  const fileIndexes = await filesCollection.listIndexes().toArray();
  let hasFileIndex = false;

  if (fileIndexes) {
    fileIndexes.forEach((index) => {
      const keys = Object.keys(index.key);
      if (
        keys.length === 2 &&
        index.key.filename === 1 &&
        index.key.uploadDate === 1
      ) {
        hasFileIndex = true;
      }
    });
  }

  if (!hasFileIndex) {
    await createFileIndex(filesCollection);
  }

  const chunkIndexes = await chunksCollection.listIndexes().toArray();
  let hasChunksIndex = false;

  if (chunkIndexes) {
    chunkIndexes.forEach((index: Document) => {
      const keys = Object.keys(index.key);
      if (
        keys.length === 2 &&
        index.key.filename === 1 &&
        index.key.uploadDate === 1 &&
        index.options.unique
      ) {
        hasChunksIndex = true;
      }
    });
  }

  if (!hasChunksIndex) {
    await createChunksIndex(chunksCollection);
  }
  hasCheckedIndexes(true);
}
