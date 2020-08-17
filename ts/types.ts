export enum CommandType {
  ConnectWithUri = "ConnectWithUri",
  ConnectWithOptions = "ConnectWithOptions",
  Close = "Close",
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
  Distinct = "Distinct",
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

export interface UpdateOptions {
  arrayFilters?: object[];
  bypassDocumentValidation?: boolean;
  upsert?: boolean;
}

export abstract class ChainBuilderPromise<T> {
  #promise?: Promise<T>;

  abstract _excutor(): Promise<T>;

  private getPromise(): Promise<T> {
    if (!this.#promise) {
      this.#promise = this._excutor();
    }
    return this.#promise;
  }

  public async then(
    callback?: ((value: T) => any | PromiseLike<T>) | undefined | null,
  ): Promise<T> {
    return this.getPromise().then(callback);
  }

  public async catch(
    callback?: ((value: T) => any | PromiseLike<T>) | undefined | null,
  ): Promise<T> {
    return this.getPromise().catch(callback);
  }

  public async finally(callback?: () => void): Promise<T> {
    return this.getPromise().finally(callback);
  }
}
