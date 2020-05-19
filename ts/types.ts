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
  Count = "Count",
  CreateIndexes = "CreateIndexes",
}

export interface ObjectId {
  $oid: string;
}
export function ObjectId($oid: string) {
  const isLegal = /^[0-9a-fA-F]{24}$/.test($oid);
  if (!isLegal) {
    throw new Error(`ObjectId("${$oid}") is not legal.`);
  }
  return { $oid };
}

export interface FindOptions {
  findOne?: boolean;
  skip?: number;
  limit?: number;
}
