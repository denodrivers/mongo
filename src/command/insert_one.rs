use crate::*;
use bson::Bson;
use serde_json::Value;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct InsertOnetArgs {
    db_name: String,
    collection_name: String,
    doc: Value,
}

pub fn insert_one(command: Command) -> CoreOp {
    let fut = async move {
        let client = command.get_client();
        let data = command.data;
        let args: InsertOnetArgs = serde_json::from_slice(data.unwrap().as_ref()).unwrap();
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let doc = args.doc;
        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let insert_doc: Bson = doc.into();
        if let Bson::Document(insert_doc) = insert_doc {
            let insert_result = collection.insert_one(insert_doc, None).unwrap();
            Ok(util::async_result(&command.args, insert_result.inserted_id))
        } else {
            Err(())
        }
    };
    CoreOp::Async(fut.boxed())
}
