import type { Database } from "@/lib/db/types";

export interface ProductFilters {
  search?:string; category?:string; retailer?:string; minPrice?:number; maxPrice?:number;
  minRating?:number; minReviews?:number; availability?:string; hasUpc?:boolean; hasGtin?:boolean;
  hasModel?:boolean; retailerCount?:number;
}

const n=(v:unknown)=>v==null?0:Number(v);
const nullable=(v:unknown)=>v==null?null:Number(v);
const images=(v:unknown)=>{try{const x=JSON.parse(String(v??"[]"));return Array.isArray(x)?x:[];}catch{return[];}};

export async function listCanonicalProducts(db:Database,filters:ProductFilters={},limit=250){
  const params:unknown[]=[];
  const where:string[]=[];
  const add=(value:unknown)=>{params.push(value);return `$${params.length}`;};

  if(filters.search){const p=add(`%${filters.search.toLowerCase()}%`);where.push(`(LOWER(cp.title) LIKE ${p} OR LOWER(b.name) LIKE ${p} OR LOWER(COALESCE(cp.model_number,'')) LIKE ${p})`);}
  if(filters.category){where.push(`LOWER(COALESCE(cp.category,''))=${add(filters.category.toLowerCase())}`);}
  if(filters.retailer){where.push(`EXISTS(SELECT 1 FROM retailer_products rx WHERE rx.canonical_product_id=cp.id AND rx.retailer=${add(filters.retailer)})`);}
  if(filters.minPrice!=null){where.push(`EXISTS(SELECT 1 FROM retailer_products rx WHERE rx.canonical_product_id=cp.id AND rx.price>=${add(filters.minPrice)})`);}
  if(filters.maxPrice!=null){where.push(`EXISTS(SELECT 1 FROM retailer_products rx WHERE rx.canonical_product_id=cp.id AND rx.price<=${add(filters.maxPrice)})`);}
  if(filters.minRating!=null){where.push(`COALESCE((SELECT AVG(rx.rating) FROM retailer_products rx WHERE rx.canonical_product_id=cp.id),0)>=${add(filters.minRating)}`);}
  if(filters.minReviews!=null){where.push(`(SELECT COUNT(*) FROM reviews rv JOIN retailer_products rx ON rx.retailer=rv.retailer AND rx.retailer_product_id=rv.retailer_product_id WHERE rx.canonical_product_id=cp.id)>=${add(filters.minReviews)}`);}
  if(filters.availability){where.push(`EXISTS(SELECT 1 FROM retailer_products rx WHERE rx.canonical_product_id=cp.id AND LOWER(COALESCE(rx.availability,'')) LIKE ${add(`%${filters.availability.toLowerCase()}%`)})`);}
  if(filters.hasUpc!=null)where.push(filters.hasUpc?"cp.upc IS NOT NULL AND TRIM(cp.upc)<>''":"(cp.upc IS NULL OR TRIM(cp.upc)='')");
  if(filters.hasGtin!=null)where.push(filters.hasGtin?"cp.gtin IS NOT NULL AND TRIM(cp.gtin)<>''":"(cp.gtin IS NULL OR TRIM(cp.gtin)='')");
  if(filters.hasModel!=null)where.push(filters.hasModel?"cp.model_number IS NOT NULL AND TRIM(cp.model_number)<>''":"(cp.model_number IS NULL OR TRIM(cp.model_number)='')");
  if(filters.retailerCount!=null)where.push(`(SELECT COUNT(DISTINCT rx.retailer) FROM retailer_products rx WHERE rx.canonical_product_id=cp.id)>=${add(filters.retailerCount)}`);

  params.push(limit);
  const sql=`
    SELECT cp.*,b.name brand,
      (SELECT COUNT(DISTINCT rx.retailer) FROM retailer_products rx WHERE rx.canonical_product_id=cp.id) retailer_count,
      (SELECT MIN(rx.price) FROM retailer_products rx WHERE rx.canonical_product_id=cp.id AND rx.price IS NOT NULL) lowest_price,
      (SELECT MAX(rx.price) FROM retailer_products rx WHERE rx.canonical_product_id=cp.id AND rx.price IS NOT NULL) highest_price,
      (SELECT AVG(rx.rating) FROM retailer_products rx WHERE rx.canonical_product_id=cp.id AND rx.rating IS NOT NULL) average_rating,
      (SELECT COUNT(*) FROM reviews rv JOIN retailer_products rx ON rx.retailer=rv.retailer AND rx.retailer_product_id=rv.retailer_product_id WHERE rx.canonical_product_id=cp.id) total_reviews
    FROM canonical_products cp JOIN brands b ON b.id=cp.brand_id
    ${where.length?`WHERE ${where.join(" AND ")}`:""}
    ORDER BY cp.updated_at DESC,cp.title
    LIMIT $${params.length}
  `;
  const {rows}=await db.query<any>(sql,params);
  return rows.map(r=>({...r,retailer_count:n(r.retailer_count),lowest_price:nullable(r.lowest_price),highest_price:nullable(r.highest_price),average_rating:nullable(r.average_rating),total_reviews:n(r.total_reviews),images:images(r.images_json)}));
}

export async function getProductDetail(db:Database,id:string){
  const product=(await db.query<any>(`
    SELECT cp.*,b.name brand FROM canonical_products cp JOIN brands b ON b.id=cp.brand_id WHERE cp.id=$1 LIMIT 1
  `,[id])).rows[0];
  if(!product)return null;
  product.images=images(product.images_json);

  const listings=(await db.query<any>(`
    SELECT * FROM retailer_products WHERE canonical_product_id=$1 ORDER BY retailer,last_scraped DESC
  `,[id])).rows.map(r=>({...r,price:nullable(r.price),original_price:nullable(r.original_price),rating:nullable(r.rating),review_count:r.review_count==null?null:n(r.review_count)}));

  const reviewStats=(await db.query<any>(`
    SELECT COUNT(*) collected_reviews,AVG(rv.rating) average_rating,
      SUM(CASE WHEN rv.verified_purchase=TRUE THEN 1 ELSE 0 END) verified_reviews,
      SUM(CASE WHEN rv.verified_purchase IS NOT NULL THEN 1 ELSE 0 END) verified_known
    FROM reviews rv
    JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id
    WHERE rp.canonical_product_id=$1
  `,[id])).rows[0]??{};

  const starDistribution=(await db.query<any>(`
    SELECT CAST(FLOOR(rv.rating) AS INTEGER) star,COUNT(*) count
    FROM reviews rv JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id
    WHERE rp.canonical_product_id=$1 AND rv.rating IS NOT NULL
    GROUP BY CAST(FLOOR(rv.rating) AS INTEGER) ORDER BY star DESC
  `,[id])).rows.map(r=>({star:n(r.star),count:n(r.count)}));

  const reviewsByRetailer=(await db.query<any>(`
    SELECT rv.retailer,COUNT(*) count,AVG(rv.rating) average_rating
    FROM reviews rv JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id
    WHERE rp.canonical_product_id=$1 GROUP BY rv.retailer ORDER BY count DESC
  `,[id])).rows.map(r=>({...r,count:n(r.count),average_rating:nullable(r.average_rating)}));

  const reviewTimeline=(await db.query<any>(`
    SELECT CAST(rv.review_date AS DATE) day,COUNT(*) count
    FROM reviews rv JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id
    WHERE rp.canonical_product_id=$1 AND rv.review_date IS NOT NULL
    GROUP BY CAST(rv.review_date AS DATE) ORDER BY day
  `,[id])).rows.map(r=>({label:String(r.day).slice(0,10),value:n(r.count)}));

  const competitors=(await db.query<any>(`
    SELECT cr.label,cr.updated_at,cp.id,cp.title,b.name brand,cp.size_text,cp.formulation,cp.normalized_quantity,cp.normalized_unit,
      (SELECT MIN(rp.price) FROM retailer_products rp WHERE rp.canonical_product_id=cp.id AND rp.price IS NOT NULL) price,
      (SELECT AVG(rp.rating) FROM retailer_products rp WHERE rp.canonical_product_id=cp.id AND rp.rating IS NOT NULL) rating,
      (SELECT SUM(COALESCE(rp.review_count,0)) FROM retailer_products rp WHERE rp.canonical_product_id=cp.id) review_count,
      (SELECT COUNT(DISTINCT rp.retailer) FROM retailer_products rp WHERE rp.canonical_product_id=cp.id) retailer_count
    FROM competitor_relationships cr
    JOIN canonical_products cp ON cp.id=cr.competitor_product_id
    JOIN brands b ON b.id=cp.brand_id
    WHERE cr.source_product_id=$1 ORDER BY cr.score DESC
  `,[id])).rows.map(r=>({...r,price:nullable(r.price),rating:nullable(r.rating),review_count:n(r.review_count),retailer_count:n(r.retailer_count)}));

  const priceHistory=(await db.query<any>(`
    SELECT captured_at,retailer_product_id,price FROM historical_snapshots
    WHERE canonical_product_id=$1 AND price IS NOT NULL ORDER BY captured_at
  `,[id])).rows.map(r=>({...r,price:nullable(r.price)}));
  const ratingHistory=(await db.query<any>(`
    SELECT captured_at,retailer_product_id,rating,review_count FROM historical_snapshots
    WHERE canonical_product_id=$1 AND rating IS NOT NULL ORDER BY captured_at
  `,[id])).rows.map(r=>({...r,rating:nullable(r.rating),review_count:r.review_count==null?null:n(r.review_count)}));

  const collectedReviews=n(reviewStats.collected_reviews);
  const verifiedKnown=n(reviewStats.verified_known);
  const prices=listings.map(x=>x.price).filter((x):x is number=>x!=null);
  return {
    product,listings,competitors,priceHistory,ratingHistory,
    stats:{
      retailers:new Set(listings.map(x=>x.retailer)).size,
      lowestPrice:prices.length?Math.min(...prices):null,
      highestPrice:prices.length?Math.max(...prices):null,
      averagePrice:prices.length?prices.reduce((a,b)=>a+b,0)/prices.length:null,
      totalReviews:collectedReviews,
      averageRating:nullable(reviewStats.average_rating),
      competitors:competitors.length,
    },
    reviews:{collectedReviews,averageRating:nullable(reviewStats.average_rating),verifiedPercentage:verifiedKnown?100*n(reviewStats.verified_reviews)/verifiedKnown:null,starDistribution,reviewsByRetailer,reviewTimeline},
  };
}
