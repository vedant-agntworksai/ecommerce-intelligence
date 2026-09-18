import { randomUUID } from "node:crypto"; import type { Database } from "../types";
export type JobStatus="queued"|"running"|"completed"|"failed";
export class JobRepository{
 constructor(private db:Database){}
 async enqueue(type:string,payload:unknown){const id=randomUUID();await this.db.query("INSERT INTO jobs(id,type,status,payload_json) VALUES($1,$2,'queued',$3)",[id,type,JSON.stringify(payload)]);return id;}
 async claimNext(){const {rows}=await this.db.query<any>("SELECT * FROM jobs WHERE status='queued' ORDER BY created_at ASC LIMIT 1");const job=rows[0];if(!job)return null;await this.db.query("UPDATE jobs SET status='running',started_at=CURRENT_TIMESTAMP WHERE id=$1 AND status='queued'",[job.id]);return job;}
 async complete(id:string,result:unknown){await this.db.query("UPDATE jobs SET status='completed',result_json=$2,finished_at=CURRENT_TIMESTAMP WHERE id=$1",[id,JSON.stringify(result)]);}
 async fail(id:string,error:unknown){await this.db.query("UPDATE jobs SET status='failed',error=$2,finished_at=CURRENT_TIMESTAMP WHERE id=$1",[id,error instanceof Error?error.message:String(error)]);}
 async recent(limit=25){return (await this.db.query<any>("SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1",[limit])).rows;}
}
