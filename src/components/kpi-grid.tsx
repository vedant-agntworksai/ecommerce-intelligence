import type { ReactNode } from "react";
export function KpiGrid({items}:{items:{label:string;value:ReactNode;hint?:string}[]}){
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">{items.map(item=>
    <div key={item.label} className="card p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{item.label}</div>
      <div className="mt-2 text-2xl font-semibold">{item.value}</div>
      {item.hint&&<div className="mt-1 text-xs text-slate-500">{item.hint}</div>}
    </div>
  )}</div>;
}
