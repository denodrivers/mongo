export function convert(data: any): any {
  if (data instanceof Array) {
    return data.map((item) => convert(item));
  }
  if (data instanceof Date) {
    return { $date: { $numberLong: data.getTime() } };
  }
  if (data instanceof Map) {
    return convert(Object.fromEntries(data));
  }
  if (data instanceof Object) {
    Object.keys(data).forEach((key) => {
      data[key] = convert(data[key]);
    });
    return data;
  }
  return data;
}

export function parse(data: any): any {
  if (data instanceof Array) {
    return data.map((item) => parse(item));
  }
  if (data && typeof data === "object") {
    if (data.$date && data.$date.$numberLong) {
      return new Date(data.$date.$numberLong);
    }
    Object.keys(data).forEach((key) => {
      data[key] = parse(data[key]);
    });
    return data;
  }
  return data;
}
