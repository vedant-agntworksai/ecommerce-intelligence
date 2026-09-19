export function formatNumber(value:number|null|undefined){
  if(value==null||!Number.isFinite(value))return "—";
  return new Intl.NumberFormat("en-US",{maximumFractionDigits:1}).format(value);
}
export function formatCurrency(value:number|null|undefined,currency="USD"){
  if(value==null||!Number.isFinite(value))return "—";
  try{return new Intl.NumberFormat("en-US",{style:"currency",currency,maximumFractionDigits:2}).format(value);}
  catch{return `${value.toFixed(2)} ${currency}`;}
}
export function formatDate(value:unknown){
  if(!value)return "—";
  const d=new Date(String(value));
  if(Number.isNaN(d.getTime()))return String(value);
  return new Intl.DateTimeFormat("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(d);
}
export function titleCase(value:string){
  return value.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
}
