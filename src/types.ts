export type Document = any;

export interface ConnectOptions {
  servers: {
    host: string;
    port: number;
  }[];
  dbName?: string;
  [key: string]: any;
}

export interface FindOptions {
  findOne?: boolean;
  skip?: number;
  limit?: number;
}

export interface ListDatabaseInfo {
  name: string;
  sizeOnDisk?: number;
  empty?: false;
}
