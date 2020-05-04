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

pub fn find(command: Command) -> Op {
    let fut = async move {
        let client = command.get_client();
        let data = command.data;
        let args: FindArgs = serde_json::from_slice(data.unwrap().as_ref()).unwrap();
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let filter = maybe_json_to_document(args.filter);
        let skip = args.skip;
        let limit = args.limit;

        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        if args.find_one {
            let doc = collection.find_one(filter, None).unwrap();
            util::async_result(&command.args, doc)
        } else {
            let mut options: FindOptions = FindOptions::default();
            options.skip = skip;
            options.limit = limit;

            let cursor = collection.find(filter, Some(options)).unwrap();
            let docs: Vec<Document> = cursor
                .filter_map(|doc: Result<Document>| match doc {
                    Ok(doc) => Some(doc),
                    _ => None,
                })
                .collect();
            util::async_result(&command.args, docs)
        }
    };
    Op::Async(fut.boxed())
}
