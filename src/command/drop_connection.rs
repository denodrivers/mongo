use crate::*;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DropConnectionArgs {
    db_name: String,
    collection_name: String,
}

pub fn drop_connection(command: Command) -> util::JsonResult<util::SuccessResult> {
    let client = command.get_client();
    let data = command.data.first();
    let args: DropConnectionArgs = serde_json::from_slice(
        data.ok_or("Missing arguments for drop connection")?
            .as_ref(),
    )
    .map_err(|e| e.to_string())?;
    let db_name = args.db_name;
    let collection_name = args.collection_name;

    let database = client.database(&db_name);
    let collection = database.collection(&collection_name);

    collection.drop(None).map_err(|e| e.to_string())?;

    Ok(util::SuccessResult::new())
}
