import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { JobRepository } from "@/lib/db/repositories/job-repository";
import { detectRetailer } from "@/lib/retailers";
import { enqueueScrape } from "@/lib/jobs/queue";

const schema=z.object({
  brand:z.string().trim().min(1),startUrl:z.string().url(),retailer:z.enum(["auto","amazon","walmart","lowes","homedepot"]).default("auto"),
  discoverProducts:z.boolean().default(true),collectPdp:z.boolean().default(true),matchCanonical:z.boolean().default(true),findCompetitors:z.boolean().default(true),
  collectProductReviews:z.boolean().default(false),collectCompetitorReviews:z.boolean().default(false),maximumProducts:z.number().int().positive().nullable().default(null),
  maximumReviewsPerProduct:z.number().int().positive().max(5000).default(500),competitorsPerProduct:z.union([z.literal(1),z.literal(3),z.literal(5),z.literal(10)]).default(3),forceRefresh:z.boolean().default(false),
});

export async function POST(req:Request){
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:400});
  const input=parsed.data;
  const retailer=input.retailer==="auto"?detectRetailer(input.startUrl):input.retailer;
  const id=await enqueueScrape({...input,retailer});
  return NextResponse.json({id,status:"queued"},{status:202});
}
export async function GET(){
  const db=await getDb();
  return NextResponse.json(await new JobRepository(db).recent());
}
