use crate::*;
use mongodb::options::auth::Credential;
use mongodb::options::{ClientOptions, StreamAddress};
use std::time::Duration;

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

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ConnectResult {
    client_id: usize,
}

pub fn connect_with_options(command: Command) -> util::JsonResult<ConnectResult> {
    let args: ConnectArgs =
        serde_json::from_slice(command.data[0].as_ref()).map_err(|e| e.to_string())?;
    let hosts = args
        .hosts
        .into_iter()
        .map(|host: String| {
            let host: Vec<&str> = host.as_str().split(':').collect();
            StreamAddress {
                hostname: String::from(host[0]),
                port: host.get(1).map(|port| port.parse().unwrap()),
            }
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
    options.credential = args.username.map(|username| {
        let mut credential = Credential::default();
        credential.username = Some(username);
        credential.password = password;
        credential
    });

    let client = mongodb::Client::with_options(options).map_err(|e| e.to_string())?;
    let client_id: usize = NEXT_CLIENT_ID.fetch_add(1, Ordering::SeqCst);
    CLIENTS
        .lock()
        .map_err(|e| e.to_string())?
        .insert(client_id, client);
    Ok(ConnectResult { client_id })
}

pub fn connect_with_uri(command: Command) -> util::JsonResult<ConnectResult> {
    let uri: Vec<u8> = command.data.first().ok_or("Missing URI")?.as_ref().to_vec();
    let uri = String::from_utf8(uri).map_err(|e| e.to_string())?;
    let client = mongodb::Client::with_uri_str(&uri).map_err(|e| e.to_string())?;
    let client_id: usize = NEXT_CLIENT_ID.fetch_add(1, Ordering::SeqCst);
    CLIENTS
        .lock()
        .map_err(|e| e.to_string())?
        .insert(client_id, client);
    Ok(ConnectResult { client_id })
}
