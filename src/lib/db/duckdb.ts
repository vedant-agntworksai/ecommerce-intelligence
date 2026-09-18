import { DuckDBInstance } from "@duckdb/node-api";
import fs from "node:fs";
import path from "node:path";
import type { Database, QueryResult } from "./types";

export class DuckDbDatabase implements Database {
  private constructor(private instance: DuckDBInstance) {}
  static async create(){
    const dbPath = process.env.DUCKDB_PATH ?? "./data/ecommerce.duckdb";
    fs.mkdirSync(path.dirname(dbPath), { recursive:true });
    return new DuckDbDatabase(await DuckDBInstance.create(dbPath));
  }
  async query<T>(sql:string, params:unknown[] = []):Promise<QueryResult<T>> {
    const conn = await this.instance.connect();
    try {
      const prepared = await conn.prepare(sql);
      for (let i=0;i<params.length;i++) prepared.bindValue(i+1, params[i] as never);
      const result = await prepared.run();
      const rows = await result.getRowObjects() as T[];
      return { rows, rowCount: rows.length };
    } finally { conn.closeSync(); }
  }
  async close(){ this.instance.closeSync(); }
}
