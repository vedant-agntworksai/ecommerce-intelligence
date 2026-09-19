import Link from "next/link";
import { getDb } from "@/lib/db";
import { BrandRepository } from "@/lib/db/repositories/brand-repository";
import { formatDate,formatNumber } from "@/lib/format";
export const dynamic="force-dynamic";
export default async function Brands(){
  const rows=await new BrandRepository(await getDb()).list();
  return <div className="p-8"><h2 className="text-3xl font-semibold">Brands</h2><p className="muted mt-2 mb-6">Permanent brand entities discovered or created through scrape jobs.</p>
    <div className="card overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead className="bg-slate-900 text-slate-400"><tr>{["Brand","Unique Products","Retailer Listings","Retailers","Reviews","Average Rating","Competitors","Last Updated"].map(h=><th key={h} className="text-left px-4 py-3">{h}</th>)}</tr></thead><tbody>
      {rows.map(r=><tr key={r.id} className="border-t border-slate-800"><td className="px-4 py-3"><Link className="text-cyan-300" href={`/brands/${r.slug}`}>{r.name}</Link></td><td className="px-4">{formatNumber(Number(r.unique_products??0))}</td><td className="px-4">{formatNumber(Number(r.retailer_listings??0))}</td><td className="px-4">{formatNumber(Number(r.retailers??0))}</td><td className="px-4">{formatNumber(Number(r.reviews??0))}</td><td className="px-4">{r.average_rating==null?"—":Number(r.average_rating).toFixed(2)}</td><td className="px-4">{formatNumber(Number(r.competitors??0))}</td><td className="px-4">{formatDate(r.last_updated)}</td></tr>)}
      {!rows.length&&<tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No brands yet. Start a scrape from Overview.</td></tr>}
    </tbody></table></div>
  </div>;
}