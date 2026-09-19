import { notFound } from "next/navigation";
import { getDb } from "@/lib/db"; import { getBrandDashboard } from "@/lib/analytics"; import { KpiGrid } from "@/components/kpi-grid"; import { BarList } from "@/components/bar-list"; import { ProductCard } from "@/components/product-card"; import { formatCurrency,formatDate,formatNumber,titleCase } from "@/lib/format";
export const dynamic="force-dynamic";
export default async function BrandPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const data=await getBrandDashboard(await getDb(),slug);if(!data)notFound();
  const s=data.summary,m=data.marketComparison;const retailerMap=new Map(data.retailerSummary.map((r:any)=>[r.retailer,r]));
  return <div className="p-8 space-y-8">
    <header><p className="text-sm text-cyan-400">Brand Intelligence</p><h2 className="mt-1 text-3xl font-semibold">{data.brand.name}</h2><p className="muted mt-2">{formatNumber(s.uniqueProducts)} unique products · {formatNumber(s.retailerListings)} retailer listings · {formatNumber(s.totalReviews)} collected reviews · Last updated {formatDate(s.lastUpdated)}</p></header>
    <KpiGrid items={[
      {label:"Unique Products",value:formatNumber(s.uniqueProducts)},{label:"Retailer Listings",value:formatNumber(s.retailerListings)},
      {label:"Products With Reviews",value:formatNumber(s.productsWithReviews)},{label:"Total Reviews",value:formatNumber(s.totalReviews)},
      {label:"Average Rating",value:formatNumber(s.averageRating)},{label:"Average Price",value:formatCurrency(s.averagePrice)},
      {label:"Competitor Products",value:formatNumber(s.competitorProducts)},{label:"Cross-Retailer Matches",value:formatNumber(s.crossRetailerMatches)},
    ]}/>
    <section><h3 className="mb-3 text-lg font-semibold">Retailer coverage</h3><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{["amazon","walmart","lowes","homedepot"].map(name=>{const r:any=retailerMap.get(name);return <div key={name} className="card p-4"><div className="font-medium">{titleCase(name==="homedepot"?"home depot":name)}</div><dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm"><dt className="text-slate-500">Products</dt><dd className="text-right">{formatNumber(r?.products??0)}</dd><dt className="text-slate-500">Reviews</dt><dd className="text-right">{formatNumber(r?.reviews??0)}</dd><dt className="text-slate-500">Avg rating</dt><dd className="text-right">{formatNumber(r?.average_rating)}</dd><dt className="text-slate-500">Avg price</dt><dd className="text-right">{formatCurrency(r?.average_price)}</dd></dl></div>})}</div></section>
    {data.competitorBrands.length>0&&<div className="grid gap-4 xl:grid-cols-2"><BarList title="Most frequently matched competitor brands" points={data.competitorBrands.map((x:any)=>({label:x.brand,value:x.matches}))}/><BarList title="Comparable products by competitor" points={data.competitorBrands.map((x:any)=>({label:x.brand,value:x.products}))}/></div>}
    <section><h3 className="mb-3 text-lg font-semibold">Brand vs comparable market</h3><KpiGrid items={[
      {label:"Price vs Comparable Market",value:`${formatCurrency(m.sourcePrice)} vs ${formatCurrency(m.marketPrice)}`},
      {label:"Rating vs Comparable Market",value:`${formatNumber(m.sourceRating)} vs ${formatNumber(m.marketRating)}`},
      {label:"Review Volume vs Comparable Market",value:`${formatNumber(m.sourceReviews)} vs ${formatNumber(m.marketReviews)}`,hint:"Average retailer-reported review volume per product"},
      {label:"Retailer Coverage vs Comparable Market",value:`${formatNumber(m.sourceCoverage)} vs ${formatNumber(m.marketCoverage)}`,hint:"Average distinct retailers per product"},
    ]}/></section>
    <section><div className="mb-4 flex items-end justify-between"><div><h3 className="text-lg font-semibold">{data.brand.name} Products</h3><p className="text-sm text-slate-500">Canonical products; retailer duplicates are collapsed into one card.</p></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{data.products.map((p:any)=><ProductCard key={p.id} product={p}/>)}</div>{!data.products.length&&<div className="card p-10 text-center text-slate-500">No products stored for this brand yet.</div>}</section>
  </div>;
}
