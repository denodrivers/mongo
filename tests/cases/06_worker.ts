import { assert } from "../test.deps.ts";

export default function workerTests() {
  Deno.test({
    name: "WORKER: Deno does not throw when deno_mongo is imported in worker",
    fn: async function () {
      let workerFinished: (p: void | PromiseLike<void>) => void;

      const p = new Promise<void>((resolve, _reject) => {
        workerFinished = resolve;
      });

      const importWorker = new Worker(
        new URL("import_worker.ts", import.meta.url).href,
        { type: "module" },
      );

      importWorker.onmessage = (_e) => {
        workerFinished();
      };

      importWorker.postMessage("startWorker");

      await p;

      assert(true);
    },
  });
}
