export interface QueryResult<T = Record<string, unknown>> { rows: T[]; rowCount: number; }
export interface Database {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  close(): Promise<void>;
}
