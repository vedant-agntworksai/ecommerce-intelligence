import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { IdentityService } from "@/lib/matching/identity-service";

const schema=z.discriminatedUnion("action",[
  z.object({action:z.literal("merge"),sourceProductId:z.string().uuid()}),
  z.object({action:z.literal("split"),listingIds:z.array(z.string().uuid()).min(1),title:z.string().trim().max(500).optional()}),
]);

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:400});
  const service=new IdentityService(await getDb());
  try{
    const result=parsed.data.action==="merge"
      ?await service.merge(id,parsed.data.sourceProductId)
      :await service.split(id,parsed.data.listingIds,parsed.data.title);
    return NextResponse.json(result);
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:400});
  }
}
