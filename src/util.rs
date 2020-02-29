use crate::*;

pub fn async_result<T>(args: &CommandArgs, data: T) -> Buf
where
    T: Serialize,
{
    let result = AsyncResult {
        command_id: args.command_id.unwrap(),
        data,
    };
    let json = json!(result);
    let data = serde_json::to_vec(&json).unwrap();
    Buf::from(data)
}
