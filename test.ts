import { MongoClient } from "./src/client.ts";

const client = new MongoClient();
await client.connect({ hostname: "127.0.0.1", port: 27017 });
