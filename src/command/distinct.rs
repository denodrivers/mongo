use crate::*;
use bson::Document;
use mongodb::error::Result;
use mongodb::options::DistinctOptions;
use serde_json::Value;
use util::maybe_json_to_document;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DistinctArgs {
    db_name: String,
    collection_name: String,
    filter: Option<Value>,
}

pub fn find(command: Command) -> util::AsyncJsonOp<Vec<Document>> {
    let fut = async move {
        let client = command.get_client();
        let data = command.data.first();
        let args: DistinctArgs =
            serde_json::from_slice(data.ok_or("Missing arguments for find")?.as_ref())
                .map_err(|e| e.to_string())?;
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let filter = maybe_json_to_document(args.filter);
        let skip = args.skip;
        let limit = args.limit;

        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let mut options: DistinctOptions = DistinctOptions::default();

        let cursor = collection
            .find(filter, Some(options))
            .map_err(|e| e.to_string())?;
        let docs: Vec<Document> = cursor
            .filter_map(|doc: Result<Document>| match doc {
                Ok(doc) => Some(doc),
                _ => None,
            })
            .collect();
        Ok(docs)
    };
    fut.boxed()
}
