const Mongo = Deno.openPlugin("./target/debug/libdeno_mongo.dylib");

const dispatcher = Mongo.ops["mongo_command"];
const decoder = new TextDecoder();
const encoder = new TextEncoder();
const pendingCommands: Map<number, (data: unknown) => void> = new Map();

let nextCommandId = 0;

enum Command {
  ConnectWithUri = "ConnectWithUri",
  ListDatabases = "ListDatabases"
}

dispatcher.setAsyncHandler((msg: Uint8Array) => {
  const { command_id, data } = JSON.parse(decoder.decode(msg));
  const resolver = pendingCommands.get(command_id);
  resolver(data);
});

function dispatch(command: Command, data?: ArrayBufferView): Uint8Array {
  const control = encoder.encode(
    JSON.stringify({
      command_type: command
    })
  );
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
        command_type: command,
        command_id: commandId
      })
    );
    dispatcher.dispatch(control, data);
  });
}

export class MongoClient {
  connectWithUri(uri: string) {
    dispatch(Command.ConnectWithUri, encoder.encode(uri));
  }

  async listDatabases(): Promise<string[]> {
    return (await dispatchAsync(Command.ListDatabases)) as string[];
  }
}
