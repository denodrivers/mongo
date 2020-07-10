use crate::*;
use serde_json::Value;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct UpdateArgs {
    db_name: String,
    collection_name: String,
    query: Value,
    update: Value,
    update_one: bool,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateResultArgs {
    pub matched_count: i64,
    pub modified_count: i64,
    pub upserted_id: Option<Value>,
}

pub fn update(command: Command) -> util::AsyncJsonOp<UpdateResultArgs> {
    let fut = async move {
        let client = command.get_client();
        let data = command.data.first();
        let args: UpdateArgs =
            serde_json::from_slice(data.ok_or("Missing arguments for update")?.as_ref())
                .map_err(|e| e.to_string())?;
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let query_doc = util::json_to_document(args.query).ok_or("query can not be null")?;
        let update_doc = util::json_to_document(args.update).ok_or("update_doc can not be null")?;
        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let result = if args.update_one {
            collection
                .update_one(query_doc, update_doc, None)
                .map_err(|e| e.to_string())?
        } else {
            collection
                .update_many(query_doc, update_doc, None)
                .map_err(|e| e.to_string())?
        };

        Ok(UpdateResultArgs {
            matched_count: result.matched_count,
            modified_count: result.modified_count,
            upserted_id: result.upserted_id.map(|id| id.into()),
        })
    };
    fut.boxed()
}
