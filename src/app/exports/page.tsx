import { Download } from "lucide-react";
const exports=[
  ["products","Canonical products","One row per unified product identity with normalized identifiers and attributes."],
  ["retailer-listings","Retailer listings","Retailer-specific SKUs, identifiers, PDP URLs, prices, ratings, availability, and freshness."],
  ["reviews","Reviews","Deduplicated individual reviews across all supported retailers."],
  ["competitors","Competitor relationships","Stored source-to-comparable-product relationships and user-facing match labels."],
  ["snapshots","Historical snapshots","Observed price, rating, review-count, and availability history."],
] as const;
export default function Exports(){
  return <div className="p-8"><p className="text-sm text-cyan-400">Exports</p><h2 className="mt-1 text-3xl font-semibold">Download stored intelligence</h2><p className="muted mt-2">CSV exports contain only values stored in the configured database.</p>
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{exports.map(([kind,title,description])=><section key={kind} className="card p-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 min-h-12 text-sm text-slate-400">{description}</p><a href={`/api/exports/${kind}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"><Download size={16}/>Download CSV</a></section>)}</div>
  </div>;
}
