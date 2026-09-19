import { getDb } from "@/lib/db";
import { JobRepository } from "@/lib/db/repositories/job-repository";
import { SettingsRepository } from "@/lib/db/repositories/settings-repository";

export async function enqueueStalePdpRefreshes(limit=100){
  const db=await getDb();
  const settings=await new SettingsRepository(db).get();
  const hours=Math.max(1,Math.floor(settings.ttlMs.availability/3600000));
  const {rows}=await db.query<any>(`
    SELECT rp.retailer,rp.product_url,b.name brand
    FROM retailer_products rp
    JOIN canonical_products cp ON cp.id=rp.canonical_product_id
    JOIN brands b ON b.id=cp.brand_id
    WHERE rp.last_scraped IS NULL OR rp.last_scraped < CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
    ORDER BY rp.last_scraped NULLS FIRST LIMIT $1
  `,[limit]);
  const jobs=new JobRepository(db);
  const ids:string[]=[];
  for(const row of rows){
    ids.push(await jobs.enqueue("scrape",{
      brand:row.brand,startUrl:row.product_url,retailer:row.retailer,discoverProducts:false,collectPdp:true,matchCanonical:true,
      findCompetitors:false,collectProductReviews:false,collectCompetitorReviews:false,maximumProducts:1,
      maximumReviewsPerProduct:settings.defaultMaxReviews,competitorsPerProduct:settings.defaultCompetitors,forceRefresh:false,
    }));
  }
  return ids;
}
