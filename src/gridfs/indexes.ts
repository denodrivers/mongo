import { Collection } from "../collection/collection.ts";
import { Chunk, File } from "../types/gridfs.ts";
import { IndexOptions } from "../types.ts";
import { Document } from "../../deps.ts";

async function ensureIndex<T extends Document>(
  index: IndexOptions,
  collection: Collection<T>,
): Promise<ReturnType<Collection<T>["createIndexes"]>> {
  // We need to check collection emptiness (ns not found error for listIndexes on empty collection)
  const doc = await collection.findOne({}, { projection: { _id: 1 } });
  if (doc === undefined) {
    return collection.createIndexes({ indexes: [index] });
  }
  const keys = Object.keys(index.key);
  const indexes = await collection.listIndexes().toArray();
  const existing = indexes.find(({ key }) => {
    const currentKeys = Object.keys(key);
    return currentKeys.length === keys.length &&
      currentKeys.every((k) => keys.includes(k));
  });
  if (existing === undefined) {
    return collection.createIndexes({ indexes: [index] });
  } else {
    return {
      ok: 1,
      createdCollectionAutomatically: false,
      numIndexesBefore: indexes.length,
      numIndexesAfter: indexes.length,
    };
  }
}

const fileIndexSpec = {
  name: "gridFSFiles",
  key: { filename: 1, uploadDate: 1 },
  background: false,
};
export function createFileIndex(collection: Collection<File>) {
  return ensureIndex<File>(fileIndexSpec, collection);
}

const chunkIndexSpec = {
  name: "gridFSFiles",
  key: { files_id: 1, n: 1 },
  unique: true,
  background: false,
};
export function createChunksIndex(collection: Collection<Chunk>) {
  return ensureIndex<Chunk>(chunkIndexSpec, collection);
}

export async function checkIndexes(
  filesCollection: Collection<File>,
  chunksCollection: Collection<Chunk>,
  hasCheckedIndexes: (value: boolean) => void,
) {
  await createFileIndex(filesCollection);
  await createChunksIndex(chunksCollection);
  hasCheckedIndexes(true);
}
