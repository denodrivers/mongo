import { Bson, MongoClient } from "./mod.ts";

const client = new MongoClient();
await client.connect(
  "mongodb://admin_chama_la:bscW5Fz8mQ3pLiKPKMP5lFx@localhost:27017/chama_la",
);

const db = client.database("chama_la").collection("users");

const all = await db.find();

console.log(await all.toArray());
