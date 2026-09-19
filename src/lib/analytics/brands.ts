import type { Database } from "@/lib/db/types";

const n=(v:unknown)=>v==null?0:Number(v);
const nullable=(v:unknown)=>v==null?null:Number(v);

export async function getBrandDashboard(db:Database,slug:string){
  const brand=(await db.query<any>("SELECT * FROM brands WHERE slug=$1 LIMIT 1",[slug])).rows[0];
  if(!brand)return null;

  const summary=(await db.query<any>(`
    SELECT
      COUNT(DISTINCT cp.id) unique_products,
      COUNT(DISTINCT rp.retailer || ':' || rp.retailer_product_id) retailer_listings,
      COUNT(DISTINCT CASE WHEN r.review_id IS NOT NULL THEN cp.id END) products_with_reviews,
      COUNT(DISTINCT r.retailer || ':' || r.retailer_product_id || ':' || r.review_id) total_reviews,
      AVG(r.rating) average_rating, AVG(rp.price) average_price,
      COUNT(DISTINCT cr.competitor_product_id) competitor_products,
      COUNT(DISTINCT CASE WHEN cov.retailer_count > 1 THEN cp.id END) cross_retailer_matches,
      MAX(rp.last_scraped) last_updated
    FROM canonical_products cp
    LEFT JOIN retailer_products rp ON rp.canonical_product_id=cp.id
    LEFT JOIN reviews r ON r.retailer=rp.retailer AND r.retailer_product_id=rp.retailer_product_id
    LEFT JOIN competitor_relationships cr ON cr.source_product_id=cp.id
    LEFT JOIN (SELECT canonical_product_id,COUNT(DISTINCT retailer) retailer_count FROM retailer_products GROUP BY canonical_product_id) cov ON cov.canonical_product_id=cp.id
    WHERE cp.brand_id=$1
  `,[brand.id])).rows[0]??{};

  const retailerSummary=(await db.query<any>(`
    SELECT rp.retailer,COUNT(DISTINCT rp.canonical_product_id) products,
      COUNT(DISTINCT r.retailer || ':' || r.retailer_product_id || ':' || r.review_id) reviews,
      AVG(rp.rating) average_rating,AVG(rp.price) average_price,MAX(rp.last_scraped) last_updated
    FROM retailer_products rp
    LEFT JOIN reviews r ON r.retailer=rp.retailer AND r.retailer_product_id=rp.retailer_product_id
    JOIN canonical_products cp ON cp.id=rp.canonical_product_id
    WHERE cp.brand_id=$1 GROUP BY rp.retailer ORDER BY rp.retailer
  `,[brand.id])).rows.map(r=>({...r,products:n(r.products),reviews:n(r.reviews),average_rating:nullable(r.average_rating),average_price:nullable(r.average_price)}));

  const competitorBrands=(await db.query<any>(`
    SELECT cb.name brand,COUNT(*) matches
    FROM competitor_relationships cr
    JOIN canonical_products source ON source.id=cr.source_product_id
    JOIN canonical_products competitor ON competitor.id=cr.competitor_product_id
    JOIN brands cb ON cb.id=competitor.brand_id
    WHERE source.brand_id=$1 GROUP BY cb.id,cb.name ORDER BY matches DESC LIMIT 12
  `,[brand.id])).rows.map(r=>({brand:r.brand,matches:n(r.matches)}));

  const products=(await db.query<any>(`
    SELECT cp.*,b.name brand,
      (SELECT COUNT(DISTINCT rp.retailer) FROM retailer_products rp WHERE rp.canonical_product_id=cp.id) retailer_count,
      (SELECT string_agg(DISTINCT rp.retailer, ',') FROM retailer_products rp WHERE rp.canonical_product_id=cp.id) retailers,
      (SELECT MIN(rp.price) FROM retailer_products rp WHERE rp.canonical_product_id=cp.id AND rp.price IS NOT NULL) lowest_price,
      (SELECT AVG(rp.rating) FROM retailer_products rp WHERE rp.canonical_product_id=cp.id AND rp.rating IS NOT NULL) average_rating,
      (SELECT COUNT(*) FROM reviews rv JOIN retailer_products rp2 ON rp2.retailer=rv.retailer AND rp2.retailer_product_id=rv.retailer_product_id WHERE rp2.canonical_product_id=cp.id) total_reviews
    FROM canonical_products cp JOIN brands b ON b.id=cp.brand_id
    WHERE cp.brand_id=$1 ORDER BY cp.updated_at DESC,cp.title LIMIT 500
  `,[brand.id])).rows.map(r=>({...r,retailer_count:n(r.retailer_count),lowest_price:nullable(r.lowest_price),average_rating:nullable(r.average_rating),total_reviews:n(r.total_reviews),images:parseImages(r.images_json)}));

  return {brand,summary:{uniqueProducts:n(summary.unique_products),retailerListings:n(summary.retailer_listings),productsWithReviews:n(summary.products_with_reviews),totalReviews:n(summary.total_reviews),averageRating:nullable(summary.average_rating),averagePrice:nullable(summary.average_price),competitorProducts:n(summary.competitor_products),crossRetailerMatches:n(summary.cross_retailer_matches),lastUpdated:summary.last_updated??null},retailerSummary,competitorBrands,products};
}
function parseImages(value:unknown):string[]{if(typeof value!=="string")return[];try{const v=JSON.parse(value);return Array.isArray(v)?v.filter(x=>typeof x==="string"):[];}catch{return[];}}
