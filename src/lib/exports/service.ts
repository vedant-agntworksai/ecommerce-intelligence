import type { Database } from "@/lib/db/types";

export const EXPORT_KINDS=["products","retailer-listings","reviews","competitors","snapshots"] as const;
export type ExportKind=(typeof EXPORT_KINDS)[number];

const queries:Record<ExportKind,string>={
  products:`SELECT cp.id,b.name brand,cp.title,cp.category,cp.subcategory,cp.product_type,cp.target_use,cp.formulation,cp.model_number,cp.mpn,cp.upc,cp.gtin,cp.ean,cp.size_text,cp.normalized_quantity,cp.normalized_unit,cp.pack_quantity,cp.created_at,cp.updated_at
    FROM canonical_products cp JOIN brands b ON b.id=cp.brand_id ORDER BY b.name,cp.title`,
  "retailer-listings":`SELECT rp.id,rp.canonical_product_id,rp.retailer,rp.retailer_product_id,rp.retailer_sku,rp.asin,rp.product_url,rp.canonical_url,rp.title,rp.price,rp.original_price,rp.currency,rp.availability,rp.seller,rp.fulfilled_by,rp.rating,rp.review_count,rp.upc,rp.gtin,rp.ean,rp.model_number,rp.mpn,rp.first_seen,rp.last_scraped FROM retailer_products rp ORDER BY rp.retailer,rp.title`,
  reviews:`SELECT retailer,retailer_product_id,review_id,rating,title,review_text,reviewer_name,verified_purchase,review_date,helpful_votes,variant,scraped_at FROM reviews ORDER BY retailer,retailer_product_id,review_date DESC`,
  competitors:`SELECT cr.source_product_id,sb.name source_brand,sp.title source_product,cr.competitor_product_id,cb.name competitor_brand,cp.title competitor_product,cr.label,cr.updated_at
    FROM competitor_relationships cr JOIN canonical_products sp ON sp.id=cr.source_product_id JOIN brands sb ON sb.id=sp.brand_id JOIN canonical_products cp ON cp.id=cr.competitor_product_id JOIN brands cb ON cb.id=cp.brand_id ORDER BY sb.name,sp.title,cr.score DESC`,
  snapshots:`SELECT id,canonical_product_id,retailer_product_id,price,rating,review_count,availability,captured_at FROM historical_snapshots ORDER BY captured_at DESC`,
};

export async function buildCsvExport(db:Database,kind:ExportKind){
  const {rows}=await db.query<Record<string,unknown>>(queries[kind]);
  return toCsv(rows);
}

function toCsv(rows:Record<string,unknown>[]){
  if(!rows.length)return "";
  const columns=Object.keys(rows[0]);
  return [columns.map(csvCell).join(","),...rows.map(row=>columns.map(c=>csvCell(row[c])).join(","))].join("\n");
}
function csvCell(value:unknown){
  if(value==null)return "";
  const text=typeof value==="object"?JSON.stringify(value):String(value);
  return /[",\n\r]/.test(text)?`"${text.replaceAll('"','""')}"`:text;
}
