import { assertEquals, deferred } from "../test.deps.ts";

export default function workerTests() {
  Deno.test({
    name: "WORKER: Deno does not throw when deno_mongo is imported in worker",
    fn: async () => {
      const importWorker = new Worker(
        new URL("import_worker.ts", import.meta.url).href,
        { type: "module" },
      );
      const p = deferred<string>();
      importWorker.onmessage = (e) => p.resolve(e.data);
      importWorker.postMessage("startWorker");
      assertEquals(await p, "done");
    },
  });
}
