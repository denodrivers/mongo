#[macro_use]
extern crate deno_core;
#[macro_use]
extern crate lazy_static;
#[macro_use]
extern crate serde_json;
extern crate serde;

use deno_core::Buf;
use deno_core::CoreOp;
use deno_core::PinnedBuf;
use deno_core::PluginInitContext;
use futures::FutureExt;
use mongodb::options::auth::Credential;
use mongodb::options::{ClientOptions, StreamAddress};
use mongodb::Client;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Duration;

use std::{collections::HashMap, sync::Mutex, sync::MutexGuard};

lazy_static! {
    static ref CLIENTS: Mutex<HashMap<usize, Client>> = Mutex::new(HashMap::new());
    static ref NEXT_CLIENT_ID: AtomicUsize = AtomicUsize::new(0);
}

init_fn!(init);

#[derive(Deserialize)]
struct MongoCommand {
    command_type: MongoCommandType,
    command_id: Option<usize>,
    client_id: Option<usize>,
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
    ConnectWithOptions,
    ConnectWithUri,
    ListDatabases,
}

#[derive(Deserialize, Debug)]
struct ConnectArgs {
    hosts: Vec<String>,
    app_name: Option<String>,
    heartbeat_freq: Option<u64>,
    repl_set_name: Option<String>,
    max_pool_size: Option<u32>,
    min_pool_size: Option<u32>,
    max_idle_time: Option<u64>,
    wait_queue_timeout: Option<u64>,
    server_selection_timeout: Option<u64>,
    connect_timeout: Option<u64>,
    direct_connection: Option<bool>,
    username: Option<String>,
    password: Option<String>,
}

impl MongoCommand {
    fn get_client(&self) -> Client {
        get_client(self.client_id.unwrap())
    }
}

fn init(context: &mut dyn PluginInitContext) {
    context.register_op("mongo_command", Box::new(op_command));
}

fn get_client(client_id: usize) -> Client {
    let map: MutexGuard<HashMap<usize, Client>> = CLIENTS.lock().unwrap();
    map.get(&client_id).unwrap().clone()
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
        MongoCommandType::ConnectWithOptions => command_connect_with_options(zero_copy),
        MongoCommandType::ConnectWithUri => command_connect_with_uri(zero_copy),
        MongoCommandType::ListDatabases => command_list_databases(command),
    }
}

fn command_connect_with_options(data: Option<PinnedBuf>) -> CoreOp {
    let args: ConnectArgs = serde_json::from_slice(data.unwrap().as_ref()).unwrap();
    let hosts = args
        .hosts
        .into_iter()
        .map(|host: String| {
            let host: Vec<&str> = host.as_str().split(":").collect();
            let addr = StreamAddress {
                hostname: String::from(host[0]),
                port: host.get(1).map(|port| {
                    let port: u16 = port.parse().unwrap();
                    port
                }),
            };
            addr
        })
        .collect();
    let mut options: ClientOptions = ClientOptions::default();
    options.hosts = hosts;
    options.app_name = args.app_name;
    options.heartbeat_freq = args.heartbeat_freq.map(Duration::from_millis);
    options.repl_set_name = args.repl_set_name;
    options.max_pool_size = args.max_pool_size;
    options.min_pool_size = args.min_pool_size;
    options.max_idle_time = args.max_idle_time.map(Duration::from_millis);
    options.wait_queue_timeout = args.wait_queue_timeout.map(Duration::from_millis);
    options.server_selection_timeout = args.server_selection_timeout.map(Duration::from_millis);
    options.connect_timeout = args.connect_timeout.map(Duration::from_millis);
    options.direct_connection = args.direct_connection;
    let password = args.password.clone();
    options.credential = args.username.clone().map(|username| {
        let mut credential = Credential::default();
        credential.username = Some(username);
        credential.password = password;
        credential
    });

    let client = mongodb::Client::with_options(options).unwrap();
    let client_id: usize = NEXT_CLIENT_ID.fetch_add(1, Ordering::SeqCst);
    CLIENTS.lock().unwrap().insert(client_id, client);
    CoreOp::Sync(Buf::from(client_id.to_string().as_bytes()))
}

fn command_connect_with_uri(data: Option<PinnedBuf>) -> CoreOp {
    let uri: Vec<u8> = data.unwrap().as_ref().to_vec();
    let uri = String::from_utf8(uri).unwrap();
    let client = mongodb::Client::with_uri_str(&uri).unwrap();
    let client_id: usize = NEXT_CLIENT_ID.fetch_add(1, Ordering::SeqCst);
    CLIENTS.lock().unwrap().insert(client_id, client);
    CoreOp::Sync(Buf::from(client_id.to_string().as_bytes()))
}

fn command_list_databases(command: MongoCommand) -> CoreOp {
    let fut = async move {
        let names = command.get_client().list_database_names(None);
        let data = names.unwrap();
        Ok(async_result(command.command_id.unwrap(), data))
    };
    CoreOp::Async(fut.boxed())
}
