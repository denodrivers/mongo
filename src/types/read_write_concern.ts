/**
 * @module @see https://github.com/mongodb/specifications/blob/master/source/read-write-concern/read-write-concern.rst#read-concern
 */

const enum ReadConcernLevel {
  local = "local",
  majority = "majority",
  linearizable = "linearizable",
  available = "available",
  snapshot = "snapshot",
}

/**
 * interface for ReadConcern documents used by MongoDB
 * @see https://docs.mongodb.com/manual/reference/read-concern/
 */
export interface ReadConcern {
  /**
   * The level of the read concern.
   */
  level?: ReadConcernLevel | String;
}

/**
 * interface for WriteConcern documents used by MongoDB
 *
 * @see https://docs.mongodb.com/manual/reference/write-concern/
 */
export interface WriteConcern {
  /**
   * The number of instances the write operation needs to be propagated to
   * before proceeding.
   *
   * The string based values are:
   *
   * - majority: The calculated majority of nodes in a cluster has accepted the
   *    the write
   * - custom write name: Writes have been acknowledged by nodes tagged with the
   *    custom write concern.
   */
  w: number | "majority" | string;
  /**
   * If true, the server only returns after the operation has been commited to
   * disk
   */
  j: boolean;
  /**
   * An optional timeout value after which to stop the write operation
   */
  wtimeout?: number;
}
