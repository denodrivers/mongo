use crate::*;
use bson::Document;
use mongodb::error::Result;
use serde_json::Value;
use util::maybe_json_to_document;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct FindArgs {
    db_name: String,
    collection_name: String,
    filter: Option<Value>,
    find_one: bool,
}

pub fn find(command: Command) -> CoreOp {
    let fut = async move {
        let client = command.get_client();
        let data = command.data;
        let args: FindArgs = serde_json::from_slice(data.unwrap().as_ref()).unwrap();
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let filter = maybe_json_to_document(args.filter);
        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        if args.find_one {
            let doc = collection.find_one(filter, None).unwrap();
            Ok(util::async_result(&command.args, doc))
        } else {
            let cursor = collection.find(filter, None).unwrap();
            let docs: Vec<Document> = cursor
                .filter_map(|doc: Result<Document>| match doc {
                    Ok(doc) => Some(doc),
                    _ => None,
                })
                .collect();
            Ok(util::async_result(&command.args, docs))
        }
    };
    CoreOp::Async(fut.boxed())
}
