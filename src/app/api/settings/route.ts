import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { SettingsRepository } from "@/lib/db/repositories/settings-repository";
import { DEFAULT_TTLS_MS } from "@/lib/cache/policy";

const ttlKeys=Object.keys(DEFAULT_TTLS_MS) as [keyof typeof DEFAULT_TTLS_MS,...(keyof typeof DEFAULT_TTLS_MS)[]];
const ttlShape=Object.fromEntries(ttlKeys.map(k=>[k,z.number().int().positive().max(365*24*60*60*1000)])) as Record<(typeof ttlKeys)[number],z.ZodNumber>;
const schema=z.object({
  ttlMs:z.object(ttlShape),
  competitorSizeTolerance:z.number().min(0).max(2),
  competitorWeights:z.object({
    functionalCategory:z.number().min(0).max(1),
    formulation:z.number().min(0).max(1),
    size:z.number().min(0).max(1),
    targetUse:z.number().min(0).max(1),
    activeIngredient:z.number().min(0).max(1),
    coverage:z.number().min(0).max(1),
    price:z.number().min(0).max(1),
    retailerAvailability:z.number().min(0).max(1),
  }).refine(v=>Math.abs(Object.values(v).reduce((a,b)=>a+b,0)-1)<0.001,{message:"Competitor weights must sum to 1"}),
  defaultCompetitors:z.union([z.literal(1),z.literal(3),z.literal(5),z.literal(10)]),
  defaultMaxReviews:z.number().int().min(1).max(5000),
});

export async function GET(){
  const repo=new SettingsRepository(await getDb());
  return NextResponse.json(await repo.get());
}

export async function PUT(req:Request){
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:400});
  const repo=new SettingsRepository(await getDb());
  await repo.save(parsed.data);
  return NextResponse.json(parsed.data);
}
