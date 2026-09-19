import { randomUUID } from "node:crypto";
import type { Database } from "@/lib/db/types";

export class IdentityService {
  constructor(private db:Database){}

  async merge(targetId:string,sourceId:string){
    if(targetId===sourceId)throw new Error("Source and target must be different products");
    await this.db.query("BEGIN");
    try{
      const target=(await this.db.query<any>("SELECT * FROM canonical_products WHERE id=$1 LIMIT 1",[targetId])).rows[0];
      const source=(await this.db.query<any>("SELECT * FROM canonical_products WHERE id=$1 LIMIT 1",[sourceId])).rows[0];
      if(!target||!source)throw new Error("Canonical product not found");

      await this.db.query(`UPDATE canonical_products SET
        title=COALESCE(title,$2),normalized_title=COALESCE(normalized_title,$3),category=COALESCE(category,$4),subcategory=COALESCE(subcategory,$5),
        product_type=COALESCE(product_type,$6),functional_category=COALESCE(functional_category,$7),target_use=COALESCE(target_use,$8),
        formulation=COALESCE(formulation,$9),active_ingredient=COALESCE(active_ingredient,$10),coverage=COALESCE(coverage,$11),
        application_method=COALESCE(application_method,$12),indoor_outdoor=COALESCE(indoor_outdoor,$13),refill_sprayer_type=COALESCE(refill_sprayer_type,$14),
        model_number=COALESCE(model_number,$15),mpn=COALESCE(mpn,$16),upc=COALESCE(upc,$17),gtin=COALESCE(gtin,$18),ean=COALESCE(ean,$19),
        size_text=COALESCE(size_text,$20),normalized_quantity=COALESCE(normalized_quantity,$21),normalized_unit=COALESCE(normalized_unit,$22),
        pack_quantity=COALESCE(pack_quantity,$23),description=COALESCE(description,$24),images_json=COALESCE(images_json,$25),attributes_json=COALESCE(attributes_json,$26),
        updated_at=CURRENT_TIMESTAMP WHERE id=$1`,[
          targetId,source.title,source.normalized_title,source.category,source.subcategory,source.product_type,source.functional_category,source.target_use,
          source.formulation,source.active_ingredient,source.coverage,source.application_method,source.indoor_outdoor,source.refill_sprayer_type,
          source.model_number,source.mpn,source.upc,source.gtin,source.ean,source.size_text,source.normalized_quantity,source.normalized_unit,
          source.pack_quantity,source.description,source.images_json,source.attributes_json
        ]);

      await this.db.query("UPDATE retailer_products SET canonical_product_id=$1 WHERE canonical_product_id=$2",[targetId,sourceId]);
      await this.db.query("UPDATE historical_snapshots SET canonical_product_id=$1 WHERE canonical_product_id=$2",[targetId,sourceId]);

      const rels=(await this.db.query<any>(`
        SELECT * FROM competitor_relationships
        WHERE source_product_id IN ($1,$2) OR competitor_product_id IN ($1,$2)
      `,[targetId,sourceId])).rows;
      await this.db.query(`DELETE FROM competitor_relationships
        WHERE source_product_id IN ($1,$2) OR competitor_product_id IN ($1,$2)`,[targetId,sourceId]);

      const deduped=new Map<string,any>();
      for(const rel of rels){
        const s=rel.source_product_id===sourceId?targetId:rel.source_product_id;
        const c=rel.competitor_product_id===sourceId?targetId:rel.competitor_product_id;
        if(s===c)continue;
        const key=`${s}:${c}`;
        const existing=deduped.get(key);
        if(!existing||Number(rel.score??0)>Number(existing.score??0))deduped.set(key,{...rel,source_product_id:s,competitor_product_id:c});
      }
      for(const rel of deduped.values()){
        await this.db.query(`INSERT INTO competitor_relationships(source_product_id,competitor_product_id,label,score,rationale_json,updated_at)
          VALUES($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)
          ON CONFLICT(source_product_id,competitor_product_id) DO UPDATE SET
          label=excluded.label,score=excluded.score,rationale_json=excluded.rationale_json,updated_at=CURRENT_TIMESTAMP`,
          [rel.source_product_id,rel.competitor_product_id,rel.label,rel.score,rel.rationale_json]);
      }

      await this.db.query("DELETE FROM canonical_products WHERE id=$1",[sourceId]);
      await this.audit("merge",targetId,[sourceId],[],{targetId});
      await this.db.query("COMMIT");
      return {targetId,mergedSourceId:sourceId};
    }catch(error){
      await this.db.query("ROLLBACK");
      throw error;
    }
  }

  async split(sourceId:string,listingIds:string[],title?:string){
    if(!listingIds.length)throw new Error("Select at least one retailer listing");
    await this.db.query("BEGIN");
    try{
      const source=(await this.db.query<any>("SELECT * FROM canonical_products WHERE id=$1 LIMIT 1",[sourceId])).rows[0];
      if(!source)throw new Error("Canonical product not found");

      const placeholders=listingIds.map((_,i)=>`$${i+2}`).join(",");
      const listings=(await this.db.query<any>(
        `SELECT * FROM retailer_products WHERE canonical_product_id=$1 AND id IN (${placeholders})`,
        [sourceId,...listingIds]
      )).rows;
      if(listings.length!==listingIds.length)throw new Error("One or more listings do not belong to this product");

      const id=randomUUID();
      const nextTitle=title?.trim()||listings[0]?.title||source.title;
      await this.db.query(`INSERT INTO canonical_products(
        id,brand_id,title,normalized_title,category,subcategory,product_type,functional_category,target_use,formulation,active_ingredient,coverage,application_method,indoor_outdoor,refill_sprayer_type,
        model_number,mpn,upc,gtin,ean,size_text,normalized_quantity,normalized_unit,pack_quantity,description,images_json,attributes_json,created_at,updated_at
      ) SELECT $1,brand_id,$2,normalized_title,category,subcategory,product_type,functional_category,target_use,formulation,active_ingredient,coverage,application_method,indoor_outdoor,refill_sprayer_type,
        model_number,mpn,upc,gtin,ean,size_text,normalized_quantity,normalized_unit,pack_quantity,description,images_json,attributes_json,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
        FROM canonical_products WHERE id=$3`,[id,nextTitle,sourceId]);

      const movePlaceholders=listingIds.map((_,i)=>`$${i+2}`).join(",");
      await this.db.query(`UPDATE retailer_products SET canonical_product_id=$1 WHERE id IN (${movePlaceholders})`,[id,...listingIds]);

      const retailerProductIds=listings.map((x:any)=>x.retailer_product_id);
      if(retailerProductIds.length){
        const snapPlaceholders=retailerProductIds.map((_,i)=>`$${i+3}`).join(",");
        await this.db.query(`UPDATE historical_snapshots SET canonical_product_id=$1
          WHERE canonical_product_id=$2 AND retailer_product_id IN (${snapPlaceholders})`,
          [id,sourceId,...retailerProductIds]);
      }

      await this.audit("split",id,[sourceId],listingIds,{title:nextTitle});
      await this.db.query("COMMIT");
      return {sourceId,newProductId:id};
    }catch(error){
      await this.db.query("ROLLBACK");
      throw error;
    }
  }

  private async audit(eventType:string,targetProductId:string,sourceProductIds:string[],listingIds:string[],metadata:unknown){
    await this.db.query(`INSERT INTO canonical_product_events(id,event_type,target_product_id,source_product_ids_json,retailer_listing_ids_json,metadata_json)
      VALUES($1,$2,$3,$4,$5,$6)`,[
      randomUUID(),eventType,targetProductId,JSON.stringify(sourceProductIds),JSON.stringify(listingIds),JSON.stringify(metadata)
    ]);
  }
}
