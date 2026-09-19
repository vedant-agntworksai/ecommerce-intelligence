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
    const attributes={functionalCategory:p.functionalCategory,activeIngredient:p.activeIngredient,coverage:p.coverage,applicationMethod:p.applicationMethod,indoorOutdoor:p.indoorOutdoor,refillSprayerType:p.refillSprayerType};
    await this.db.query(`INSERT INTO canonical_products(
      id,brand_id,title,normalized_title,category,subcategory,product_type,functional_category,target_use,formulation,active_ingredient,coverage,application_method,indoor_outdoor,refill_sprayer_type,
      model_number,mpn,upc,gtin,ean,size_text,normalized_quantity,normalized_unit,pack_quantity,description,images_json,attributes_json
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,[
      id,brand.id,p.title??p.productId,normalizeText(p.title),p.category,p.subcategory,p.productType,p.functionalCategory,p.targetUse,p.formulation,p.activeIngredient,p.coverage,p.applicationMethod,p.indoorOutdoor,p.refillSprayerType,
      p.modelNumber,p.mpn,p.upc,p.gtin,p.ean,p.sizeText,p.normalizedQuantity,p.normalizedUnit,p.packQuantity,p.description,JSON.stringify(p.images),JSON.stringify(attributes)
    ]);
    const product:CanonicalProduct={id,brandId:brand.id,brand:brand.name,title:p.title??p.productId,category:p.category,subcategory:p.subcategory,productType:p.productType,functionalCategory:p.functionalCategory,targetUse:p.targetUse,formulation:p.formulation,activeIngredient:p.activeIngredient,coverage:p.coverage,applicationMethod:p.applicationMethod,indoorOutdoor:p.indoorOutdoor,refillSprayerType:p.refillSprayerType,modelNumber:p.modelNumber,mpn:p.mpn,upc:p.upc,gtin:p.gtin,ean:p.ean,sizeText:p.sizeText,normalizedQuantity:p.normalizedQuantity,normalizedUnit:p.normalizedUnit,packQuantity:p.packQuantity};
    return{product,created:true,reason:"no sufficiently confident existing canonical match"};
  }
  async getById(id:string){const {rows}=await this.db.query<any>("SELECT cp.*, b.name brand FROM canonical_products cp JOIN brands b ON b.id=cp.brand_id WHERE cp.id=$1",[id]);return rows[0]?this.map(rows[0]):null;}
  async competitorCandidates(source:CanonicalProduct,limit=50){
    const key=source.functionalCategory??source.productType??source.subcategory??source.category??"";
    if(!key)return[];
    const {rows}=await this.db.query<any>(`SELECT cp.*,b.name brand FROM canonical_products cp JOIN brands b ON b.id=cp.brand_id
      WHERE cp.brand_id<>$1 AND LOWER(COALESCE(cp.functional_category,cp.product_type,cp.subcategory,cp.category,''))=LOWER($2) LIMIT $3`,[source.brandId,key,limit]);
    return rows.map(this.map);
  }
  private map=(r:any):CanonicalProduct=>({
    id:r.id,brandId:r.brand_id,brand:r.brand,title:r.title,category:r.category,subcategory:r.subcategory,productType:r.product_type,functionalCategory:r.functional_category,targetUse:r.target_use,formulation:r.formulation,
    activeIngredient:r.active_ingredient,coverage:r.coverage,applicationMethod:r.application_method,indoorOutdoor:r.indoor_outdoor,refillSprayerType:r.refill_sprayer_type,
    modelNumber:r.model_number,mpn:r.mpn,upc:r.upc,gtin:r.gtin,ean:r.ean,sizeText:r.size_text,normalizedQuantity:r.normalized_quantity==null?null:Number(r.normalized_quantity),normalizedUnit:r.normalized_unit,packQuantity:r.pack_quantity==null?null:Number(r.pack_quantity)
  });
}
