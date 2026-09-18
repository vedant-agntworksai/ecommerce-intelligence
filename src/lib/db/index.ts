import type { Database } from "./types";
import { DuckDbDatabase } from "./duckdb";
import { PostgresDatabase } from "./postgres";

let singleton: Promise<Database> | undefined;
export function getDb():Promise<Database> {
  if (!singleton) {
    singleton = process.env.DB_ENGINE === "postgres"
      ? Promise.resolve(new PostgresDatabase())
      : DuckDbDatabase.create();
  }
  return singleton;
}
