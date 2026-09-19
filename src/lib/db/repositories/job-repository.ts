import { createHash,randomUUID } from "node:crypto";
import type { Database } from "../types";

export type JobStatus="queued"|"running"|"completed"|"failed";

export class JobRepository{
  constructor(private db:Database){}

  async enqueue(type:string,payload:unknown){
    const payloadJson=JSON.stringify(payload);
    const dedupeKey=createHash("sha256").update(type+"\n"+payloadJson).digest("hex");
    const existing=(await this.db.query<any>(
      "SELECT id FROM jobs WHERE type=$1 AND payload_json=$2 AND status IN ('queued','running') ORDER BY created_at DESC LIMIT 1",
      [type,payloadJson]
    )).rows[0];
    if(existing)return existing.id as string;

    const id=randomUUID();
    await this.db.query(
      "INSERT INTO jobs(id,type,status,payload_json,result_json) VALUES($1,$2,'queued',$3,$4)",
      [id,type,payloadJson,JSON.stringify({dedupeKey})]
    );
    return id;
  }

  async claimNext(){
    const candidate=(await this.db.query<any>(
      "SELECT id FROM jobs WHERE status='queued' AND COALESCE(attempts,0)<COALESCE(max_attempts,3) ORDER BY created_at ASC LIMIT 1"
    )).rows[0];
    if(!candidate)return null;

    const token=randomUUID();
    await this.db.query(
      "UPDATE jobs SET status='running',started_at=CURRENT_TIMESTAMP,worker_token=$2,attempts=COALESCE(attempts,0)+1 WHERE id=$1 AND status='queued'",
      [candidate.id,token]
    );
    const {rows}=await this.db.query<any>(
      "SELECT * FROM jobs WHERE id=$1 AND status='running' AND worker_token=$2 LIMIT 1",
      [candidate.id,token]
    );
    return rows[0]??null;
  }

  async complete(id:string,result:unknown){
    await this.db.query(
      "UPDATE jobs SET status='completed',result_json=$2,finished_at=CURRENT_TIMESTAMP,worker_token=NULL WHERE id=$1",
      [id,JSON.stringify(result)]
    );
  }

  async fail(id:string,error:unknown){
    const row=(await this.db.query<any>("SELECT attempts,max_attempts FROM jobs WHERE id=$1 LIMIT 1",[id])).rows[0];
    const message=error instanceof Error?error.message:String(error);
    if(row&&Number(row.attempts??0)<Number(row.max_attempts??3)){
      await this.db.query(
        "UPDATE jobs SET status='queued',error=$2,started_at=NULL,worker_token=NULL WHERE id=$1",
        [id,message]
      );
    }else{
      await this.db.query(
        "UPDATE jobs SET status='failed',error=$2,finished_at=CURRENT_TIMESTAMP,worker_token=NULL WHERE id=$1",
        [id,message]
      );
    }
  }

  async recoverStale(minutes=30){
    await this.db.query(
      `UPDATE jobs SET status='queued',worker_token=NULL,started_at=NULL,error='Recovered stale worker lease'
       WHERE status='running' AND started_at < CURRENT_TIMESTAMP - INTERVAL '${Math.max(1,Math.floor(minutes))} minutes'`
    );
  }

  async recent(limit=25){
    return (await this.db.query<any>("SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1",[limit])).rows;
  }
}
