import Link from "next/link";
import { getDb } from "@/lib/db";
import { getCompetitorMarket } from "@/lib/analytics";
import { formatCurrency,formatNumber } from "@/lib/format";

export const dynamic="force-dynamic";

export default async function Competitors({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const q=await searchParams;
  const rows=await getCompetitorMarket(await getDb(),{
    sourceBrand:q.sourceBrand,category:q.category,subcategory:q.subcategory,size:q.size,form:q.form,retailer:q.retailer,
  });

  return <div className="p-8">
    <p className="text-sm text-cyan-400">Competitors</p>
    <h2 className="mt-1 text-3xl font-semibold">Comparable product market</h2>
    <p className="muted mt-2">Relationships are ranked from normalized functional attributes. Numeric scores remain internal.</p>

    <form className="card mt-6 grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-7">
      <input name="sourceBrand" defaultValue={q.sourceBrand} placeholder="Source brand" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
      <input name="category" defaultValue={q.category} placeholder="Category" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
      <input name="subcategory" defaultValue={q.subcategory} placeholder="Subcategory" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
      <input name="size" defaultValue={q.size} placeholder="Size (e.g. 1 gal)" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/><input name="form" defaultValue={q.form} placeholder="Formulation" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
      <select name="retailer" defaultValue={q.retailer??""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
        <option value="">All retailers</option><option value="amazon">Amazon</option><option value="walmart">Walmart</option><option value="lowes">Lowe&apos;s</option><option value="homedepot">Home Depot</option>
      </select>
      <button className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Filter</button>
    </form>

    <div className="card mt-6 overflow-x-auto">
      <table className="w-full min-w-[1150px] text-sm">
        <thead><tr className="text-left text-slate-400">{["Source","Comparable product","Match","Size","Form","Price","Price / Unit","Rating","Review Count","Retailers"].map(x=><th key={x} className="p-3">{x}</th>)}</tr></thead>
        <tbody>
          {rows.map((r:any)=><tr key={`${r.source_id}:${r.competitor_id}`} className="border-t border-slate-800">
            <td className="p-3"><Link className="hover:text-cyan-300" href={`/products/${r.source_id}`}>{r.source_brand}<div className="text-xs text-slate-500">{r.source_title}</div></Link></td>
            <td><Link className="hover:text-cyan-300" href={`/products/${r.competitor_id}`}>{r.competitor_brand}<div className="text-xs text-slate-500">{r.competitor_title}</div></Link></td>
            <td><span className="rounded-full border border-cyan-800 bg-cyan-950/40 px-2 py-1 text-xs text-cyan-300">{r.label}</span></td>
            <td>{r.competitor_size||"-"}</td><td>{r.competitor_formulation||"-"}</td><td>{formatCurrency(r.competitor_price)}</td>
            <td>{r.units_compatible&&r.competitor_unit_price?`${formatCurrency(r.competitor_unit_price.value)} / ${r.competitor_unit_price.unit}`:"-"}</td>
            <td>{formatNumber(r.competitor_rating)}</td><td>{formatNumber(r.competitor_review_count)}</td><td>{formatNumber(r.retailer_count)}</td>
          </tr>)}
          {!rows.length&&<tr><td colSpan={10} className="p-10 text-center text-slate-500">No stored competitor relationships match these filters.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>;
}
