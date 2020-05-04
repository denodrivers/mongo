use crate::*;
use serde_json::Value;
use util::maybe_json_to_document;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct CountArgs {
    db_name: String,
    collection_name: String,
    filter: Option<Value>,
}

pub fn count(command: Command) -> Op {
    let fut = async move {
        let client = command.get_client();
        let data = command.data;
        let args: CountArgs = serde_json::from_slice(data.unwrap().as_ref()).unwrap();
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let filter = maybe_json_to_document(args.filter);

        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let count = collection.count_documents(filter, None).unwrap();
        util::async_result(&command.args, count)
    };
    Op::Async(fut.boxed())
}
