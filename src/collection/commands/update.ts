import { Document, ObjectId } from "web-bson";
import { WireProtocol } from "../../protocol/mod.ts";
import { UpdateOptions } from "../../types.ts";

interface UpdateResponse {
  ok: number;
  nModified: number;
  n: number;
  upserted?: {
    index: number;
    _id: ObjectId;
  }[];
}

export async function update(
  protocol: WireProtocol,
  dbName: string,
  collectionName: string,
  query: Document,
  doc: Document,
  options?: UpdateOptions,
) {
  const { n, nModified, upserted } = await protocol.commandSingle<
    UpdateResponse
  >(dbName, {
    update: collectionName,
    updates: [
      {
        q: query,
        u: doc,
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
