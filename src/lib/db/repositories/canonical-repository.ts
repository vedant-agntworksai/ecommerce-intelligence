import { randomUUID } from "node:crypto";
import type { Database } from "../types";
import type { CanonicalProduct, NormalizedRetailerProduct } from "@/lib/domain";
import { matchCanonical } from "@/lib/matching/canonical";
import { normalizeText } from "@/lib/matching/normalization";

export class CanonicalRepository {
  constructor(private db:Database){}
  async candidates(brandId:string){
    const {rows}=await this.db.query<any>("SELECT cp.*, b.name brand FROM canonical_products cp JOIN brands b ON b.id=cp.brand_id WHERE cp.brand_id=$1",[brandId]);
    return rows.map(this.map);
  }
  async getOrCreate(brand:{id:string;name:string},p:NormalizedRetailerProduct):Promise<{product:CanonicalProduct;created:boolean;reason:string}>{
    const candidates=await this.candidates(brand.id);
    const hit=matchCanonical(p,candidates);
    if(hit)return{product:hit.product,created:false,reason:hit.reason};
    const id=randomUUID();
    await this.db.query(`INSERT INTO canonical_products(id,brand_id,title,normalized_title,category,subcategory,product_type,target_use,formulation,model_number,mpn,upc,gtin,ean,size_text,normalized_quantity,normalized_unit,pack_quantity,description,images_json)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [id,brand.id,p.title??p.productId,normalizeText(p.title),p.category,p.subcategory,p.productType,p.targetUse,p.formulation,p.modelNumber,p.mpn,p.upc,p.gtin,p.ean,p.sizeText,p.normalizedQuantity,p.normalizedUnit,p.packQuantity,p.description,JSON.stringify(p.images)]);
    const product:CanonicalProduct={id,brandId:brand.id,brand:brand.name,title:p.title??p.productId,category:p.category,subcategory:p.subcategory,productType:p.productType,targetUse:p.targetUse,formulation:p.formulation,modelNumber:p.modelNumber,mpn:p.mpn,upc:p.upc,gtin:p.gtin,ean:p.ean,sizeText:p.sizeText,normalizedQuantity:p.normalizedQuantity,normalizedUnit:p.normalizedUnit,packQuantity:p.packQuantity};
    return{product,created:true,reason:"no sufficiently confident existing canonical match"};
  }
  async getById(id:string){const {rows}=await this.db.query<any>("SELECT cp.*, b.name brand FROM canonical_products cp JOIN brands b ON b.id=cp.brand_id WHERE cp.id=$1",[id]);return rows[0]?this.map(rows[0]):null;}
  async competitorCandidates(source:CanonicalProduct,limit=50){const {rows}=await this.db.query<any>("SELECT cp.*, b.name brand FROM canonical_products cp JOIN brands b ON b.id=cp.brand_id WHERE cp.brand_id<>$1 AND cp.product_type=$2 LIMIT $3",[source.brandId,source.productType??"",limit]);return rows.map(this.map);}
  private map=(r:any):CanonicalProduct=>({id:r.id,brandId:r.brand_id,brand:r.brand,title:r.title,category:r.category,subcategory:r.subcategory,productType:r.product_type,targetUse:r.target_use,formulation:r.formulation,modelNumber:r.model_number,mpn:r.mpn,upc:r.upc,gtin:r.gtin,ean:r.ean,sizeText:r.size_text,normalizedQuantity:r.normalized_quantity==null?null:Number(r.normalized_quantity),normalizedUnit:r.normalized_unit,packQuantity:r.pack_quantity==null?null:Number(r.pack_quantity)});
}
