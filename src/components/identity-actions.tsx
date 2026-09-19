"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function IdentityActions({productId,listings}:{productId:string;listings:{id:string;retailer:string;title?:string|null;retailer_product_id:string}[]}){
  const router=useRouter();const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function send(body:unknown){
    setBusy(true);setMessage("");
    const r=await fetch(`/api/products/${productId}/identity`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const data=await r.json();setBusy(false);setMessage(r.ok?"Identity updated":data?.error??"Update failed");
    if(r.ok)router.refresh();
  }
  return <section className="card p-5"><h3 className="font-semibold">Manual canonical identity controls</h3><p className="mt-1 text-sm text-slate-500">Use only when automated matching is insufficient. Every change is recorded in the identity audit log.</p>
    <div className="mt-5 grid gap-6 xl:grid-cols-2">
      <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void send({action:"merge",sourceProductId:f.get("sourceProductId")});}} className="rounded-xl border border-slate-800 p-4">
        <h4 className="font-medium">Merge another canonical product into this one</h4><p className="mt-1 text-xs text-slate-500">Paste the source canonical product UUID. This product remains the target identity.</p>
        <input required name="sourceProductId" placeholder="Source product UUID" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
        <button disabled={busy} className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:opacity-50">Merge product</button>
      </form>
      <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void send({action:"split",listingIds:f.getAll("listingIds"),title:f.get("title")||undefined});}} className="rounded-xl border border-slate-800 p-4">
        <h4 className="font-medium">Split retailer listings into a new product</h4>
        <input name="title" placeholder="Optional new canonical title" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
        <div className="mt-3 max-h-40 space-y-2 overflow-auto">{listings.map(x=><label key={x.id} className="flex gap-2 text-sm"><input name="listingIds" value={x.id} type="checkbox"/><span>{x.retailer} · {x.title||x.retailer_product_id}</span></label>)}</div>
        <button disabled={busy||listings.length<2} className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:opacity-50">Split selected</button>
      </form>
    </div>{message&&<p className="mt-3 text-sm text-cyan-300">{message}</p>}
  </section>;
}
