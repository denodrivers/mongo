use crate::*;
use bson::Bson;
use serde_json::Value;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DeleteArgs {
    db_name: String,
    collection_name: String,
    query: Value,
    delete_one: bool,
}

pub fn delete(command: Command) -> CoreOp {
    let fut = async move {
        let client = command.get_client();
        let data = command.data;
        let args: DeleteArgs = serde_json::from_slice(data.unwrap().as_ref()).unwrap();
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let delete_one = args.delete_one;
        let query = args.query;
        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let query_doc: Bson = query.into();
        if let Bson::Document(query_doc) = query_doc {
            let delete_result = match delete_one {
                true => collection.delete_one(query_doc, None).unwrap(),
                false => collection.delete_many(query_doc, None).unwrap(),
            };
            Ok(util::async_result(
                &command.args,
                delete_result.deleted_count,
            ))
        } else {
            Err(())
        }
    };
    CoreOp::Async(fut.boxed())
}
