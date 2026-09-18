import { DuckDBInstance } from "@duckdb/node-api";
import fs from "node:fs";
import path from "node:path";
import type { Database, QueryResult } from "./types";

export class DuckDbDatabase implements Database {
  private constructor(private instance: DuckDBInstance) {}
  static async create(){
    const dbPath = process.env.DUCKDB_PATH ?? "./data/ecommerce.duckdb";
    fs.mkdirSync(path.dirname(dbPath), { recursive:true });
    return new DuckDbDatabase(await DuckDBInstance.fromCache(dbPath));
  }
  async query<T>(sql:string, params:unknown[] = []):Promise<QueryResult<T>> {
    const conn = await this.instance.connect();
    try {
      const reader = await conn.runAndReadAll(sql, params as never[]);
      const rows = reader.getRowObjectsJS() as T[];
      return { rows, rowCount: rows.length };
    } finally { conn.closeSync(); }
  }
  async close(){ /* cached instance is process-scoped; connections are closed per query */ }
}
