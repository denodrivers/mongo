const Mongo = Deno.openPlugin("./target/debug/libdeno_mongo.dylib");

const dispatcher = Mongo.ops["mongo_command"];
const decoder = new TextDecoder();
const encoder = new TextEncoder();
const pendingCommands: Map<number, (data: unknown) => void> = new Map();

let nextCommandId = 0;

enum CommandType {
  ConnectWithUri = "ConnectWithUri",
  ConnectWithOptions = "ConnectWithOptions",
  ListDatabases = "ListDatabases"
}

interface Command {
  command_type: CommandType;
  client_id?: number;
  command_id?: number;
}

dispatcher.setAsyncHandler((msg: Uint8Array) => {
  const { command_id, data } = JSON.parse(decoder.decode(msg));
  const resolver = pendingCommands.get(command_id);
  resolver(data);
});

function dispatch(command: Command, data?: ArrayBufferView): Uint8Array {
  const control = encoder.encode(JSON.stringify(command));
  return dispatcher.dispatch(control, data);
}

function dispatchAsync(
  command: Command,
  data?: ArrayBufferView
): Promise<unknown> {
  return new Promise(resolve => {
    const commandId = nextCommandId++;
    pendingCommands.set(commandId, resolve);
    const control = encoder.encode(
      JSON.stringify({
        ...command,
        command_id: commandId
      })
    );
    dispatcher.dispatch(control, data);
  });
}

export interface ClientOptions {
  /**
   * The initial list of seeds that the Client should connect to.
   * Note that by default, the driver will autodiscover other nodes in the cluster.
   * To connect directly to a single server (rather than autodiscovering the rest of the cluster),
   * set the direct field to `true.
   */
  hosts: string[];

  /**
   * The application name that the Client will send to the server as part of the handshake.
   * This can be used in combination with the server logs to determine which Client is connected to a server.
   */
  appName?: string;

  /**
   * The connect timeout passed to each underlying TcpStream when attemtping to connect to the server.
   * The default value is 10 seconds.
   */
  connectTimeout?: number;

  /**
   * The username to authenticate with. This applies to all mechanisms but may be omitted when authenticating via MONGODB-X509.
   */
  username?: string;

  /**
   * The password to authenticate with. This does not apply to all mechanisms.
   */
  password?: string;

  /**
   * Specifies whether the Client should directly connect to a single host rather than autodiscover all servers in the cluster.
   * The default value is false.
   */
  directConnection?: boolean;

  /**
   * The amount of time each monitoring thread should wait between sending an isMaster command to its respective server.
   * The default value is 10 seconds.
   */
  heartbeatFreq?: number;

  /**
   * The amount of time that a connection can remain idle in a connection pool before being closed.
   * A value of zero indicates that connections should not be closed due to being idle.
   * By default, connections will not be closed due to being idle.
   */
  maxIdleTime?: number;

  /**
   * The maximum amount of connections that the Client should allow to be created in a connection pool for a given server.
   * If an operation is attempted on a server while max_pool_size connections are checked out,
   * the operation will block until an in-progress operation finishes and its connection is checked back into the pool.The default value is 100.
   */
  maxPoolSize?: number;

  /**
   * The minimum number of connections that should be available in a server's connection pool at a given time.
   * If fewer than min_pool_size connections are in the pool,
   * connections will be added to the pool in the background until min_pool_size is reached.
   * The default value is 0.
   */
  minPoolSize?: number;

  /**
   * The name of the replica set that the Client should connect to.
   */
  replSetName?: string;

  /**
   * The amount of time the Client should attempt to select a server for an operation before timing outs The default value is 30 seconds.
   */
  serverSelectionTimeout?: number;

  /**
   * The amount of time a thread should block while waiting to check out a connection before returning an error.
   * Note that if there are fewer than max_pool_size connections checked out or if a connection is available in the pool,
   * checking out a connection will not block.
   * By default, threads will wait indefinitely for a connection to become available.
   */
  waitQueueTimeout?: number;
}

export class MongoClient {
  private clientId: number;

  connectWithUri(uri: string) {
    const data = dispatch(
      { command_type: CommandType.ConnectWithUri },
      encoder.encode(uri)
    );
    this.clientId = parseInt(decoder.decode(data));
  }

  connectWithOptions(options: ClientOptions) {
    const data = dispatch(
      { command_type: CommandType.ConnectWithOptions },
      encoder.encode(JSON.stringify(options))
    );
    this.clientId = parseInt(decoder.decode(data));
  }

  async listDatabases(): Promise<string[]> {
    return (await dispatchAsync({
      command_type: CommandType.ListDatabases,
      client_id: this.clientId
    })) as string[];
  }
}
