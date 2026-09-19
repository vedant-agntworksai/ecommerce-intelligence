import { getDb } from "@/lib/db";
import { getRetailerAnalytics } from "@/lib/analytics";
import { formatCurrency,formatDate,formatNumber,titleCase } from "@/lib/format";

export const dynamic="force-dynamic";

export default async function Retailers(){
  const rows=await getRetailerAnalytics(await getDb());
  return <div className="p-8">
    <p className="text-sm text-cyan-400">Retailers</p>
    <h2 className="mt-1 text-3xl font-semibold">Retailer coverage</h2>
    <p className="muted mt-2">Stored coverage, review collection, pricing, ratings, and freshness by retailer.</p>
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {rows.map((r:any)=><section className="card p-5" key={r.retailer}>
        <h3 className="text-lg font-semibold">{titleCase(r.retailer==="homedepot"?"home depot":r.retailer)}</h3>
        <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-slate-500">Products</dt><dd className="text-right">{formatNumber(r.products)}</dd>
          <dt className="text-slate-500">Listings</dt><dd className="text-right">{formatNumber(r.listings)}</dd>
          <dt className="text-slate-500">Collected reviews</dt><dd className="text-right">{formatNumber(r.collected_reviews)}</dd>
          <dt className="text-slate-500">Reported reviews</dt><dd className="text-right">{formatNumber(r.reported_reviews)}</dd>
          <dt className="text-slate-500">Average rating</dt><dd className="text-right">{formatNumber(r.average_rating)}</dd>
          <dt className="text-slate-500">Average price</dt><dd className="text-right">{formatCurrency(r.average_price)}</dd>
          <dt className="text-slate-500">Last updated</dt><dd className="text-right">{formatDate(r.last_updated)}</dd>
        </dl>
      </section>)}
      {!rows.length&&<div className="card p-10 text-center text-slate-500 md:col-span-2 xl:col-span-4">No retailer listings stored yet.</div>}
    </div>
  </div>;
}
