import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getProductDetail,getReviewAnalytics } from "@/lib/analytics";
import { KpiGrid } from "@/components/kpi-grid";
import { BarList } from "@/components/bar-list";
import { LineChart } from "@/components/line-chart";
import { formatCurrency,formatDate,formatNumber,titleCase } from "@/lib/format";
import { unitPrice } from "@/lib/matching/units";

export const dynamic="force-dynamic";

const tabs=["overview","retailer-listings","reviews","competitors","price-history","rating-history","raw-data"] as const;

export default async function ProductPage({
  params,searchParams,
}:{
  params:Promise<{id:string}>;
  searchParams:Promise<{tab?:string;compare?:string}>;
}){
  const {id}=await params;
  const q=await searchParams;
  const db=await getDb();
  const data=await getProductDetail(db,id);
  if(!data)notFound();

  const tab=tabs.includes(q.tab as (typeof tabs)[number])?(q.tab as (typeof tabs)[number]):"overview";
  const product=data.product;
  const reviewData=tab==="reviews"?await getReviewAnalytics(db,{productId:id,limit:100}):null;
  const compare=data.competitors.find((x:any)=>x.id===q.compare)??data.competitors[0];
  const merged=latestNormalizedRaw(data.listings);

  return <div className="p-8 space-y-6">
    <header className="grid gap-6 lg:grid-cols-[180px_1fr]">
      <div className="card aspect-square bg-white p-3">
        {product.images?.[0]
          ?<img src={product.images[0]} alt="" className="h-full w-full object-contain"/>
          :<div className="flex h-full items-center justify-center text-slate-500">No image</div>}
      </div>
      <div>
        <p className="text-sm text-cyan-400">{product.brand}</p>
        <h2 className="mt-1 text-3xl font-semibold">{product.title}</h2>
        <p className="muted mt-2">{[product.category,product.subcategory,product.product_type,product.size_text,product.formulation].filter(Boolean).join(" - ")||"No normalized category metadata yet."}</p>
      </div>
    </header>

    <KpiGrid items={[
      {label:"Retailers",value:formatNumber(data.stats.retailers)},
      {label:"Lowest Price",value:formatCurrency(data.stats.lowestPrice)},
      {label:"Highest Price",value:formatCurrency(data.stats.highestPrice)},
      {label:"Average Price",value:formatCurrency(data.stats.averagePrice)},
      {label:"Collected Reviews",value:formatNumber(data.stats.totalReviews)},
      {label:"Average Rating",value:formatNumber(data.stats.averageRating)},
      {label:"Competitors",value:formatNumber(data.stats.competitors)},
    ]}/>

    <nav className="flex flex-wrap gap-2">
      {tabs.map(t=><Link key={t} href={`/products/${id}?tab=${t}`} className={`rounded-full border px-3 py-1.5 text-sm ${tab===t?"border-cyan-400 bg-cyan-400/10 text-cyan-300":"border-slate-700 text-slate-400"}`}>{titleCase(t.replaceAll("-"," "))}</Link>)}
    </nav>

    {tab==="overview"&&<div className="grid gap-4 xl:grid-cols-2">
      <section className="card p-5">
        <h3 className="font-semibold">Canonical identity</h3>
        <dl className="mt-4 space-y-3 text-sm">
          {[
            ["Brand",product.brand],["UPC",product.upc],["GTIN",product.gtin],["EAN",product.ean],
            ["Model",product.model_number],["MPN",product.mpn],["Category",product.category],
            ["Subcategory",product.subcategory],["Product type",product.product_type],
            ["Target use",product.target_use],["Formulation",product.formulation],["Size",product.size_text],
            ["Normalized quantity",product.normalized_quantity==null?null:`${product.normalized_quantity} ${product.normalized_unit??""}`],
            ["Pack quantity",product.pack_quantity],
          ].map(([label,value])=><div key={String(label)} className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-2"><dt className="text-slate-500">{label}</dt><dd className="text-right">{value??"-"}</dd></div>)}
        </dl>
      </section>

      <section className="card p-5">
        <h3 className="font-semibold">Description</h3>
        <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{product.description||merged?.description||"No description stored."}</p>
        {Array.isArray(merged?.features)&&merged.features.length>0&&<>
          <h4 className="mt-5 text-sm font-semibold">Features</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">{merged.features.map((x:unknown,i:number)=><li key={i}>{String(x)}</li>)}</ul>
        </>}
      </section>

      {merged?.specifications&&typeof merged.specifications==="object"&&Object.keys(merged.specifications).length>0&&
        <section className="card p-5 xl:col-span-2">
          <h3 className="font-semibold">Specifications</h3>
          <dl className="mt-4 grid gap-x-6 text-sm md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(merged.specifications).map(([key,value])=><div key={key} className="flex justify-between gap-4 border-b border-slate-800 py-2"><dt className="text-slate-500">{key}</dt><dd className="text-right">{String(value)}</dd></div>)}
          </dl>
        </section>}
    </div>}

    {tab==="retailer-listings"&&<section className="card overflow-x-auto">
      <table className="w-full min-w-[1200px] text-sm">
        <thead><tr className="text-left text-slate-400">{["Retailer","Product ID","SKU / ASIN","UPC / GTIN","Model / MPN","Price","Original","Availability","Seller","Fulfillment","Rating","Reviews","First seen","Last scraped","PDP"].map(x=><th className="p-3" key={x}>{x}</th>)}</tr></thead>
        <tbody>{data.listings.map((r:any)=><tr key={r.id} className="border-t border-slate-800">
          <td className="p-3">{titleCase(r.retailer==="homedepot"?"home depot":r.retailer)}</td>
          <td>{r.retailer_product_id}</td><td>{r.retailer_sku||r.asin||"-"}</td><td>{r.upc||r.gtin||"-"}</td><td>{r.model_number||r.mpn||"-"}</td>
          <td>{formatCurrency(r.price,r.currency||"USD")}</td><td>{formatCurrency(r.original_price,r.currency||"USD")}</td>
          <td>{r.availability||"-"}</td><td>{r.seller||"-"}</td><td>{r.fulfilled_by||"-"}</td><td>{formatNumber(r.rating)}</td><td>{formatNumber(r.review_count)}</td>
          <td>{formatDate(r.first_seen)}</td><td>{formatDate(r.last_scraped)}</td>
          <td><a className="text-cyan-300" href={r.product_url} target="_blank" rel="noreferrer">Open</a></td>
        </tr>)}</tbody>
      </table>
    </section>}

    {tab==="reviews"&&reviewData&&<div className="space-y-4">
      <KpiGrid items={[
        {label:"Collected reviews",value:formatNumber(reviewData.stats.total)},
        {label:"Average rating",value:formatNumber(reviewData.stats.averageRating)},
        {label:"Verified purchase",value:reviewData.stats.verifiedPercentage==null?"-":`${reviewData.stats.verifiedPercentage.toFixed(1)}%`},
      ]}/>
      <div className="grid gap-4 xl:grid-cols-2">
        <BarList title="Star distribution" points={reviewData.distribution.map(x=>({label:`${x.star} star`,value:x.count}))}/>
        <BarList title="Reviews by retailer" points={reviewData.byRetailer.map(x=>({label:titleCase(x.retailer),value:x.count}))}/>
        <LineChart title="Review timeline" points={data.reviews.reviewTimeline}/>
      </div>
      <div className="card divide-y divide-slate-800">
        {reviewData.rows.map((r:any)=><article key={`${r.retailer}:${r.review_id}`} className="p-4">
          <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span>{titleCase(r.retailer)} - {formatNumber(r.rating)} / 5 {r.verified_purchase===true?"- Verified":""}</span><span>{formatDate(r.review_date)}</span></div>
          <h4 className="mt-2 font-medium">{r.title||"Review"}</h4><p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{r.review_text||"No review text."}</p>
        </article>)}
        {!reviewData.rows.length&&<p className="p-8 text-center text-slate-500">No individual reviews collected yet.</p>}
      </div>
    </div>}

    {tab==="competitors"&&<div className="space-y-4">
      {compare&&<section className="card p-5">
        <h3 className="font-semibold">Side-by-side comparison</h3>
        <div className="mt-4 grid grid-cols-[150px_1fr_1fr] gap-x-4 gap-y-3 text-sm">
          <div/><div className="font-medium">{product.brand} - {product.title}</div><div className="font-medium">{compare.brand} - {compare.title}</div>
          {comparisonRows(product,data,compare).map(([label,a,b])=><div key={label} className="contents"><div className="text-slate-500">{label}</div><div>{a}</div><div>{b}</div></div>)}
        </div>
      </section>}
      <section className="grid gap-3">
        {data.competitors.map((c:any)=><div key={c.id} className="card grid gap-3 p-4 md:grid-cols-[1fr_auto]">
          <div><div className="text-xs text-cyan-400">{c.label}</div><Link href={`/products/${c.id}`} className="mt-1 font-medium hover:text-cyan-300">{c.brand} - {c.title}</Link><div className="mt-2 text-sm text-slate-400">{c.size_text||"Size unavailable"} - {c.formulation||"Form unavailable"} - {formatCurrency(c.price)} - {formatNumber(c.rating)} / 5 - {formatNumber(c.review_count)} reported reviews - {c.retailer_count} retailers</div></div>
          <Link href={`/products/${id}?tab=competitors&compare=${c.id}`} className="self-center rounded-xl border border-slate-700 px-3 py-2 text-sm">Compare</Link>
        </div>)}
        {!data.competitors.length&&<div className="card p-10 text-center text-slate-500">No competitor relationships stored yet.</div>}
      </section>
    </div>}

    {tab==="price-history"&&(data.priceHistory.length>1
      ?<LineChart title="Price history" points={data.priceHistory.map((x:any)=>({label:String(x.captured_at).slice(0,10),value:Number(x.price)}))} valueFormatter={v=>formatCurrency(v)}/>
      :<div className="card p-10 text-center text-slate-500">Price history appears after multiple snapshots exist.</div>)}

    {tab==="rating-history"&&(data.ratingHistory.length>1
      ?<LineChart title="Rating history" points={data.ratingHistory.map((x:any)=>({label:String(x.captured_at).slice(0,10),value:Number(x.rating)}))}/>
      :<div className="card p-10 text-center text-slate-500">Rating history appears after multiple snapshots exist.</div>)}

    {tab==="raw-data"&&<div className="space-y-4">
      {data.listings.map((r:any)=><details className="card p-4" key={r.id}><summary className="cursor-pointer font-medium">{titleCase(r.retailer)} - {r.retailer_product_id}</summary><pre className="mt-4 max-h-[600px] overflow-auto whitespace-pre-wrap text-xs text-slate-300">{pretty(r.raw_json)}</pre></details>)}
      {!data.listings.length&&<div className="card p-10 text-center text-slate-500">No retailer raw data stored.</div>}
    </div>}
  </div>;
}

function pretty(value:unknown){
  try{return JSON.stringify(JSON.parse(String(value??"null")),null,2);}
  catch{return String(value??"");}
}

function latestNormalizedRaw(listings:any[]){
  for(const row of listings){
    try{
      const raw=JSON.parse(String(row.raw_json??"null"));
      const root=raw?.results?.[0]?.content??raw?.results?.[0]??raw?.content??raw;
      const product=root?.results?.[0]??root?.product??root;
      if(product&&typeof product==="object")return product;
    }catch{}
  }
  return null;
}

function comparisonRows(product:any,data:any,competitor:any):[string,string,string][]{
  const sourceUnit=unitPrice(data.stats.lowestPrice,product.normalized_quantity,product.normalized_unit);
  const competitorUnit=unitPrice(competitor.price,competitor.normalized_quantity,competitor.normalized_unit);
  const compatible=!!product.normalized_unit&&product.normalized_unit===competitor.normalized_unit;
  return [
    ["Size",product.size_text||"-",competitor.size_text||"-"],
    ["Formulation",product.formulation||"-",competitor.formulation||"-"],
    ["Price",formatCurrency(data.stats.lowestPrice),formatCurrency(competitor.price)],
    ["Price / Unit",compatible&&sourceUnit?`${formatCurrency(sourceUnit.value)} / ${sourceUnit.unit}`:"-",compatible&&competitorUnit?`${formatCurrency(competitorUnit.value)} / ${competitorUnit.unit}`:"-"],
    ["Rating",formatNumber(data.stats.averageRating),formatNumber(competitor.rating)],
    ["Review Count",formatNumber(data.stats.totalReviews),formatNumber(competitor.review_count)],
    ["Retailers",formatNumber(data.stats.retailers),formatNumber(competitor.retailer_count)],
  ];
}
