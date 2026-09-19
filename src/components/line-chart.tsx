export function LineChart({title,points,valueFormatter}:{title:string;points:{label:string;value:number}[];valueFormatter?:(v:number)=>string}){
  if(points.length<2)return null;
  const values=points.map(p=>p.value);
  const min=Math.min(...values),max=Math.max(...values),range=Math.max(max-min,1e-9);
  const coords=points.map((p,i)=>{
    const x=points.length===1?0:(i/(points.length-1))*100;
    const y=44-((p.value-min)/range)*38;
    return `${x},${y}`;
  }).join(" ");
  const fmt=valueFormatter??((v:number)=>new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(v));
  return <section className="card p-5">
    <div className="flex items-center justify-between gap-4"><h3 className="font-semibold">{title}</h3><span className="text-xs text-slate-400">{fmt(values.at(-1)??0)}</span></div>
    <svg viewBox="0 0 100 48" className="mt-4 h-40 w-full overflow-visible" role="img" aria-label={title}>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400" points={coords}/>
    </svg>
    <div className="flex justify-between text-xs text-slate-500"><span>{points[0].label}</span><span>{points.at(-1)?.label}</span></div>
  </section>;
}
