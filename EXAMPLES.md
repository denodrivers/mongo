# Examples

## client.database

Selects the database, if it does not exist, it creates it.

```ts
import {
  MongoClient,
} from "https://deno.land/x/mongo@v0.12.1/mod.ts";

const client = new MongoClient();
client.connectWithUri("mongodb://localhost:27017");

try {
  //select database
  const db = client.database("test");
} catch (e) {
  console.error(e);
}
``` 
## db.collection

Selects the collection, if it does not exist, it creates it.
When working with TypeScript the Schema of the collection documents must be defined.

```ts 
import {
  MongoClient,
  ObjectId,
} from "https://deno.land/x/mongo@v0.12.1/mod.ts";

const client = new MongoClient();
client.connectWithUri("mongodb://localhost:27017");

// Defining schema interface
interface UserSchema {
  _id: { $oid: string }; // mongo id
  username: string;
  password: string;
}

try {
  //select database
  const db = client.database("test");
  const users = db.collection<UserSchema>("users");
} catch (e) {
  console.error(e);
}
``` 

## insertOne

You can insert one document in a collection using the `insertOne` function. You can explicitily set the `_id` or else let Mongo do it for you.

```ts
import {
  MongoClient,
  ObjectId,
} from "https://deno.land/x/mongo@v0.12.1/mod.ts";

const client = new MongoClient();
client.connectWithUri("mongodb://localhost:27017");

// Defining schema interface
interface UserSchema {
  _id: { $oid: string };
  username: string;
  password: string;
}

try {
  //select database
  const db = client.database("test");
  const users = db.collection<UserSchema>("users");

  // insert user with mongo generated id
  const insertUser1 = await users.insertOne({
    username: "user1",
    password: "pass1",
  });

  console.log(insertUser1); // returns objectid: { "$oid": "5f85b594006a29e100dw9054" }

  // insert user with explicit id - if already in the collection throws a "duplicate key" exception
  const id = ObjectId("5f85b594006a29e1009d9054");
  const insertUser2 = await users.insertOne({
    username: "user2",
    password: "pass2",
    _id: id,
  });

  console.log(insertUser2); // returns objectid: { "$oid": "5f85b594006a29e1009d9054" }
} catch (e) {
  console.error(e);
}

```

`insertOne` returns the ObjectId of the inserted document.

## insertMany

You can insert an array of documents in a collection using the `insertMany` function. As for `insertOne` you can explicitily set the `_id` or else let Mongo do it for you.

```ts
import {
  MongoClient,
  ObjectId,
} from "https://deno.land/x/mongo@v0.12.1/mod.ts";

const client = new MongoClient();
client.connectWithUri("mongodb://localhost:27017");

// Defining schema interface
interface UserSchema {
  _id: { $oid: string };
  username: string;
  password: string;
}

try {
  //select database
  const db = client.database("test");
  const users = db.collection<UserSchema>("users");

  const insertMany = await users.insertMany([
    {
      username: "user2",
      password: "pass2",
    },
    {
      username: "user3",
      password: "pass3",
    },
  ]);

  console.log(insertMany); // returns array of objectid: [ { "$oid": "5f85b8bf0028a70d009d905e" }, { "$oid": "5f85b8bf005a3f1e009d905d" } ]
} catch (e) {
  console.error(e);
}
``` 

`insertMany` returns an array with the ObjectIds of the inserted documents.

## findOne

This functions returns first document maching the criteria. If non, it returns `null`

```ts 
import {
  MongoClient,
} from "https://deno.land/x/mongo@v0.12.1/mod.ts";

const client = new MongoClient();
client.connectWithUri("mongodb://localhost:27017");

// Defining schema interface
interface UserSchema {
  _id: { $oid: string };
  username: string;
  password: string;
}

try {
  //select database
  const db = client.database("test");
  const users = db.collection<UserSchema>("users");

  // insert user with mongo generated id
  const insertUser1 = await users.insertOne({
    username: "user1",
    password: "pass1",
  });

  // return first document matching the criteria
  const foundUser = await users.findOne({ username: "user1" });
  if (foundUser) {
    console.log(foundUser); // returns full document (if found) { _id: { "$oid": "5f85b594006a29e1009d9053" }, username: "user1", password: "pass1" }
  }


  const notFoundUser = await users.findOne({ username: "user5" });
  console.log(notFoundUser); // null

} catch (e) {
  console.error(e);
}
```

## Find 

`find` returns an array of all occurrences matching the criteria, if none found it returns an empty array.

```ts
import {
  MongoClient,
  ObjectId,
} from "https://deno.land/x/mongo@v0.12.1/mod.ts";

const client = new MongoClient();
client.connectWithUri("mongodb://localhost:27017");

// Defining schema interface
interface UserSchema {
  _id: { $oid: string };
  username: string;
  password: string;
}

try {
  //select database
  const db = client.database("test");
  const users = db.collection<UserSchema>("users");

  const insertMany = await users.insertMany([
    {
      username: "user2",
      password: "pass2",
    },
    {
      username: "user3",
      password: "pass3",
    },
  ]);


  const manyFound = await users.find({ username: { $regex: ".*user.*" } });
  if (manyFound.length > 0) {
    console.log(manyFound);
    /*
    [
        {
          _id: { "$oid": "5f85d57f00021301007ad9f9" },
          username: "user2",
          password: "pass2"
        },
        {
          _id: { "$oid": "5f85d57f00fd63ee007ad9fa" },
          username: "user3",
          password: "pass3"
        }
    ]
    */

  } else {
    console.log("No result matching your criteria");
  }
} catch (e) {
  console.error(e);
}
``` 