import type { Database } from "@/lib/db/types";
import { unitPrice } from "@/lib/matching/units";

export interface CompetitorFilters { sourceBrand?:string; category?:string; subcategory?:string; size?:string; form?:string; retailer?:string; }
const num=(v:unknown)=>v==null?null:Number(v);

export async function getCompetitorMarket(db:Database,filters:CompetitorFilters={}){
  const params:unknown[]=[];
  const where:string[]=[];
  const add=(v:unknown)=>{params.push(v);return `$${params.length}`;};

  if(filters.sourceBrand)where.push(`LOWER(sb.name)=${add(filters.sourceBrand.toLowerCase())}`);
  if(filters.category)where.push(`LOWER(COALESCE(source.category,''))=${add(filters.category.toLowerCase())}`);
  if(filters.subcategory)where.push(`LOWER(COALESCE(source.subcategory,''))=${add(filters.subcategory.toLowerCase())}`);
  if(filters.size)where.push(`LOWER(COALESCE(source.size_text,'')) LIKE ${add(`%${filters.size.toLowerCase()}%`)}`);
  if(filters.form)where.push(`LOWER(COALESCE(source.formulation,''))=${add(filters.form.toLowerCase())}`);
  if(filters.retailer)where.push(`EXISTS(SELECT 1 FROM retailer_products rx WHERE rx.canonical_product_id=competitor.id AND rx.retailer=${add(filters.retailer)})`);

  const {rows}=await db.query<any>(`
    SELECT cr.label,cr.updated_at,
      source.id source_id,source.title source_title,sb.name source_brand,source.size_text source_size,source.formulation source_formulation,
      source.normalized_quantity source_quantity,source.normalized_unit source_unit,
      (SELECT MIN(rp.price) FROM retailer_products rp WHERE rp.canonical_product_id=source.id AND rp.price IS NOT NULL) source_price,
      competitor.id competitor_id,competitor.title competitor_title,cb.name competitor_brand,competitor.size_text competitor_size,competitor.formulation competitor_formulation,
      competitor.normalized_quantity competitor_quantity,competitor.normalized_unit competitor_unit,
      (SELECT MIN(rp.price) FROM retailer_products rp WHERE rp.canonical_product_id=competitor.id AND rp.price IS NOT NULL) competitor_price,
      (SELECT AVG(rp.rating) FROM retailer_products rp WHERE rp.canonical_product_id=competitor.id AND rp.rating IS NOT NULL) competitor_rating,
      (SELECT SUM(COALESCE(rp.review_count,0)) FROM retailer_products rp WHERE rp.canonical_product_id=competitor.id) competitor_review_count,
      (SELECT COUNT(DISTINCT rp.retailer) FROM retailer_products rp WHERE rp.canonical_product_id=competitor.id) retailer_count
    FROM competitor_relationships cr
    JOIN canonical_products source ON source.id=cr.source_product_id
    JOIN brands sb ON sb.id=source.brand_id
    JOIN canonical_products competitor ON competitor.id=cr.competitor_product_id
    JOIN brands cb ON cb.id=competitor.brand_id
    ${where.length?`WHERE ${where.join(" AND ")}`:""}
    ORDER BY sb.name,source.title,cr.score DESC LIMIT 1000
  `,params);

  return rows.map(r=>{
    const sourcePrice=num(r.source_price);
    const competitorPrice=num(r.competitor_price);
    const sourceQuantity=num(r.source_quantity);
    const competitorQuantity=num(r.competitor_quantity);
    const compatible=!!r.source_unit&&r.source_unit===r.competitor_unit;
    return {
      ...r,
      source_price:sourcePrice,
      competitor_price:competitorPrice,
      competitor_rating:num(r.competitor_rating),
      competitor_review_count:Number(r.competitor_review_count??0),
      retailer_count:Number(r.retailer_count??0),
      source_unit_price:compatible?unitPrice(sourcePrice,sourceQuantity,r.source_unit):null,
      competitor_unit_price:compatible?unitPrice(competitorPrice,competitorQuantity,r.competitor_unit):null,
      units_compatible:compatible,
    };
  });
}
