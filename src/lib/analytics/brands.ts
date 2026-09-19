import type { Database } from "@/lib/db/types";

const n=(v:unknown)=>v==null?0:Number(v);
const nullable=(v:unknown)=>v==null?null:Number(v);

export async function getBrandDashboard(db:Database,slug:string){
  const brand=(await db.query<any>("SELECT * FROM brands WHERE slug=$1 LIMIT 1",[slug])).rows[0];
  if(!brand)return null;

  const summary=(await db.query<any>(`
    SELECT
      (SELECT COUNT(*) FROM canonical_products cp WHERE cp.brand_id=$1) unique_products,
      (SELECT COUNT(*) FROM retailer_products rp JOIN canonical_products cp ON cp.id=rp.canonical_product_id WHERE cp.brand_id=$1) retailer_listings,
      (SELECT COUNT(*) FROM canonical_products cp WHERE cp.brand_id=$1 AND EXISTS(
        SELECT 1 FROM retailer_products rp JOIN reviews rv ON rv.retailer=rp.retailer AND rv.retailer_product_id=rp.retailer_product_id WHERE rp.canonical_product_id=cp.id
      )) products_with_reviews,
      (SELECT COUNT(*) FROM reviews rv JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id JOIN canonical_products cp ON cp.id=rp.canonical_product_id WHERE cp.brand_id=$1) total_reviews,
      (SELECT AVG(rv.rating) FROM reviews rv JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id JOIN canonical_products cp ON cp.id=rp.canonical_product_id WHERE cp.brand_id=$1 AND rv.rating IS NOT NULL) average_rating,
      (SELECT AVG(rp.price) FROM retailer_products rp JOIN canonical_products cp ON cp.id=rp.canonical_product_id WHERE cp.brand_id=$1 AND rp.price IS NOT NULL) average_price,
      (SELECT COUNT(DISTINCT cr.competitor_product_id) FROM competitor_relationships cr JOIN canonical_products cp ON cp.id=cr.source_product_id WHERE cp.brand_id=$1) competitor_products,
      (SELECT COUNT(*) FROM (
        SELECT cp.id FROM canonical_products cp JOIN retailer_products rp ON rp.canonical_product_id=cp.id WHERE cp.brand_id=$1 GROUP BY cp.id HAVING COUNT(DISTINCT rp.retailer)>1
      ) x) cross_retailer_matches,
      (SELECT MAX(rp.last_scraped) FROM retailer_products rp JOIN canonical_products cp ON cp.id=rp.canonical_product_id WHERE cp.brand_id=$1) last_updated
  `,[brand.id])).rows[0]??{};

  const retailerSummary=(await db.query<any>(`
    SELECT x.*,
      (SELECT COUNT(*) FROM reviews rv
       JOIN retailer_products rp2 ON rp2.retailer=rv.retailer AND rp2.retailer_product_id=rv.retailer_product_id
       JOIN canonical_products cp2 ON cp2.id=rp2.canonical_product_id
       WHERE cp2.brand_id=$1 AND rv.retailer=x.retailer) reviews
    FROM (
      SELECT rp.retailer,COUNT(DISTINCT rp.canonical_product_id) products,COUNT(*) listings,
        AVG(rp.rating) average_rating,AVG(rp.price) average_price,MAX(rp.last_scraped) last_updated
      FROM retailer_products rp JOIN canonical_products cp ON cp.id=rp.canonical_product_id
      WHERE cp.brand_id=$1 GROUP BY rp.retailer
    ) x ORDER BY x.retailer
  `,[brand.id])).rows.map(r=>({...r,products:n(r.products),listings:n(r.listings),reviews:n(r.reviews),average_rating:nullable(r.average_rating),average_price:nullable(r.average_price)}));

  const competitorBrands=(await db.query<any>(`
    SELECT cb.name brand,COUNT(*) matches,COUNT(DISTINCT competitor.id) products
    FROM competitor_relationships cr
    JOIN canonical_products source ON source.id=cr.source_product_id
    JOIN canonical_products competitor ON competitor.id=cr.competitor_product_id
    JOIN brands cb ON cb.id=competitor.brand_id
    WHERE source.brand_id=$1 GROUP BY cb.id,cb.name ORDER BY matches DESC LIMIT 12
  `,[brand.id])).rows.map(r=>({brand:r.brand,matches:n(r.matches),products:n(r.products)}));

  const market=(await db.query<any>(`
    WITH listing_stats AS (
      SELECT cp.id,cp.brand_id,
        AVG(rp.price) avg_price,AVG(rp.rating) avg_rating,
        SUM(COALESCE(rp.review_count,0)) review_volume,
        COUNT(DISTINCT rp.retailer) retailer_coverage
      FROM canonical_products cp LEFT JOIN retailer_products rp ON rp.canonical_product_id=cp.id
      GROUP BY cp.id,cp.brand_id
    ),
    source_ids AS (SELECT id FROM canonical_products WHERE brand_id=$1),
    competitor_ids AS (
      SELECT DISTINCT cr.competitor_product_id id FROM competitor_relationships cr JOIN source_ids s ON s.id=cr.source_product_id
    )
    SELECT
      (SELECT AVG(avg_price) FROM listing_stats WHERE id IN (SELECT id FROM source_ids)) source_price,
      (SELECT AVG(avg_price) FROM listing_stats WHERE id IN (SELECT id FROM competitor_ids)) market_price,
      (SELECT AVG(avg_rating) FROM listing_stats WHERE id IN (SELECT id FROM source_ids)) source_rating,
      (SELECT AVG(avg_rating) FROM listing_stats WHERE id IN (SELECT id FROM competitor_ids)) market_rating,
      (SELECT AVG(review_volume) FROM listing_stats WHERE id IN (SELECT id FROM source_ids)) source_reviews,
      (SELECT AVG(review_volume) FROM listing_stats WHERE id IN (SELECT id FROM competitor_ids)) market_reviews,
      (SELECT AVG(retailer_coverage) FROM listing_stats WHERE id IN (SELECT id FROM source_ids)) source_coverage,
      (SELECT AVG(retailer_coverage) FROM listing_stats WHERE id IN (SELECT id FROM competitor_ids)) market_coverage
  `,[brand.id])).rows[0]??{};

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

  return {
    brand,
    summary:{uniqueProducts:n(summary.unique_products),retailerListings:n(summary.retailer_listings),productsWithReviews:n(summary.products_with_reviews),totalReviews:n(summary.total_reviews),averageRating:nullable(summary.average_rating),averagePrice:nullable(summary.average_price),competitorProducts:n(summary.competitor_products),crossRetailerMatches:n(summary.cross_retailer_matches),lastUpdated:summary.last_updated??null},
    retailerSummary,competitorBrands,
    marketComparison:{
      sourcePrice:nullable(market.source_price),marketPrice:nullable(market.market_price),
      sourceRating:nullable(market.source_rating),marketRating:nullable(market.market_rating),
      sourceReviews:nullable(market.source_reviews),marketReviews:nullable(market.market_reviews),
      sourceCoverage:nullable(market.source_coverage),marketCoverage:nullable(market.market_coverage),
    },
    products,
  };
}
function parseImages(value:unknown):string[]{if(typeof value!=="string")return[];try{const v=JSON.parse(value);return Array.isArray(v)?v.filter(x=>typeof x==="string"):[];}catch{return[];}}
