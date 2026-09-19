import { unitPrice } from "@/lib/matching/units";

export function comparablePrice(price:number|null|undefined,quantity:number|null|undefined,unit:string|null|undefined){
  return unitPrice(price,quantity,unit);
}

export function pricePosition(source:number|null,market:number[]){
  if(source==null||!market.length)return null;
  const avg=market.reduce((a,b)=>a+b,0)/market.length;
  return {source,marketAverage:avg,difference:source-avg,percentDifference:avg?((source-avg)/avg)*100:null};
}
