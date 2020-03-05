import { prepare } from "https://raw.githubusercontent.com/manyuanrong/deno-plugin-prepare/master/mod.ts";
import { VERSION } from "../mod.ts";
import { CommandType } from "./types.ts";

const PLUGIN_NAME = "deno_mongo";

let dispatcher: Deno.PluginOp | null = null;

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const pendingCommands: Map<number, (data: unknown) => void> = new Map();

let nextCommandId = 0;

interface Command {
  command_type: CommandType;
  client_id?: number;
  command_id?: number;
}

export async function init(binVer: string = VERSION) {
  let releaseUrl = `https://github.com/manyuanrong/deno_mongo/releases/download/${binVer}`;

  const options = {
    name: PLUGIN_NAME,
    urls: {
      mac: `${releaseUrl}/lib${PLUGIN_NAME}.dylib`,
      win: `${releaseUrl}/${PLUGIN_NAME}.dll`,
      linux: `${releaseUrl}/lib${PLUGIN_NAME}.so`
    }
  };

  const Mongo = await prepare(options);
  dispatcher = Mongo.ops["mongo_command"];
  dispatcher.setAsyncHandler((msg: Uint8Array) => {
    const { command_id, data } = JSON.parse(decoder.decode(msg));
    const resolver = pendingCommands.get(command_id);
    resolver && resolver(data);
  });
}

export function encode(str: string): Uint8Array {
  return encoder.encode(str);
}

export function decode(data: Uint8Array): string {
  return decoder.decode(data);
}

export function dispatch(command: Command, data?: ArrayBufferView): Uint8Array {
  const control = encoder.encode(JSON.stringify(command));
  if (!dispatcher) {
    throw new Error("The plugin must be initialized before use");
  }
  return dispatcher.dispatch(control, data)!;
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
    if (!dispatcher) {
      if (!dispatcher) {
        throw new Error("The plugin must be initialized before use");
      }
    }
    dispatcher.dispatch(control, data);
  });
}
