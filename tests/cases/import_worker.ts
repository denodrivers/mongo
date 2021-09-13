import { } from "../../mod.ts";

onmessage = (_e) => {
    postMessage("done");
    close();
}