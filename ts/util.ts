import { prepare, PerpareOptions } from "../deps.ts";
import { RELEASE_URL } from "../mod.ts";
import { CommandType } from "./types.ts";

const PLUGIN_NAME = "deno_mongo";

let dispatcher: any | null = null;

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const pendingCommands: Map<number, (data: unknown) => void> = new Map();

let nextCommandId = 0;

interface Command {
  command_type: CommandType;
  client_id?: number;
  command_id?: number;
}

export async function init(releaseUrl = RELEASE_URL) {
  const options: PerpareOptions = {
    name: PLUGIN_NAME,
    urls: {
      darwin: `${releaseUrl}/lib${PLUGIN_NAME}.dylib`,
      windows: `${releaseUrl}/${PLUGIN_NAME}.dll`,
      linux: `${releaseUrl}/lib${PLUGIN_NAME}.so`,
    },
  };

  await prepare(options);
  //@ts-ignore
  dispatcher = Deno.core.ops()["mongo_command"];
  //@ts-ignore
  Deno.core.setAsyncHandler(dispatcher, (msg: Uint8Array) => {
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
  //@ts-ignore
  return Deno.core.dispatch(dispatcher, control, data)!;
}

export function dispatchAsync(
  command: Command,
  data?: ArrayBufferView,
): Promise<unknown> {
  return new Promise((resolve) => {
    const commandId = nextCommandId++;
    pendingCommands.set(commandId, resolve);
    const control = encoder.encode(
      JSON.stringify({
        ...command,
        command_id: commandId,
      }),
    );
    if (!dispatcher) {
      if (!dispatcher) {
        throw new Error("The plugin must be initialized before use");
      }
    }
    //@ts-ignore
    Deno.core.dispatch(dispatcher, control, data);
  });
}
