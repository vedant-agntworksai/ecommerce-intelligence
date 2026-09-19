import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { buildCsvExport,EXPORT_KINDS,type ExportKind } from "@/lib/exports/service";

export async function GET(_req:Request,{params}:{params:Promise<{kind:string}>}){
  const {kind}=await params;
  if(!EXPORT_KINDS.includes(kind as ExportKind))return NextResponse.json({error:"Unsupported export kind"},{status:404});
  const csv=await buildCsvExport(await getDb(),kind as ExportKind);
  const stamp=new Date().toISOString().slice(0,10);
  return new Response(csv,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="ecommerce-${kind}-${stamp}.csv"`,"cache-control":"no-store"}});
}
