import { existsSync } from "https://deno.land/std/fs/exists.ts";
import { resolve } from "https://deno.land/std/path/mod.ts";

export async function copyTargets() {
  await Promise.all(
    ["libdeno_mongo.dylib", "libdeno_mongo.so", "deno_mongo.dll"].map(
      async target => {
        const targetPath = resolve("./target/release", target);
        const targetToPath = resolve("./target/release", target);
        if (existsSync(targetPath)) {
          console.log(`Copy "${targetPath}"`);
          await Deno.copyFile(targetPath, targetToPath);
        }
      }
    )
  );
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
