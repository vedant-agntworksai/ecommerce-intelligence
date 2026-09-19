"use client";
import { useState } from "react";
import type { AppSettings } from "@/lib/db/repositories/settings-repository";

export function SettingsForm({initial}:{initial:AppSettings}){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMessage("");
    const f=new FormData(e.currentTarget);
    const ttlMs=Object.fromEntries(Object.keys(initial.ttlMs).map(k=>[k,Number(f.get(`ttl.${k}`))*60*60*1000]));
    const competitorWeights=Object.fromEntries(Object.keys(initial.competitorWeights).map(k=>[k,Number(f.get(`weight.${k}`))/100]));
    const body={ttlMs,competitorSizeTolerance:Number(f.get("sizeTolerance"))/100,competitorWeights,defaultCompetitors:Number(f.get("defaultCompetitors")),defaultMaxReviews:Number(f.get("defaultMaxReviews"))};
    const r=await fetch("/api/settings",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const data=await r.json();setBusy(false);setMessage(r.ok?"Settings saved":data?.error?.formErrors?.[0]??"Unable to save settings");
  }
  return <form onSubmit={submit} className="space-y-6">
    <section className="card overflow-hidden"><div className="border-b border-slate-800 p-4"><h3 className="font-semibold">Cache / refresh policy</h3><p className="mt-1 text-sm text-slate-500">Hours before each stored resource group becomes stale.</p></div>
      <table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th className="p-4">Resource</th><th>TTL hours</th></tr></thead><tbody>{Object.entries(initial.ttlMs).map(([k,v])=><tr key={k} className="border-t border-slate-800"><td className="p-4">{k.replaceAll("_"," ")}</td><td><input name={`ttl.${k}`} type="number" min="1" defaultValue={Math.round(v/3600000)} className="w-32 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"/></td></tr>)}</tbody></table>
    </section>
    <section className="card p-5"><h3 className="font-semibold">Competitor matching</h3><div className="mt-4 grid gap-4 md:grid-cols-3">
      <label className="text-sm">Preferred size tolerance (%)<input name="sizeTolerance" type="number" min="0" max="200" defaultValue={initial.competitorSizeTolerance*100} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"/></label>
      <label className="text-sm">Default competitors<select name="defaultCompetitors" defaultValue={initial.defaultCompetitors} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">{[1,3,5,10].map(n=><option key={n}>{n}</option>)}</select></label>
      <label className="text-sm">Default max reviews<input name="defaultMaxReviews" type="number" min="1" max="5000" defaultValue={initial.defaultMaxReviews} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"/></label>
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{Object.entries(initial.competitorWeights).map(([k,v])=><label key={k} className="text-sm">{k.replaceAll(/([A-Z])/g," $1")} (%)<input name={`weight.${k}`} type="number" min="0" max="100" step="1" defaultValue={Math.round(v*100)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"/></label>)}</div>
    </section>
    <button disabled={busy} className="rounded-xl bg-cyan-400 px-5 py-2.5 font-semibold text-slate-950 disabled:opacity-50">{busy?"Saving…":"Save settings"}</button>{message&&<span className="ml-3 text-sm text-cyan-300">{message}</span>}
  </form>;
}
