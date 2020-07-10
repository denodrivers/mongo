use crate::*;

pub fn list_database_names(command: Command) -> util::AsyncJsonOp<Vec<String>> {
    let fut = async move {
        let names = command
            .get_client()
            .list_database_names(None::<bson::Document>);
        let data = names.map_err(|e| e.to_string())?;
        Ok(data)
    };
    fut.boxed()
}
