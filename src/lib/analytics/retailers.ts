import type { Database } from "@/lib/db/types";

export async function getRetailerAnalytics(db:Database){
  const {rows}=await db.query<any>(`
    SELECT x.*,
      (SELECT COUNT(*) FROM reviews rv WHERE rv.retailer=x.retailer) collected_reviews
    FROM (
      SELECT rp.retailer,COUNT(*) listings,COUNT(DISTINCT rp.canonical_product_id) products,
        AVG(rp.price) average_price,AVG(rp.rating) average_rating,
        SUM(COALESCE(rp.review_count,0)) reported_reviews,MAX(rp.last_scraped) last_updated
      FROM retailer_products rp GROUP BY rp.retailer
    ) x ORDER BY x.retailer
  `);
  return rows.map(r=>({...r,listings:Number(r.listings??0),products:Number(r.products??0),average_price:r.average_price==null?null:Number(r.average_price),average_rating:r.average_rating==null?null:Number(r.average_rating),reported_reviews:Number(r.reported_reviews??0),collected_reviews:Number(r.collected_reviews??0)}));
}
