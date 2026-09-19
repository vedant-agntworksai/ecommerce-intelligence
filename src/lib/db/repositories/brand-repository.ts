import { randomUUID } from "node:crypto";
import type { Database } from "../types";
const slugify=(x:string)=>x.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export class BrandRepository{
  constructor(private db:Database){}
  async getOrCreate(name:string){
    const slug=slugify(name);
    let {rows}=await this.db.query<any>("SELECT * FROM brands WHERE slug=$1 LIMIT 1",[slug]);
    if(rows[0])return rows[0];
    const id=randomUUID();await this.db.query("INSERT INTO brands(id,name,slug) VALUES($1,$2,$3)",[id,name.trim(),slug]);
    rows=(await this.db.query<any>("SELECT * FROM brands WHERE id=$1",[id])).rows;return rows[0];
  }
  async list(){
    return (await this.db.query<any>(`
      SELECT b.*,
        (SELECT COUNT(*) FROM canonical_products cp WHERE cp.brand_id=b.id) unique_products,
        (SELECT COUNT(*) FROM retailer_products rp JOIN canonical_products cp ON cp.id=rp.canonical_product_id WHERE cp.brand_id=b.id) retailer_listings,
        (SELECT COUNT(DISTINCT rp.retailer) FROM retailer_products rp JOIN canonical_products cp ON cp.id=rp.canonical_product_id WHERE cp.brand_id=b.id) retailers,
        (SELECT COUNT(*) FROM reviews rv JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id JOIN canonical_products cp ON cp.id=rp.canonical_product_id WHERE cp.brand_id=b.id) reviews,
        (SELECT AVG(rv.rating) FROM reviews rv JOIN retailer_products rp ON rp.retailer=rv.retailer AND rp.retailer_product_id=rv.retailer_product_id JOIN canonical_products cp ON cp.id=rp.canonical_product_id WHERE cp.brand_id=b.id AND rv.rating IS NOT NULL) average_rating,
        (SELECT COUNT(DISTINCT cr.competitor_product_id) FROM competitor_relationships cr JOIN canonical_products cp ON cp.id=cr.source_product_id WHERE cp.brand_id=b.id) competitors,
        (SELECT MAX(rp.last_scraped) FROM retailer_products rp JOIN canonical_products cp ON cp.id=rp.canonical_product_id WHERE cp.brand_id=b.id) last_updated
      FROM brands b ORDER BY b.name
    `)).rows;
  }
}
