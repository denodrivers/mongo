export async function cargoBuild() {
  const cargoCommand = Deno.run({
    args: ["cargo", "build", "--release", "--locked"],
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit"
  });
  await cargoCommand.status();
}
