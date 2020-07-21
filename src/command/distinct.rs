use crate::*;
use bson::Bson;
use mongodb::options::DistinctOptions;
use serde_json::Value;
use util::maybe_json_to_document;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DistinctArgs {
    db_name: String,
    collection_name: String,
    filter: Option<Value>,
    field_name: String,
}

pub fn distinct(command: Command) -> util::AsyncJsonOp<Vec<Bson>> {
    let fut = async move {
        let client = command.get_client();
        let data = command.data.first();
        let args: DistinctArgs =
            serde_json::from_slice(data.ok_or("Missing arguments for distinct")?.as_ref())
                .map_err(|e| e.to_string())?;
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let filter = maybe_json_to_document(args.filter);
        let field_name = args.field_name;

        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let options: DistinctOptions = DistinctOptions::default();

        let bson = collection
            .distinct(&field_name, filter, Some(options))
            .map_err(|e| e.to_string())?;

        Ok(bson)
    };
    fut.boxed()
}
