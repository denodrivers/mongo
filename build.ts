import { existsSync } from "https://deno.land/std/fs/exists.ts";
import { resolve } from "https://deno.land/std/path/mod.ts";

export async function copyTargets() {
  await Deno.mkdir(".deno_plugins", { recursive: true });
  const targets = ["libdeno_mongo.dylib", "libdeno_mongo.so", "deno_mongo.dll"];
  for (const target of targets) {
    const targetPath = resolve("./target/release", target);
    const targetToPath = resolve(".deno_plugins", target);
    if (existsSync(targetPath)) {
      console.log(`Copy "${targetPath}" to "${targetToPath}"`);
      await Deno.copyFile(targetPath, targetToPath);
    }
  }
}
export async function cargoBuild() {
  const cargoCommand = Deno.run({
    args: ["cargo", "build", "--release", "--locked"],
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit"
  });
  await cargoCommand.status();
  await copyTargets();
}
