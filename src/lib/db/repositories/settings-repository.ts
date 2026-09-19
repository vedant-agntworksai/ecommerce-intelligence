import type { Database } from "../types";
import { DEFAULT_TTLS_MS, type ResourceKind } from "@/lib/cache/policy";
import { DEFAULT_COMPETITOR_WEIGHTS } from "@/lib/matching/competitors";

export interface AppSettings {
  ttlMs: Record<ResourceKind, number>;
  competitorSizeTolerance: number;
  competitorWeights: typeof DEFAULT_COMPETITOR_WEIGHTS;
  defaultCompetitors: 1 | 3 | 5 | 10;
  defaultMaxReviews: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  ttlMs: DEFAULT_TTLS_MS,
  competitorSizeTolerance: 0.25,
  competitorWeights: DEFAULT_COMPETITOR_WEIGHTS,
  defaultCompetitors: 3,
  defaultMaxReviews: 500,
};

export class SettingsRepository {
  constructor(private db: Database) {}

  async get(): Promise<AppSettings> {
    const { rows } = await this.db.query<{ value_json: string }>(
      "SELECT value_json FROM settings WHERE key=$1 LIMIT 1",
      ["app"]
    );
    if (!rows[0]) return DEFAULT_SETTINGS;
    try {
      const stored = JSON.parse(rows[0].value_json) as Partial<AppSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...stored,
        ttlMs: { ...DEFAULT_SETTINGS.ttlMs, ...(stored.ttlMs ?? {}) },
        competitorWeights: { ...DEFAULT_SETTINGS.competitorWeights, ...(stored.competitorWeights ?? {}) },
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async save(settings: AppSettings) {
    await this.db.query(
      `INSERT INTO settings(key,value_json,updated_at) VALUES($1,$2,CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=CURRENT_TIMESTAMP`,
      ["app", JSON.stringify(settings)]
    );
  }
}
