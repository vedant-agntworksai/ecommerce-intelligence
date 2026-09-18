import { randomUUID } from "node:crypto";
import type { Database } from "../types";
import type { NormalizedRetailerProduct } from "@/lib/domain";
export class ProductRepository {
  constructor(private db: Database) {}
  async findRetailerProduct(retailer:string, retailerProductId:string) {
    const {rows}=await this.db.query<any>("SELECT * FROM retailer_products WHERE retailer=$1 AND retailer_product_id=$2 LIMIT 1",[retailer,retailerProductId]);
    return rows[0]??null;
  }
  async upsertRetailerProduct(p:NormalizedRetailerProduct, canonicalProductId:string|null) {
    await this.db.query(
      `INSERT INTO retailer_products(id,canonical_product_id,retailer,retailer_product_id,retailer_sku,asin,product_url,canonical_url,title,price,original_price,currency,availability,seller,fulfilled_by,rating,review_count,upc,gtin,ean,model_number,mpn,raw_json,last_scraped,first_seen)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
       ON CONFLICT(retailer,retailer_product_id) DO UPDATE SET
       canonical_product_id=COALESCE(excluded.canonical_product_id,retailer_products.canonical_product_id),title=excluded.title,price=excluded.price,
       original_price=excluded.original_price,currency=excluded.currency,availability=excluded.availability,seller=excluded.seller,fulfilled_by=excluded.fulfilled_by,
       rating=excluded.rating,review_count=excluded.review_count,upc=excluded.upc,gtin=excluded.gtin,ean=excluded.ean,model_number=excluded.model_number,
       mpn=excluded.mpn,raw_json=excluded.raw_json,last_scraped=CURRENT_TIMESTAMP`,
      [randomUUID(),canonicalProductId,p.retailer,p.productId,p.retailerSku,p.asin,p.productUrl,p.canonicalUrl,p.title,p.price,p.originalPrice,p.currency,p.availability,p.seller,p.fulfilledBy,p.rating,p.reviewCount,p.upc,p.gtin,p.ean,p.modelNumber,p.mpn,JSON.stringify(p.raw??p)]
    );
  }
}
