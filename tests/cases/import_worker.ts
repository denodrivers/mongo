/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import {} from "../../mod.ts";

globalThis.onmessage = (_e) => {
  self.postMessage("done");
  self.close();
};
