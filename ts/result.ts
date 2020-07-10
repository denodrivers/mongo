import { ObjectId } from "./types.ts";

export interface UpdateResult {
  matchedCount: number;
  modifiedCount: number;
  upsertedId: ObjectId | null;
}
