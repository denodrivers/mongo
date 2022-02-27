/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import {} from "../../mod.ts";

onmessage = (_e) => {
  self.postMessage("done");
  self.close();
};
