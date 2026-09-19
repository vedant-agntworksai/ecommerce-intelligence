"use client";
import { useState } from "react";
export function NewScrapeForm(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");const f=new FormData(e.currentTarget);
 const body={brand:f.get("brand"),startUrl:f.get("startUrl"),retailer:f.get("retailer"),
 discoverProducts:f.get("discoverProducts")==="on",collectPdp:f.get("collectPdp")==="on",matchCanonical:f.get("matchCanonical")==="on",findCompetitors:f.get("findCompetitors")==="on",
 collectProductReviews:f.get("reviews")==="on",collectCompetitorReviews:f.get("competitorReviews")==="on",maximumProducts:f.get("maximumProducts")?Number(f.get("maximumProducts")):null,
 maximumReviewsPerProduct:Number(f.get("maximumReviews")||500),competitorsPerProduct:Number(f.get("competitors")||3),forceRefresh:f.get("refresh")==="force"};
 const r=await fetch("/api/jobs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const data=await r.json();setBusy(false);setMessage(r.ok?`Job ${data.id} queued`:data?.error??data?.message??"Unable to queue job");}
 return <form onSubmit={submit} className="card p-6 space-y-5"><div><h2 className="text-lg font-semibold">New scrape</h2><p className="muted text-sm mt-1">One workflow for discovery, PDPs, reviews, canonical matching, and competitors.</p></div>
 <div className="grid md:grid-cols-2 gap-4"><label className="text-sm">Brand<input required name="brand" placeholder="Spectracide" className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2"/></label>
 <label className="text-sm">Starting URL<input required type="url" name="startUrl" placeholder="https://www.lowes.com/..." className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2"/></label>
 <label className="text-sm">Retailer<select name="retailer" className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2"><option value="auto">Auto Detect</option><option value="amazon">Amazon</option><option value="walmart">Walmart</option><option value="lowes">Lowe&apos;s</option><option value="homedepot">Home Depot</option></select></label>
 <label className="text-sm">Maximum products<input name="maximumProducts" type="number" min="1" placeholder="Unlimited" className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2"/></label></div>
 <fieldset><legend className="mb-2 text-sm font-medium">Data options</legend><div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
 {[["discoverProducts","Discover products"],["collectPdp","Collect PDP data"],["matchCanonical","Match canonical products"],["findCompetitors","Find competitors"]].map(([name,label])=><label key={name}><input type="checkbox" name={name} defaultChecked className="mr-2"/>{label}</label>)}
 <label><input type="checkbox" name="reviews" className="mr-2"/>Collect product reviews</label><label><input type="checkbox" name="competitorReviews" className="mr-2"/>Collect competitor reviews (on demand)</label></div></fieldset>
 <div className="grid md:grid-cols-2 gap-4"><label className="text-sm">Maximum reviews / product<input name="maximumReviews" type="number" defaultValue={500} min="1" max="5000" className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2"/></label><label className="text-sm">Competitors / product<select name="competitors" defaultValue="3" className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2">{[1,3,5,10].map(n=><option key={n}>{n}</option>)}</select></label></div>
 <fieldset className="text-sm"><legend className="mb-2">Refresh</legend><label className="mr-5"><input type="radio" name="refresh" value="optimized" defaultChecked className="mr-2"/>Cost Optimized</label><label><input type="radio" name="refresh" value="force" className="mr-2"/>Force Refresh</label></fieldset>
 <button disabled={busy} className="rounded-xl bg-cyan-400 px-5 py-2.5 font-semibold text-slate-950 disabled:opacity-50">{busy?"Queueing…":"Start"}</button>{message&&<span className="ml-3 text-sm text-cyan-300">{message}</span>}</form>;
}
