import { Bson } from "../../../deps.ts";
import { Document, UpdateOptions } from "../../types.ts";
import { WireProtocol } from "../../protocol/mod.ts";
import { MongoInvalidArgumentError } from "../../error.ts";

interface UpdateResponse {
  ok: number;
  nModified: number;
  n: number;
  upserted?: {
    index: number;
    _id: Bson.ObjectId;
  }[];
}

export function hasAtomicOperators(doc: Bson.Document | Bson.Document[]) {
  if (Array.isArray(doc)) {
    for (const document of doc) {
      if (hasAtomicOperators(document)) {
        return true;
      }
    }
    return false;
  }
  const keys = Object.keys(doc);
  return keys.length > 0 && keys[0][0] === "$";
}

export async function update(
  protocol: WireProtocol,
  dbName: string,
  collectionName: string,
  query: Document,
  update: Document,
  options?: UpdateOptions,
) {
  if (!hasAtomicOperators(update)) {
    throw new MongoInvalidArgumentError(
      "Update document requires atomic operators",
    );
  }

  const { n, nModified, upserted } = await protocol.commandSingle<
    UpdateResponse
  >(dbName, {
    update: collectionName,
    updates: [
      {
        q: query,
        u: update,
        upsert: options?.upsert ?? false,
        multi: options?.multi ?? true,
        collation: options?.collation,
        arrayFilters: options?.arrayFilters,
        hint: options?.hint,
      },
    ],
    writeConcern: options?.writeConcern,
    ordered: options?.ordered ?? true,
    bypassDocumentValidation: options?.bypassDocumentValidation,
    comment: options?.comment,
  });

  return {
    upsertedIds: upserted?.map((id) => id._id),
    upsertedCount: upserted?.length ?? 0,
    modifiedCount: nModified,
    matchedCount: n,
  };
}
