import type { Database } from "./types";

let singleton: Promise<Database> | undefined;

export function getDb():Promise<Database> {
  if (!singleton) {
    singleton = (async () => {
      if (process.env.DB_ENGINE === "postgres") {
        const { PostgresDatabase } = await import("./postgres");
        return new PostgresDatabase();
      }
      const { DuckDbDatabase } = await import("./duckdb");
      return DuckDbDatabase.create();
    })();
  }
  return singleton;
}
