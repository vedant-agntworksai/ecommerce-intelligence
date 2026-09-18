import { getDb } from "@/lib/db";
import { CacheRepository } from "@/lib/db/repositories/cache-repository";
import type { ResourceKind } from "@/lib/cache/policy";
import { OxylabsClient } from "./client";

export class CostOptimizedScraper {
  private client = new OxylabsClient();
  async getOrFetch<T>(resourceKey:string, kind:ResourceKind, payload:Record<string,unknown>, force=false):Promise<{data:T;source:"cache"|"network"}> {
    const db = await getDb();
    const cache = new CacheRepository(db);
    const existing = await cache.get(resourceKey, kind);
    if (!force && existing?.fresh) return {data:existing.payload as T, source:"cache"};
    const data = await this.client.query(payload) as T;
    await cache.put(resourceKey, kind, data);
    return {data, source:"network"};
  }
}
