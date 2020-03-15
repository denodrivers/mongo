import { assert } from "https://deno.land/std@v0.35.0/testing/asserts.ts";

export enum CommandType {
  ConnectWithUri = "ConnectWithUri",
  ConnectWithOptions = "ConnectWithOptions",
  ListDatabases = "ListDatabases",
  ListCollectionNames = "ListCollectionNames",
  Find = "Find",
  InsertOne = "InsertOne",
  InsertMany = "InsertMany",
  Delete = "Delete",
  Update = "Update",
  Aggregate = "Aggregate",
  CreateIndexes = "CreateIndexes"
}

export interface ObjectId {
  $oid: string;
}
export function ObjectId($oid: string) {
  const isLegal = /[0-9a-fA-F]{24}/.test($oid);
  assert(isLegal, `ObjectId("${$oid}") is not legal.`);
  return { $oid };
}

export interface FindOptions {
  findOne?: boolean;
  skip?: number;
  limit?: number;
}
