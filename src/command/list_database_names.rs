use crate::*;

pub fn list_database_names(command: Command) -> CoreOp {
    let fut = async move {
        let names = command.get_client().list_database_names(None);
        let data = names.unwrap();
        Ok(util::async_result(&command.args, data))
    };
    CoreOp::Async(fut.boxed())
}
