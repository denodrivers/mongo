#[macro_use]
extern crate deno_core;
#[macro_use]
extern crate lazy_static;
#[macro_use]
extern crate serde_json;
extern crate mongodb;
extern crate serde;

use deno_core::Buf;
use deno_core::CoreOp;
use deno_core::PinnedBuf;
use deno_core::PluginInitContext;
use futures::FutureExt;
use mongodb::Client;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicUsize, Ordering};

use std::{collections::HashMap, sync::Mutex, sync::MutexGuard};

mod command;
mod util;

lazy_static! {
    static ref CLIENTS: Mutex<HashMap<usize, Client>> = Mutex::new(HashMap::new());
    static ref NEXT_CLIENT_ID: AtomicUsize = AtomicUsize::new(0);
}

init_fn!(init);

#[derive(Serialize, Deserialize)]
pub enum CommandType {
    ConnectWithOptions,
    ConnectWithUri,
    ListDatabases,
    ListCollectionNames,
}

#[derive(Deserialize)]
pub struct CommandArgs {
    command_type: CommandType,
    command_id: Option<usize>,
    client_id: Option<usize>,
}

pub struct Command {
    args: CommandArgs,
    data: Option<PinnedBuf>,
}

#[derive(Serialize)]
pub struct AsyncResult<T>
where
    T: Serialize,
{
    command_id: usize,
    data: T,
}

impl Command {
    fn new(args: CommandArgs, data: Option<PinnedBuf>) -> Command {
        Command { args, data }
    }

    fn get_client(&self) -> Client {
        get_client(self.args.client_id.unwrap())
    }
}

impl CommandArgs {
    fn new(data: &[u8]) -> CommandArgs {
        serde_json::from_slice(data).unwrap()
    }
}

fn init(context: &mut dyn PluginInitContext) {
    context.register_op("mongo_command", Box::new(op_command));
}

pub(crate) fn get_client(client_id: usize) -> Client {
    let map: MutexGuard<HashMap<usize, Client>> = CLIENTS.lock().unwrap();
    map.get(&client_id).unwrap().clone()
}

fn op_command(data: &[u8], zero_copy: Option<PinnedBuf>) -> CoreOp {
    let args = CommandArgs::new(data);
    let executor = match args.command_type {
        CommandType::ConnectWithOptions => command::connect_with_options,
        CommandType::ConnectWithUri => command::connect_with_uri,
        CommandType::ListDatabases => command::list_database_names,
        CommandType::ListCollectionNames => command::list_collection_names,
    };

    executor(Command::new(args, zero_copy))
}
