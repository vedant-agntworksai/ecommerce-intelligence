import Link from "next/link";
import { formatCurrency, formatNumber, titleCase } from "@/lib/format";

export function ProductCard({product}:{product:any}){
  const retailers=String(product.retailers??"").split(",").filter(Boolean);
  const image=product.images?.[0];
  return <article className="card overflow-hidden">
    <div className="aspect-[4/3] bg-white/95 p-4">{image?<img src={image} alt="" className="h-full w-full object-contain"/>:<div className="flex h-full items-center justify-center text-sm text-slate-500">No image</div>}</div>
    <div className="p-4">
      <div className="text-xs text-cyan-400">{product.brand}</div>
      <h3 className="mt-1 line-clamp-2 min-h-12 font-medium">{product.title||"Untitled product"}</h3>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <dt className="text-slate-500">Model</dt><dd className="truncate text-right">{product.model_number||"—"}</dd>
        <dt className="text-slate-500">UPC</dt><dd className="truncate text-right">{product.upc||"—"}</dd>
        <dt className="text-slate-500">Lowest price</dt><dd className="text-right">{formatCurrency(product.lowest_price)}</dd>
        <dt className="text-slate-500">Avg rating</dt><dd className="text-right">{formatNumber(product.average_rating)}</dd>
        <dt className="text-slate-500">Collected reviews</dt><dd className="text-right">{formatNumber(product.total_reviews)}</dd>
      </dl>
      <div className="mt-4 flex flex-wrap gap-1.5">{retailers.length?retailers.map((r:string)=><span key={r} className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-300">{titleCase(r)}</span>):<span className="text-xs text-slate-500">{product.retailer_count||0} retailers</span>}</div>
      <Link href={`/products/${product.id}`} className="mt-4 inline-flex text-sm font-medium text-cyan-300 hover:text-cyan-200">View product →</Link>
    </div>
  </article>;
}
