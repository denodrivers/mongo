import { deferred } from "../../deps.ts";
import { assertEquals, describe, it } from "../test.deps.ts";

describe("worker", () => {
  it({
    name: "WORKER: Deno does not throw when deno_mongo is imported in worker",
    fn: async () => {
      const importWorker = new Worker(
        import.meta.resolve("./import_worker.ts"),
        { type: "module" },
      );
      const p = deferred<string>();
      importWorker.onmessage = (e) => p.resolve(e.data);
      importWorker.postMessage("startWorker");

      const result = await p;
      importWorker.terminate();
      assertEquals(result, "done");
    },
  });
});
