export function ProductFilterForm({q}:{q:Record<string,string|undefined>}){
  return <form className="card mt-6 grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6">
    <input name="search" defaultValue={q.search} placeholder="Search title, brand, model" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
    <input name="category" defaultValue={q.category} placeholder="Category" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
    <select name="retailer" defaultValue={q.retailer??""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="">All retailers</option><option value="amazon">Amazon</option><option value="walmart">Walmart</option><option value="lowes">Lowe&apos;s</option><option value="homedepot">Home Depot</option></select>
    <input name="minPrice" defaultValue={q.minPrice} type="number" step="0.01" placeholder="Min price" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
    <input name="maxPrice" defaultValue={q.maxPrice} type="number" step="0.01" placeholder="Max price" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
    <input name="minRating" defaultValue={q.minRating} type="number" min="1" max="5" step="0.1" placeholder="Min rating" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
    <input name="minReviews" defaultValue={q.minReviews} type="number" min="0" placeholder="Min reviews" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
    <input name="availability" defaultValue={q.availability} placeholder="Availability" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
    <select name="hasUpc" defaultValue={q.hasUpc??""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="">UPC: any</option><option value="yes">UPC available</option><option value="no">UPC missing</option></select>
    <select name="hasGtin" defaultValue={q.hasGtin??""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="">GTIN: any</option><option value="yes">GTIN available</option><option value="no">GTIN missing</option></select>
    <select name="hasModel" defaultValue={q.hasModel??""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="">Model: any</option><option value="yes">Model available</option><option value="no">Model missing</option></select>
    <select name="retailerCount" defaultValue={q.retailerCount??""} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="">Retailer count: any</option><option value="2">2+</option><option value="3">3+</option><option value="4">4</option></select>
    <button className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Apply filters</button>
  </form>;
}
