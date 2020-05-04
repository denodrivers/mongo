export async function cargoBuild() {
  const cargoCommand = Deno.run({
    cmd: ["cargo", "build", "--release", "--locked"],
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit",
  });
  await cargoCommand.status();
}
