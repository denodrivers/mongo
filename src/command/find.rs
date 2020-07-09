use crate::*;
use bson::Document;
use mongodb::error::Result;
use mongodb::options::FindOptions;
use serde_json::Value;
use util::maybe_json_to_document;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct FindArgs {
    db_name: String,
    collection_name: String,
    filter: Option<Value>,
    find_one: bool,
    skip: Option<i64>,
    limit: Option<i64>,
}

pub fn find(command: Command) -> util::AsyncJsonOp<Vec<Document>> {
    let fut = async move {
        let client = command.get_client();
        let data = command.data.first();
        let args: FindArgs = serde_json::from_slice(
            data.ok_or("Arguments missing for find".to_string())?
                .as_ref(),
        )
        .map_err(|e| e.to_string())?;
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let filter = maybe_json_to_document(args.filter);
        let skip = args.skip;
        let limit = args.limit;

        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        if args.find_one {
            let doc = collection
                .find_one(filter, None)
                .map_err(|e| e.to_string())?;
            if let Some(doc) = doc {
                Ok(vec![doc])
            } else {
                Ok(vec![])
            }
        } else {
            let mut options: FindOptions = FindOptions::default();
            options.skip = skip;
            options.limit = limit;

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
        }
    };
    fut.boxed()
}
