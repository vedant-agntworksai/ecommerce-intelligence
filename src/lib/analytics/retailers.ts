import type { Database } from "@/lib/db/types";

export async function getRetailerAnalytics(db:Database){
  const {rows}=await db.query<any>(`
    SELECT rp.retailer,
      COUNT(*) listings,
      COUNT(DISTINCT rp.canonical_product_id) products,
      AVG(rp.price) average_price,
      AVG(rp.rating) average_rating,
      SUM(COALESCE(rp.review_count,0)) reported_reviews,
      COUNT(DISTINCT rv.review_id) collected_reviews,
      MAX(rp.last_scraped) last_updated
    FROM retailer_products rp
    LEFT JOIN reviews rv ON rv.retailer=rp.retailer AND rv.retailer_product_id=rp.retailer_product_id
    GROUP BY rp.retailer ORDER BY rp.retailer
  `);
  return rows.map(r=>({...r,listings:Number(r.listings??0),products:Number(r.products??0),average_price:r.average_price==null?null:Number(r.average_price),average_rating:r.average_rating==null?null:Number(r.average_rating),reported_reviews:Number(r.reported_reviews??0),collected_reviews:Number(r.collected_reviews??0)}));
}
