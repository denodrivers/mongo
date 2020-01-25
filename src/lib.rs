#[macro_use]
extern crate deno_core;
#[macro_use]
extern crate serde_json;
extern crate serde;

use deno_core::Buf;
use deno_core::CoreOp;
use deno_core::PinnedBuf;
use deno_core::PluginInitContext;
use futures::FutureExt;
use mongodb::Client;
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};

init_fn!(init);

static CLIENT: OnceCell<Client> = OnceCell::new();

#[derive(Serialize, Deserialize)]
struct MongoCommand {
    command_type: MongoCommandType,
    command_id: Option<usize>,
}

#[derive(Serialize)]
struct AsyncResult<T>
where
    T: Serialize,
{
    command_id: usize,
    data: T,
}

#[derive(Serialize, Deserialize)]
enum MongoCommandType {
    Connect,
    ConnectWithUri,
    ListDatabases,
}

fn init(context: &mut dyn PluginInitContext) {
    context.register_op("mongo_command", Box::new(op_command));
}

fn get_client() -> &'static Client {
    CLIENT.get().unwrap()
}

fn async_result<T>(command_id: usize, data: T) -> Buf
where
    T: Serialize,
{
    let result = AsyncResult { command_id, data };
    let json = json!(result);
    let mut data = serde_json::to_vec(&json).unwrap();
    data.resize((data.len() + 3) & !3, b' ');
    Buf::from(data)
}

fn op_command(data: &[u8], zero_copy: Option<PinnedBuf>) -> CoreOp {
    let command: MongoCommand = serde_json::from_slice(data).unwrap();
    match command.command_type {
        MongoCommandType::ConnectWithUri => command_connect_with_uri(zero_copy),
        MongoCommandType::ListDatabases => command_list_databases(command.command_id.unwrap()),
        _ => panic!("Unknow command"),
    }
}

fn command_connect_with_uri(data: Option<PinnedBuf>) -> CoreOp {
    let uri: Vec<u8> = data.unwrap().as_ref().to_vec();
    let uri = String::from_utf8(uri).unwrap();
    let client = mongodb::Client::with_uri_str(&uri).unwrap();
    CLIENT.set(client).unwrap();
    CoreOp::Sync(Buf::default())
}

fn command_list_databases(command_id: usize) -> CoreOp {
    let fut = async move {
        let names = get_client().list_database_names(None);
        let data = names.unwrap();
        Ok(async_result(command_id, data))
    };
    CoreOp::Async(fut.boxed())
}
