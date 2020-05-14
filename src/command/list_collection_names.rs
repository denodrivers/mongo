use crate::*;

pub fn list_collection_names(command: Command) -> Op {
    let fut = async move {
        let client = command.get_client();
        let data = command.data;
        let db_name: Vec<u8> = data.unwrap().as_ref().to_vec();
        let db_name = String::from_utf8(db_name).unwrap();
        let database = client.database(&db_name);
        let collection_names = database.list_collection_names(None::<bson::Document>);

        util::async_result(&command.args, collection_names.unwrap())
    };
    Op::Async(fut.boxed())
}
