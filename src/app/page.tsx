import { getDb } from "@/lib/db"; import { NewScrapeForm } from "@/components/new-scrape-form";
async function metrics(){try{const db=await getDb();const q=async(sql:string)=>(await db.query<{n:number}>(sql)).rows[0]?.n??0;return{
 brands:await q("SELECT COUNT(*) n FROM brands"),products:await q("SELECT COUNT(*) n FROM canonical_products"),listings:await q("SELECT COUNT(*) n FROM retailer_products"),
 reviews:await q("SELECT COUNT(*) n FROM reviews"),competitors:await q("SELECT COUNT(*) n FROM competitor_relationships"),retailers:await q("SELECT COUNT(DISTINCT retailer) n FROM retailer_products")
 };}catch{return{brands:0,products:0,listings:0,reviews:0,competitors:0,retailers:0};}}
export default async function Overview(){const m=await metrics();const cards=[["Brands",m.brands],["Unique Products",m.products],["Retailer Listings",m.listings],["Total Reviews",m.reviews],["Competitor Relationships",m.competitors],["Active Retailers",m.retailers]];
 return <div className="p-8 space-y-8"><header><p className="text-sm text-cyan-400">Overview</p><h2 className="text-3xl font-semibold mt-1">Commerce intelligence control center</h2><p className="muted mt-2">Live values come from the configured database. Empty databases display zero, never fabricated sample data.</p></header>
 <section className="grid md:grid-cols-3 xl:grid-cols-6 gap-3">{cards.map(([k,v])=><div className="card p-4" key={String(k)}><div className="muted text-xs">{k}</div><div className="text-2xl font-semibold mt-2">{v}</div></div>)}</section><NewScrapeForm/></div>}
