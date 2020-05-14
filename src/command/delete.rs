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

pub fn delete(command: Command) -> Op {
    let fut = async move {
        let client = command.get_client();
        let data = command.data;
        let args: DeleteArgs = serde_json::from_slice(data.unwrap().as_ref()).unwrap();
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let delete_one = args.delete_one;
        let query = util::json_to_document(args.query).expect("query canot be null");
        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let delete_result = if delete_one {
            collection.delete_one(query, None).unwrap()
        } else {
            collection.delete_many(query, None).unwrap()
        };
        util::async_result(&command.args, delete_result.deleted_count)
    };
    Op::Async(fut.boxed())
}
