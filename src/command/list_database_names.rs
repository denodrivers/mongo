use crate::*;

pub fn list_database_names(command: Command) -> Op {
    let fut = async move {
        let names = command
            .get_client()
            .list_database_names(None::<bson::Document>);
        let data = names.unwrap();
        util::async_result(&command.args, data)
    };
    Op::Async(fut.boxed())
}
