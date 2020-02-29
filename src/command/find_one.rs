use crate::*;
use bson::{Bson, Document};
use serde_json::Value;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct FindOnetArgs {
    db_name: String,
    collection_name: String,
    filter: Value,
}

pub fn find_one(command: Command) -> CoreOp {
    let fut = async move {
        let client = command.get_client();
        let data = command.data;
        let args: FindOnetArgs = serde_json::from_slice(data.unwrap().as_ref()).unwrap();
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let filter = args.filter;
        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let filter_doc: Bson = filter.into();
        let filter_doc = match filter_doc {
            Bson::Document(doc) => Some(doc),
            _ => None,
        };

        let doc = collection.find_one(filter_doc, None).unwrap();
        Ok(util::async_result(&command.args, doc))
    };
    CoreOp::Async(fut.boxed())
}
