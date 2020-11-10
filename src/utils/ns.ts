export function parseNamespace(ns: string) {
  const [db, ...rest] = ns.split(".");
  return { db, collection: rest.join(".") };
}
