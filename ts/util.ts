import { CommandType } from "./types.ts";

const Mongo = Deno.openPlugin("./target/debug/libdeno_mongo.dylib");

const dispatcher = Mongo.ops["mongo_command"];
const decoder = new TextDecoder();
const encoder = new TextEncoder();
const pendingCommands: Map<number, (data: unknown) => void> = new Map();

let nextCommandId = 0;

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

export function encode(str: string): Uint8Array {
  return encoder.encode(str);
}

export function decode(data: Uint8Array): string {
  return decoder.decode(data);
}

export function dispatch(command: Command, data?: ArrayBufferView): Uint8Array {
  const control = encoder.encode(JSON.stringify(command));
  return dispatcher.dispatch(control, data);
}

export function dispatchAsync(
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
