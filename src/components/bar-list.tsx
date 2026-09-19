export function BarList({title,points}:{title:string;points:{label:string;value:number}[]}){
  if(!points.length)return null;
  const max=Math.max(...points.map(p=>p.value),1);
  return <section className="card p-5">
    <h3 className="font-semibold">{title}</h3>
    <div className="mt-4 space-y-3">{points.map(p=><div key={p.label}>
      <div className="mb-1 flex justify-between gap-4 text-xs"><span className="truncate text-slate-300">{p.label}</span><span className="text-slate-400">{new Intl.NumberFormat("en-US",{maximumFractionDigits:1}).format(p.value)}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400/80" style={{width:`${Math.max(2,(p.value/max)*100)}%`}}/></div>
    </div>)}</div>
  </section>;
}
