import { getDb } from "@/lib/db";
import { CacheRepository } from "@/lib/db/repositories/cache-repository";
import { SettingsRepository } from "@/lib/db/repositories/settings-repository";
import type { ResourceKind } from "@/lib/cache/policy";
import { OxylabsClient } from "./client";

export class CostOptimizedScraper {
  private client = new OxylabsClient();

  async getOrFetch<T>(
    resourceKey:string,
    kinds:ResourceKind | ResourceKind[],
    payload:Record<string,unknown>,
    force=false
  ):Promise<{data:T;source:"cache"|"network";staleKinds:ResourceKind[]}> {
    const db = await getDb();
    const cache = new CacheRepository(db);
    const settings = await new SettingsRepository(db).get();
    const requested = Array.isArray(kinds) ? kinds : [kinds];

    const states = await Promise.all(
      requested.map(async kind => ({kind, state: await cache.get(resourceKey, kind, settings.ttlMs[kind])}))
    );
    const staleKinds = states.filter(x => !x.state?.fresh).map(x => x.kind);
    const reusable = states.find(x => x.state?.fresh)?.state?.payload;

    if (!force && staleKinds.length === 0 && reusable !== undefined) {
      return {data:reusable as T, source:"cache", staleKinds:[]};
    }

    // This is the only path that may issue an Oxylabs request. Every call above
    // has already checked local cache and configurable freshness for every requested field group.
    const data = await this.client.query(payload) as T;
    await Promise.all(requested.map(kind => cache.put(resourceKey, kind, data)));
    return {data, source:"network", staleKinds};
  }
}
