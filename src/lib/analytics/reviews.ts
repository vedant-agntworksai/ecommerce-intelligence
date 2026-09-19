import type { Database } from "@/lib/db/types";

export interface ReviewFilters { retailer?:string; stars?:number; dateFrom?:string; verified?:boolean; keyword?:string; productId?:string; limit?:number; }
const n=(v:unknown)=>v==null?0:Number(v);

export async function getReviewAnalytics(db:Database,filters:ReviewFilters={}){
  const params:unknown[]=[];const where:string[]=[];
  const add=(v:unknown)=>{params.push(v);return `$${params.length}`;};
  if(filters.retailer)where.push(`rv.retailer=${add(filters.retailer)}`);
  if(filters.stars)where.push(`FLOOR(rv.rating)=${add(filters.stars)}`);
  if(filters.dateFrom)where.push(`rv.review_date>=${add(filters.dateFrom)}`);
  if(filters.verified!=null)where.push(`rv.verified_purchase=${add(filters.verified)}`);
  if(filters.keyword){const p=add(`%${filters.keyword.toLowerCase()}%`);where.push(`(LOWER(COALESCE(rv.title,'')) LIKE ${p} OR LOWER(COALESCE(rv.review_text,'')) LIKE ${p})`);}
  if(filters.productId)where.push(`rp.canonical_product_id=${add(filters.productId)}`);
  const clause=where.length?`WHERE ${where.join(" AND ")}`:"";

  const stats=(await db.query<any>(`
    SELECT COUNT(*) total,AVG(rv.rating) average_rating,
      SUM(CASE WHEN rv.verified_purchase=TRUE THEN 1 ELSE 0 END) verified,
      SUM(CASE WHEN rv.verified_purchase IS NOT NULL THEN 1 ELSE 0 END) verified_known
    FROM reviews rv
    LEFT JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id
    ${clause}
  `,params)).rows[0]??{};

  const distribution=(await db.query<any>(`
    SELECT CAST(FLOOR(rv.rating) AS INTEGER) star,COUNT(*) count
    FROM reviews rv LEFT JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id
    ${clause}${clause?" AND":" WHERE"} rv.rating IS NOT NULL
    GROUP BY CAST(FLOOR(rv.rating) AS INTEGER) ORDER BY star DESC
  `,params)).rows.map(r=>({star:n(r.star),count:n(r.count)}));

  const byRetailer=(await db.query<any>(`
    SELECT rv.retailer,COUNT(*) count,AVG(rv.rating) average_rating
    FROM reviews rv LEFT JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id
    ${clause} GROUP BY rv.retailer ORDER BY count DESC
  `,params)).rows.map(r=>({...r,count:n(r.count),average_rating:r.average_rating==null?null:Number(r.average_rating)}));

  const listParams=[...params];listParams.push(filters.limit??200);
  const rows=(await db.query<any>(`
    SELECT rv.*,rp.canonical_product_id,cp.title product_title,b.name brand
    FROM reviews rv
    LEFT JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id
    LEFT JOIN canonical_products cp ON cp.id=rp.canonical_product_id
    LEFT JOIN brands b ON b.id=cp.brand_id
    ${clause}
    ORDER BY COALESCE(rv.review_date,rv.scraped_at) DESC
    LIMIT $${listParams.length}
  `,listParams)).rows;

  const verifiedKnown=n(stats.verified_known);
  return {stats:{total:n(stats.total),averageRating:stats.average_rating==null?null:Number(stats.average_rating),verifiedPercentage:verifiedKnown?100*n(stats.verified)/verifiedKnown:null},distribution,byRetailer,rows};
}
