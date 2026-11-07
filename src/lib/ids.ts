const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids arrive in URLs and from the browser; anything that isn't a UUID can't exist (and would make Postgres throw). */
export const isUuid = (id: unknown): id is string => typeof id === "string" && UUID.test(id);
