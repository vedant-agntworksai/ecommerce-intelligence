import Link from "next/link";
import { getDb } from "@/lib/db";
import { listCanonicalProducts } from "@/lib/analytics";
import { ProductCard } from "@/components/product-card";
import { ProductFilterForm } from "@/components/product-filter-form";
export const dynamic="force-dynamic";
function bool(v:string|undefined){return v==="yes"?true:v==="no"?false:undefined;}
function num(v:string|undefined){return v&&Number.isFinite(Number(v))?Number(v):undefined;}
function query(q:Record<string,string|undefined>,page:number){const p=new URLSearchParams();for(const [k,v] of Object.entries(q))if(v&&k!=="page")p.set(k,v);if(page>1)p.set("page",String(page));return `?${p.toString()}`;}
export default async function Products({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const q=await searchParams;const page=Math.max(1,Number(q.page)||1);const pageSize=60;
  const products=await listCanonicalProducts(await getDb(),{search:q.search,category:q.category,retailer:q.retailer,minPrice:num(q.minPrice),maxPrice:num(q.maxPrice),minRating:num(q.minRating),minReviews:num(q.minReviews),availability:q.availability,hasUpc:bool(q.hasUpc),hasGtin:bool(q.hasGtin),hasModel:bool(q.hasModel),retailerCount:num(q.retailerCount)},pageSize,(page-1)*pageSize);
  return <div className="p-8"><p className="text-sm text-cyan-400">Products</p><h2 className="mt-1 text-3xl font-semibold">Canonical product catalog</h2><p className="muted mt-2">One product identity can contain Amazon, Walmart, Lowe&apos;s, and Home Depot listings.</p>
    <ProductFilterForm q={q}/>
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{products.map((p:any)=><ProductCard key={p.id} product={p}/>)}</div>
    {!products.length&&<div className="card mt-6 p-10 text-center text-slate-500">No canonical products match these filters.</div>}
    <div className="mt-6 flex justify-between">{page>1?<Link href={query(q,page-1)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm">← Previous</Link>:<span/>}{products.length===pageSize&&<Link href={query(q,page+1)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm">Next →</Link>}</div>
  </div>;
}
