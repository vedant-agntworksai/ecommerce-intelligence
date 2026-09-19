import { getDb } from "@/lib/db";
import { getReviewAnalytics } from "@/lib/analytics";
import { KpiGrid } from "@/components/kpi-grid";
import { BarList } from "@/components/bar-list";
import { formatDate,formatNumber,titleCase } from "@/lib/format";

export const dynamic="force-dynamic";

export default async function Reviews({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const q=await searchParams;
  const data=await getReviewAnalytics(await getDb(),{
    retailer:q.retailer,
    stars:q.stars?Number(q.stars):undefined,
    dateFrom:q.dateFrom,
    verified:q.verified==="yes"?true:q.verified==="no"?false:undefined,
    keyword:q.keyword,
    productId:q.productId,
    limit:300,
  });

  return <div className="p-8 space-y-6">
    <header>
      <p className="text-sm text-cyan-400">Reviews</p>
      <h2 className="mt-1 text-3xl font-semibold">Review intelligence</h2>
      <p className="muted mt-2">Individual reviews are deduplicated by retailer, retailer product ID, and review ID.</p>
    </header>

    <KpiGrid items={[
      {label:"Collected Reviews",value:formatNumber(data.stats.total)},
      {label:"Average Rating",value:formatNumber(data.stats.averageRating)},
      {label:"Verified Purchase",value:data.stats.verifiedPercentage==null?"-":`${data.stats.verifiedPercentage.toFixed(1)}%`},
    ]}/>

    <form className="card grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6">
      <select name="retailer" defaultValue={q.retailer??""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
        <option value="">All retailers</option><option value="amazon">Amazon</option><option value="walmart">Walmart</option><option value="lowes">Lowe&apos;s</option><option value="homedepot">Home Depot</option>
      </select>
      <select name="stars" defaultValue={q.stars??""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
        <option value="">All stars</option>{[5,4,3,2,1].map(x=><option key={x} value={x}>{x} stars</option>)}
      </select>
      <input name="dateFrom" defaultValue={q.dateFrom} type="date" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
      <select name="verified" defaultValue={q.verified??""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
        <option value="">Verified: any</option><option value="yes">Verified</option><option value="no">Not verified</option>
      </select>
      <input name="keyword" defaultValue={q.keyword} placeholder="Keyword in title/text" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
      <button className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Filter</button>
    </form>

    <div className="grid gap-4 xl:grid-cols-2">
      <BarList title="Star distribution" points={data.distribution.map(x=>({label:`${x.star} star`,value:x.count}))}/>
      <BarList title="Reviews by retailer" points={data.byRetailer.map(x=>({label:titleCase(x.retailer),value:x.count}))}/>
    </div>

    <div className="card divide-y divide-slate-800">
      {data.rows.map((r:any)=><article key={`${r.retailer}:${r.retailer_product_id}:${r.review_id}`} className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>{r.brand?`${r.brand} - `:""}{r.product_title||r.retailer_product_id} - {titleCase(r.retailer)}</span>
          <span>{formatDate(r.review_date)}</span>
        </div>
        <div className="mt-2 flex gap-2 text-sm"><span>{formatNumber(r.rating)} / 5</span>{r.verified_purchase===true&&<span className="text-emerald-300">Verified purchase</span>}</div>
        <h3 className="mt-2 font-medium">{r.title||"Review"}</h3>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{r.review_text||"No review text."}</p>
      </article>)}
      {!data.rows.length&&<p className="p-10 text-center text-slate-500">No reviews match these filters.</p>}
    </div>
  </div>;
}
