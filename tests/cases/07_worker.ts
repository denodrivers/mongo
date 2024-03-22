import { assertEquals } from "assert";
import { describe, it } from "bdd";

describe("worker", () => {
  it({
    name: "WORKER: Deno does not throw when deno_mongo is imported in worker",
    fn: async () => {
      const importWorker = new Worker(
        import.meta.resolve("./import_worker.ts"),
        { type: "module" },
      );
      const p = Promise.withResolvers<string>();
      importWorker.onmessage = (e) => p.resolve(e.data);
      importWorker.postMessage("startWorker");

      const result = await p.promise;
      importWorker.terminate();
      assertEquals(result, "done");
    },
  });
});
