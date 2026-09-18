import type { Database } from "../types";
import type { ResourceKind } from "@/lib/cache/policy";
import { isFresh } from "@/lib/cache/policy";

export class CacheRepository {
  constructor(private db: Database) {}
  async get(resourceKey:string, kind:ResourceKind) {
    const {rows} = await this.db.query<{payload_json:string; updated_at:string}>(
      "SELECT payload_json, updated_at FROM resource_cache WHERE resource_key = $1 AND resource_kind = $2 LIMIT 1",
      [resourceKey, kind]
    );
    const row = rows[0];
    if (!row) return null;
    return { payload: JSON.parse(row.payload_json), updatedAt: row.updated_at, fresh: isFresh(row.updated_at, kind) };
  }
  async put(resourceKey:string, kind:ResourceKind, payload:unknown) {
    const json = JSON.stringify(payload);
    await this.db.query(
      `INSERT INTO resource_cache(resource_key, resource_kind, payload_json, updated_at)
       VALUES ($1,$2,$3,CURRENT_TIMESTAMP)
       ON CONFLICT(resource_key, resource_kind)
       DO UPDATE SET payload_json=excluded.payload_json, updated_at=CURRENT_TIMESTAMP`,
      [resourceKey, kind, json]
    );
  }
}
