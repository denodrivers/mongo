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
    let mut data = serde_json::to_vec(&json).unwrap();
    data.resize((data.len() + 3) & !3, b' ');
    Buf::from(data)
}
