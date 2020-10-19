use crate::*;
use bson::{Bson, Document};
use serde_json::Value;

pub type JsonResult<T> = Result<T, String>;
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SuccessResult {
    success: bool,
}

impl SuccessResult {
    pub fn new() -> SuccessResult {
        SuccessResult { success: true }
    }
}

pub fn sync_op<D, T>(d: D, command: Command) -> Op
where
    D: Fn(Command) -> JsonResult<T>,
    T: Serialize,
{
    let res = d(command);
    Op::Sync(match res {
        Ok(data) => sync_result(data),
        Err(error) => sync_error(error),
    })
}

pub fn sync_result<T>(data: T) -> Buf
where
    T: Serialize,
{
    let result = SyncResult {
        data: Some(data),
        error: None,
    };
    let json = json!(result);
    let data = serde_json::to_vec(&json).unwrap();
    Buf::from(data)
}

pub fn sync_error(error: String) -> Buf {
    let result = SyncResult::<usize> {
        data: None,
        error: Some(error),
    };
    let json = json!(result);
    let data = serde_json::to_vec(&json).unwrap();
    Buf::from(data)
}

pub type AsyncJsonOp<T> = Pin<Box<dyn Future<Output = JsonResult<T>>>>;

pub fn async_op<D, T>(d: D, command: Command) -> Op
where
    D: Fn(Command) -> AsyncJsonOp<T>,
    T: Serialize + 'static,
{
    let res = d(command.clone());
    let fut = res.then(move |res| {
        futures::future::ready(match res {
            Ok(data) => async_result(&command.args, data),
            Err(error) => async_error(&command.args, error),
        })
    });
    Op::Async(fut.boxed_local())
}

pub fn async_result<T>(args: &CommandArgs, data: T) -> Buf
where
    T: Serialize,
{
    let result = AsyncResult {
        command_id: args.command_id.unwrap(),
        data: Some(data),
        error: None,
    };
    let json = json!(result);
    let data = serde_json::to_vec(&json).unwrap();
    Buf::from(data)
}

pub fn async_error(args: &CommandArgs, error: String) -> Buf {
    let result = AsyncResult::<usize> {
        command_id: args.command_id.unwrap(),
        data: None,
        error: Some(error),
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
