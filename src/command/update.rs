use crate::*;
use serde_json::Value;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct UpdateArgs {
    db_name: String,
    collection_name: String,
    query: Value,
    update: Value,
    update_one: bool,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct UpdateResultArgs {
    pub matched_count: i64,
    pub modified_count: i64,
    pub upserted_id: Option<Value>,
}

pub fn update(command: Command) -> Op {
    let fut = async move {
        let client = command.get_client();
        let data = command.data;
        let args: UpdateArgs = serde_json::from_slice(data.unwrap().as_ref()).unwrap();
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let query_doc = util::json_to_document(args.query).expect("query canot be null");
        let update_doc = util::json_to_document(args.update).expect("update_doc canot be null");
        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let result = if args.update_one {
            collection.update_one(query_doc, update_doc, None).unwrap()
        } else {
            collection.update_many(query_doc, update_doc, None).unwrap()
        };

        util::async_result(
            &command.args,
            UpdateResultArgs {
                matched_count: result.matched_count,
                modified_count: result.modified_count,
                upserted_id: result.upserted_id.map(|id| id.into()),
            },
        )
    };
    Op::Async(fut.boxed())
}
