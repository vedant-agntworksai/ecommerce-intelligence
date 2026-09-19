import Link from "next/link";
import { getDb } from "@/lib/db"; import { SettingsRepository } from "@/lib/db/repositories/settings-repository"; import { getOverviewAnalytics } from "@/lib/analytics"; import { NewScrapeForm } from "@/components/new-scrape-form"; import { KpiGrid } from "@/components/kpi-grid"; import { BarList } from "@/components/bar-list"; import { LineChart } from "@/components/line-chart"; import { formatNumber,formatDate } from "@/lib/format";
export const dynamic="force-dynamic";
export default async function Overview(){
  const db=await getDb();const [data,settings]=await Promise.all([getOverviewAnalytics(db),new SettingsRepository(db).get()]);
  const k=data.kpis,q=data.quality;
  return <div className="p-8 space-y-8">
    <header><p className="text-sm text-cyan-400">Overview</p><h2 className="text-3xl font-semibold mt-1">Commerce intelligence control center</h2><p className="muted mt-2">All values come from stored retailer data. No sample metrics are synthesized.</p></header>
    <KpiGrid items={[
      {label:"Brands",value:formatNumber(k.brands)},{label:"Unique Products",value:formatNumber(k.products)},
      {label:"Retailer Listings",value:formatNumber(k.listings)},{label:"Products With Reviews",value:formatNumber(k.productsWithReviews)},
      {label:"Total Reviews",value:formatNumber(k.totalReviews)},{label:"Average Rating",value:formatNumber(k.averageRating)},
      {label:"Competitor Relationships",value:formatNumber(k.competitors)},{label:"Active Retailers",value:formatNumber(k.retailers)},
    ]}/>
    <NewScrapeForm defaultMaxReviews={settings.defaultMaxReviews} defaultCompetitors={settings.defaultCompetitors}/>
    <section><h3 className="mb-3 text-lg font-semibold">Data completeness</h3><KpiGrid items={[
      {label:"Missing UPC",value:formatNumber(q.missingUpc)},{label:"Missing GTIN",value:formatNumber(q.missingGtin)},
      {label:"Missing Model",value:formatNumber(q.missingModel)},{label:"Missing Price",value:formatNumber(q.missingPrice)},
      {label:"Without Reviews",value:formatNumber(q.withoutReviews)},{label:"Multi-retailer",value:formatNumber(q.multiRetailer)},
      {label:"Single-retailer",value:formatNumber(q.singleRetailer)},
    ]}/></section>
    <div className="grid gap-4 xl:grid-cols-2">
      <LineChart title="Products discovered over time" points={data.charts.productsDiscovered}/>
      <LineChart title="Reviews collected over time" points={data.charts.reviewsCollected}/>
      <BarList title="Products by retailer" points={data.charts.productsByRetailer}/>
      <BarList title="Products by brand" points={data.charts.productsByBrand}/>
      <BarList title="Rating distribution" points={data.charts.ratingDistribution}/>
      {data.charts.priceHistory.length>1&&<LineChart title="Price changes over time" points={data.charts.priceHistory} valueFormatter={v=>`$${v.toFixed(2)}`}/>}
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <section className="card p-5"><h3 className="font-semibold">Recently discovered products</h3><div className="mt-3 divide-y divide-slate-800">{data.recentProducts.map((p:any)=><Link key={p.id} href={`/products/${p.id}`} className="flex justify-between gap-4 py-3 text-sm hover:text-cyan-300"><span className="truncate">{p.brand} · {p.title}</span><span className="shrink-0 text-slate-500">{formatDate(p.created_at)}</span></Link>)}{!data.recentProducts.length&&<p className="py-6 text-sm text-slate-500">No products discovered yet.</p>}</div></section>
      <section className="card p-5"><h3 className="font-semibold">Recently updated products</h3><div className="mt-3 divide-y divide-slate-800">{data.recentUpdated.map((p:any)=><Link key={p.id} href={`/products/${p.id}`} className="flex justify-between gap-4 py-3 text-sm hover:text-cyan-300"><span className="truncate">{p.brand} · {p.title}</span><span className="shrink-0 text-slate-500">{formatDate(p.updated_at)}</span></Link>)}{!data.recentUpdated.length&&<p className="py-6 text-sm text-slate-500">No product updates yet.</p>}</div></section>
      <section className="card p-5"><h3 className="font-semibold">Recent scrape failures</h3><div className="mt-3 divide-y divide-slate-800">{data.recentFailures.map((j:any)=><div key={j.id} className="py-3 text-sm"><div className="flex justify-between"><span>{j.type}</span><span className="text-slate-500">{formatDate(j.created_at)}</span></div><div className="mt-1 text-rose-300">{j.error}</div></div>)}{!data.recentFailures.length&&<p className="py-6 text-sm text-slate-500">No recent failures.</p>}</div></section>
    </div>
  </div>;
}
