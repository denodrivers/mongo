use crate::*;
use mongodb::options::IndexModel;
use serde_json::Value;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct CreateIndexesArgs {
    db_name: String,
    collection_name: String,
    models: Vec<IndexModelArgs>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct IndexModelArgs {
    keys: Value,
    options: Option<Value>,
}

impl IndexModelArgs {
    fn part(self) -> (Value, Option<Value>) {
        (self.keys, self.options)
    }
}

pub fn create_indexes(command: Command) -> util::AsyncJsonOp<Vec<String>> {
    let fut = async move {
        let client = command.get_client();
        let data = command.data.first();
        let args: CreateIndexesArgs =
            serde_json::from_slice(data.ok_or("Missing arguments for createIndex")?.as_ref())
                .map_err(|e| e.to_string())?;
        let db_name = args.db_name;
        let collection_name = args.collection_name;
        let models = args.models;
        let models: Vec<IndexModel> = models
            .into_iter()
            .map(|model| {
                let (keys, options) = model.part();
                IndexModel {
                    keys: util::json_to_document(keys).unwrap(),
                    options: util::maybe_json_to_document(options),
                }
            })
            .collect();

        println!("{:?}", models);

        let database = client.database(&db_name);
        let collection = database.collection(&collection_name);

        let result = collection.create_indexes(models).map_err(|e| e.to_string())?;
        Ok(result)
    };
    fut.boxed()
}
