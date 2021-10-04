import {} from "../../mod.ts";

onmessage = (_e) => {
  self.postMessage("done");
  self.close();
};
