use crate::*;
use bson::{Bson, Document};
use serde_json::Value;

pub fn async_result<T>(args: &CommandArgs, data: T) -> Buf
where
    T: Serialize,
{
    let result = AsyncResult {
        command_id: args.command_id.unwrap(),
        data,
    };
    let json = json!(result);
    let data = serde_json::to_vec(&json).unwrap();
    Buf::from(data)
}

pub fn maybe_json_to_document(maybe_json: Option<Value>) -> Option<Document> {
    if let Some(val) = maybe_json {
        json_to_document(val)
    } else {
        None
    }
}

pub fn json_to_document(json: Value) -> Option<Document> {
    let bson: Bson = json.into();
    match bson {
        Bson::Document(doc) => Some(doc),
        _ => None,
    }
}

pub fn jsons_to_documents(jsons: Vec<Value>) -> Vec<Document> {
    jsons
        .iter()
        .filter_map(|json| json_to_document(json.to_owned()))
        .collect()
}
