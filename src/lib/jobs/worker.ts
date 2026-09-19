import { getDb } from "@/lib/db";
import { JobRepository } from "@/lib/db/repositories/job-repository";
import { processScrapeJob } from "./processor";

const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));

async function main(){
  const db=await getDb();
  const jobs=new JobRepository(db);
  let lastRecovery=0;
  console.log("worker started");

  for(;;){
    if(Date.now()-lastRecovery>60_000){
      await jobs.recoverStale(30);
      lastRecovery=Date.now();
    }
    const job=await jobs.claimNext();
    if(!job){await sleep(2000);continue;}
    try{
      const payload=JSON.parse(job.payload_json);
      const result=job.type==="scrape"?await processScrapeJob(payload):{skipped:true,reason:"unknown job type"};
      await jobs.complete(job.id,result);
    }catch(e){
      console.error("job failed",job.id,e);
      await jobs.fail(job.id,e);
    }
  }
}
main().catch(e=>{console.error(e);process.exit(1);});
