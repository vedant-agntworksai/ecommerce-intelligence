import type { Database } from "../types";
export class CompetitorRepository{
 constructor(private db:Database){}
 async replace(sourceProductId:string,rows:{id:string;score:number;label:string;rationale:unknown}[]){for(const r of rows)await this.db.query(`INSERT INTO competitor_relationships(source_product_id,competitor_product_id,label,score,rationale_json,updated_at)
 VALUES($1,$2,$3,$4,$5,CURRENT_TIMESTAMP) ON CONFLICT(source_product_id,competitor_product_id) DO UPDATE SET label=excluded.label,score=excluded.score,rationale_json=excluded.rationale_json,updated_at=CURRENT_TIMESTAMP`,
 [sourceProductId,r.id,r.label,r.score,JSON.stringify(r.rationale)]);}
 async forProduct(id:string){return (await this.db.query<any>("SELECT * FROM competitor_relationships WHERE source_product_id=$1 ORDER BY score DESC",[id])).rows;}
}
