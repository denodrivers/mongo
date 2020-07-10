use crate::*;
use bson::Document;
use serde_json::Value;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct InsertManyArgs {
    db_name: String,
    collection_name: String,
    docs: Vec<Value>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct InsertOneArgs {
    db_name: String,
    collection_name: String,
    doc: Value,
}

pub fn insert_one(command: Command) -> util::AsyncJsonOp<bson::Bson> {
    let fut = async move {
        let client = command.get_client();
        let data = command.data.first();
        let args: InsertOneArgs =
            serde_json::from_slice(data.ok_or("Missing arguments for insertOne")?.as_ref())
                .map_err(|e| e.to_string())?;
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let doc = util::json_to_document(args.doc).ok_or("doc can not be null")?;
        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let insert_result = collection
            .insert_one(doc, None)
            .map_err(|e| e.to_string())?;
        Ok(insert_result.inserted_id)
    };
    fut.boxed()
}

pub fn insert_many(command: Command) -> util::AsyncJsonOp<Vec<bson::Bson>> {
    let fut = async move {
        let client = command.get_client();
        let data = command.data.first();
        let args: InsertManyArgs =
            serde_json::from_slice(data.ok_or("Missing arguments for insertMany")?.as_ref())
                .map_err(|e| e.to_string())?;
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let docs: Vec<Document> = util::jsons_to_documents(args.docs);

        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let insert_result = collection
            .insert_many(docs, None)
            .map_err(|e| e.to_string())?;
        let ids: Vec<bson::Bson> = insert_result
            .inserted_ids
            .iter()
            .map(|(_, id)| id.to_owned())
            .collect();

        Ok(ids)
    };
    fut.boxed()
}
