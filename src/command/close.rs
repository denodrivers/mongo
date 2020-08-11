use crate::*;

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CloseResult {
    success: bool,
}

pub fn close(command: Command) -> util::JsonResult<CloseResult> {
    let client_id: &usize = &command.args.client_id.unwrap();
    CLIENTS.lock().map_err(|e| e.to_string())?.remove(client_id);
    Ok(CloseResult { success: true })
}
