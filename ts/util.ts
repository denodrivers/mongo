import { prepare } from "../deps.ts";
import { CommandType } from "./types.ts";

// @ts-ignore
const DenoCore = Deno.core as {
  ops: () => { [key: string]: number };
  setAsyncHandler(rid: number, handler: Function): void;
  dispatch(
    rid: number,
    msg: any,
    ...buf: ArrayBufferView[]
  ): Uint8Array | undefined;
};

const PLUGIN_NAME = "deno_mongo";

let mongoPluginId: number;

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const pendingCommands: Map<
  number,
  { resolve: (data: unknown) => void; reject: (reason: any) => void }
> = new Map();

let nextCommandId = 0;

interface Command {
  command_type: CommandType;
  client_id?: number;
  command_id?: number;
}

export async function init(releaseUrl: string) {
  const options = {
    name: PLUGIN_NAME,
    urls: {
      darwin: `${releaseUrl}/lib${PLUGIN_NAME}.dylib`,
      windows: `${releaseUrl}/${PLUGIN_NAME}.dll`,
      linux: `${releaseUrl}/lib${PLUGIN_NAME}.so`,
    },
  };

  await prepare(options);

  mongoPluginId = DenoCore.ops()["mongo_command"];

  DenoCore.setAsyncHandler(mongoPluginId, (msg: Uint8Array) => {
    const { command_id, data, error } = JSON.parse(decoder.decode(msg));
    const command = pendingCommands.get(command_id);
    if (command) {
      if (error) command.reject(new Error(error));
      else command.resolve(data);
    }
  });
}

export function encode(str: string): Uint8Array {
  return encoder.encode(str);
}

export function decode(data: Uint8Array): string {
  return decoder.decode(data);
}

export function dispatch(
  command: Command,
  ...data: ArrayBufferView[]
): unknown {
  const control = encoder.encode(JSON.stringify(command));
  if (!mongoPluginId) {
    throw new Error("The plugin must be initialized before use");
  }
  const msg = DenoCore.dispatch(mongoPluginId, control, ...data)!;
  const { data: res, error } = JSON.parse(decoder.decode(msg));
  if (error) throw new Error(error);
  return res;
}

export function dispatchAsync(
  command: Command,
  ...data: ArrayBufferView[]
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const commandId = nextCommandId++;
    pendingCommands.set(commandId, { resolve, reject });
    const control = encoder.encode(
      JSON.stringify({
        ...command,
        command_id: commandId,
      }),
    );
    if (!mongoPluginId) {
      throw new Error("The plugin must be initialized before use");
    }
    DenoCore.dispatch(mongoPluginId, control, ...data);
  });
}
