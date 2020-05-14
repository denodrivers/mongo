extern crate deno_core;
#[macro_use]
extern crate lazy_static;
#[macro_use]
extern crate serde_json;
extern crate bson;
extern crate mongodb;
extern crate serde;

use deno_core::plugin_api::{Buf, Interface, Op, ZeroCopyBuf};
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

#[derive(Serialize, Deserialize)]
pub enum CommandType {
    ConnectWithOptions,
    ConnectWithUri,
    ListDatabases,
    Find,
    ListCollectionNames,
    InsertMany,
    InsertOne,
    Delete,
    Aggregate,
    Update,
    Count,
    CreateIndexes,
}

#[derive(Deserialize)]
pub struct CommandArgs {
    command_type: CommandType,
    command_id: Option<usize>,
    client_id: Option<usize>,
}

pub struct Command {
    args: CommandArgs,
    data: Option<ZeroCopyBuf>,
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
    fn new(args: CommandArgs, data: Option<ZeroCopyBuf>) -> Command {
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

#[no_mangle]
pub fn deno_plugin_init(interface: &mut dyn Interface) {
    interface.register_op("mongo_command", op_command);
}

pub(crate) fn get_client(client_id: usize) -> Client {
    let map: MutexGuard<HashMap<usize, Client>> = CLIENTS.lock().unwrap();
    map.get(&client_id).unwrap().clone()
}

fn op_command(_interface: &mut dyn Interface, data: &[u8], zero_copy: Option<ZeroCopyBuf>) -> Op {
    let args = CommandArgs::new(data);
    let executor = match args.command_type {
        CommandType::ConnectWithOptions => command::connect_with_options,
        CommandType::ConnectWithUri => command::connect_with_uri,
        CommandType::ListDatabases => command::list_database_names,
        CommandType::ListCollectionNames => command::list_collection_names,
        CommandType::Find => command::find,
        CommandType::InsertOne => command::insert_one,
        CommandType::InsertMany => command::insert_many,
        CommandType::Delete => command::delete,
        CommandType::Update => command::update,
        CommandType::Aggregate => command::aggregate,
        CommandType::CreateIndexes => command::create_indexes,
        CommandType::Count => command::count,
    };

    executor(Command::new(args, zero_copy))
}
