import { randomUUID } from "node:crypto"; import type { Database } from "../types";
const slugify=(x:string)=>x.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export class BrandRepository{
 constructor(private db:Database){}
 async getOrCreate(name:string){const slug=slugify(name);let {rows}=await this.db.query<any>("SELECT * FROM brands WHERE slug=$1 LIMIT 1",[slug]);if(rows[0])return rows[0];const id=randomUUID();await this.db.query("INSERT INTO brands(id,name,slug) VALUES($1,$2,$3)",[id,name.trim(),slug]);rows=(await this.db.query<any>("SELECT * FROM brands WHERE id=$1",[id])).rows;return rows[0];}
 async list(){return (await this.db.query<any>(`SELECT b.*, COUNT(DISTINCT cp.id) unique_products, COUNT(DISTINCT rp.retailer || ':' || rp.retailer_product_id) retailer_listings,
 COUNT(DISTINCT rp.retailer) retailers, COUNT(r.review_id) reviews, AVG(r.rating) average_rating
 FROM brands b LEFT JOIN canonical_products cp ON cp.brand_id=b.id LEFT JOIN retailer_products rp ON rp.canonical_product_id=cp.id
 LEFT JOIN reviews r ON r.retailer=rp.retailer AND r.retailer_product_id=rp.retailer_product_id GROUP BY b.id,b.name,b.slug,b.created_at,b.updated_at ORDER BY b.name`)).rows;}
}
