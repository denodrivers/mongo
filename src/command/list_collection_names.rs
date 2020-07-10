use crate::*;

pub fn list_collection_names(command: Command) -> util::AsyncJsonOp<Vec<String>> {
    let fut = async move {
        let client = command.get_client();
        let data = command.data.first();
        let db_name: Vec<u8> = data.ok_or("Missing database name")?.as_ref().to_vec();
        let db_name = String::from_utf8(db_name).map_err(|e| e.to_string())?;
        let database = client.database(&db_name);
        let collection_names = database.list_collection_names(None::<bson::Document>);

        Ok(collection_names.map_err(|e| e.to_string())?)
    };
    fut.boxed()
}
