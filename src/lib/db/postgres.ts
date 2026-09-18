import { Pool } from "pg";
import type { Database, QueryResult } from "./types";

export class PostgresDatabase implements Database {
  private pool = new Pool({ connectionString: process.env.DATABASE_URL });
  async query<T>(sql:string, params:unknown[] = []):Promise<QueryResult<T>> {
    const result = await this.pool.query(sql, params);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? result.rows.length };
  }
  async close(){ await this.pool.end(); }
}
