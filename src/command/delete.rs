use crate::*;
use serde_json::Value;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DeleteArgs {
    db_name: String,
    collection_name: String,
    query: Value,
    delete_one: bool,
}

pub fn delete(command: Command) -> util::AsyncJsonOp<i64> {
    let fut = async move {
        let client = command.get_client();
        let data = command.data.first();
        let args: DeleteArgs = serde_json::from_slice(
            data.ok_or("Missing arguments for delete".to_string())?
                .as_ref(),
        )
        .map_err(|e| e.to_string())?;
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let delete_one = args.delete_one;
        let query = util::json_to_document(args.query).ok_or("query can not be null")?;
        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let delete_result = if delete_one {
            collection
                .delete_one(query, None)
                .map_err(|e| e.to_string())?
        } else {
            collection
                .delete_many(query, None)
                .map_err(|e| e.to_string())?
        };
        Ok(delete_result.deleted_count)
    };
    fut.boxed()
}
