import { NextResponse } from "next/server"; import { z } from "zod"; import { getDb } from "@/lib/db"; import { JobRepository } from "@/lib/db/repositories/job-repository"; import { detectRetailer } from "@/lib/retailers";
const schema=z.object({brand:z.string().min(1),startUrl:z.string().url(),retailer:z.enum(["auto","amazon","walmart","lowes","homedepot"]).default("auto"),
 discoverProducts:z.boolean().default(true),collectPdp:z.boolean().default(true),matchCanonical:z.boolean().default(true),findCompetitors:z.boolean().default(true),
 collectProductReviews:z.boolean().default(false),collectCompetitorReviews:z.boolean().default(false),maximumProducts:z.number().int().positive().nullable().default(null),
 maximumReviewsPerProduct:z.number().int().positive().max(5000).default(500),competitorsPerProduct:z.number().int().min(1).max(10).default(3),forceRefresh:z.boolean().default(false)});
export async function POST(req:Request){const input=schema.parse(await req.json());const retailer=input.retailer==="auto"?detectRetailer(input.startUrl):input.retailer;const db=await getDb();const id=await new JobRepository(db).enqueue("scrape",{...input,retailer});return NextResponse.json({id,status:"queued"},{status:202});}
export async function GET(){const db=await getDb();return NextResponse.json(await new JobRepository(db).recent());}
