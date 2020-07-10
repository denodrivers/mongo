extern crate deno_core;
#[macro_use]
extern crate lazy_static;
#[macro_use]
extern crate serde_json;
extern crate bson;
extern crate mongodb;
extern crate serde;

use bson::Document;
use deno_core::plugin_api::{Buf, Interface, Op, ZeroCopyBuf};
use futures::{Future, FutureExt};
use mongodb::Client;
use serde::{Deserialize, Serialize};
use std::{
    clone::Clone,
    collections::HashMap,
    pin::Pin,
    result::Result,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Mutex, MutexGuard,
    },
};

mod command;
mod util;

lazy_static! {
    static ref CLIENTS: Mutex<HashMap<usize, Client>> = Mutex::new(HashMap::new());
    static ref NEXT_CLIENT_ID: AtomicUsize = AtomicUsize::new(0);
}

#[derive(Serialize, Deserialize, Clone)]
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

#[derive(Deserialize, Clone)]
pub struct CommandArgs {
    command_type: CommandType,
    command_id: Option<usize>,
    client_id: Option<usize>,
}

#[derive(Clone)]
pub struct Command {
    args: CommandArgs,
    data: Vec<ZeroCopyBuf>,
}

#[derive(Serialize)]
pub struct SyncResult<T>
where
    T: Serialize,
{
    data: Option<T>,
    error: Option<String>,
}

#[derive(Serialize)]
pub struct AsyncResult<T>
where
    T: Serialize,
{
    command_id: usize,
    data: Option<T>,
    error: Option<String>,
}

impl Command {
    fn new(args: CommandArgs, data: Vec<ZeroCopyBuf>) -> Command {
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

fn op_command(_interface: &mut dyn Interface, data: &[u8], zero_copy: &mut [ZeroCopyBuf]) -> Op {
    let args = CommandArgs::new(data);
    let args2 = args.clone();
    let command = Command::new(args, zero_copy.to_vec());
    match args2.command_type {
        CommandType::ConnectWithOptions => util::sync_op(command::connect_with_options, command),
        CommandType::ConnectWithUri => util::sync_op(command::connect_with_uri, command),
        CommandType::ListDatabases => util::async_op(command::list_database_names, command),
        CommandType::ListCollectionNames => util::async_op(command::list_collection_names, command),
        CommandType::Find => util::async_op(command::find, command),
        CommandType::InsertOne => util::async_op(command::insert_one, command),
        CommandType::InsertMany => util::async_op(command::insert_many, command),
        CommandType::Delete => util::async_op(command::delete, command),
        CommandType::Update => util::async_op(command::update, command),
        CommandType::Aggregate => util::async_op(command::aggregate, command),
        CommandType::CreateIndexes => util::async_op(command::create_indexes, command),
        CommandType::Count => util::async_op(command::count, command),
    }
}
