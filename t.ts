import { MongoClient as MC } from "./mod.ts";
import { MongoClient as MC2 } from "https://cdn.jsdelivr.net/gh/erfanium/mongo_next/src/index.ts";

async function a() {
   const c = new MC("mongodb://localhost:27017/doki");
   await c.connect();
}



async function b() {
   const c = new MC2("mongodb://localhost:27017/doki");
   await c.connect();
}
