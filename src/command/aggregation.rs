use crate::util::jsons_to_documents;
use crate::*;
use bson::Document;
use mongodb::error::Result;
use serde_json::Value;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct AggregationArgs {
    db_name: String,
    collection_name: String,
    pipeline: Vec<Value>,
}

pub fn aggregate(command: Command) -> Op {
    let fut = async move {
        let client = command.get_client();
        let data = command.data;
        let args: AggregationArgs = serde_json::from_slice(data.unwrap().as_ref()).unwrap();
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let pipeline = jsons_to_documents(args.pipeline);

        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let cursor = collection.aggregate(pipeline, None).unwrap();
        let docs: Vec<Document> = cursor
            .filter_map(|doc: Result<Document>| match doc {
                Ok(doc) => Some(doc),
                _ => None,
            })
            .collect();
        util::async_result(&command.args, docs)
    };
    Op::Async(fut.boxed())
}
