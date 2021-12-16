import { assert } from "../test.deps.ts";

export default function workerTests() {
  Deno.test({
    name: "WORKER: Deno does not throw when deno_mongo is imported in worker",
    fn: async () => {
      const importWorker = new Worker(
        new URL("import_worker.ts", import.meta.url).href,
        { type: "module" },
      );

      importWorker.postMessage("startWorker");
      await new Promise<void>((done) => {
        importWorker.onmessage = (_e) => {
          assert(true);
          done();
        };
      });
    },
  });
}
