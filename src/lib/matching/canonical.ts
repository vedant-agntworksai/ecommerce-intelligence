import type { CanonicalProduct, NormalizedRetailerProduct } from "@/lib/domain";
import { normalizeIdentifier, normalizeText } from "./normalization";

export type CanonicalMatch={product:CanonicalProduct;reason:string;confidence:"exact"|"strong"}|null;
export function matchCanonical(incoming:NormalizedRetailerProduct,candidates:CanonicalProduct[]):CanonicalMatch{
  const checks:[keyof NormalizedRetailerProduct,keyof CanonicalProduct,string][]=[
    ["gtin","gtin","exact GTIN"],["upc","upc","exact UPC"],["ean","ean","exact EAN"],
    ["modelNumber","modelNumber","exact manufacturer model"],["mpn","mpn","exact MPN"],
  ];
  for(const [ik,ck,reason] of checks){
    const v=normalizeIdentifier(incoming[ik] as string|null|undefined); if(!v)continue;
    const hit=candidates.find(c=>normalizeIdentifier(c[ck] as string|null|undefined)===v);
    if(hit)return{product:hit,reason,confidence:"exact"};
  }
  const brand=normalizeText(incoming.brand);
  const strong=candidates.find(c=>normalizeText(c.brand)===brand
    && !!incoming.productType && normalizeText(c.productType)===normalizeText(incoming.productType)
    && !!incoming.formulation && normalizeText(c.formulation)===normalizeText(incoming.formulation)
    && incoming.normalizedQuantity!=null && c.normalizedQuantity!=null
    && incoming.normalizedUnit===c.normalizedUnit
    && Math.abs(incoming.normalizedQuantity-c.normalizedQuantity)/Math.max(incoming.normalizedQuantity,1)<=0.05);
  return strong?{product:strong,reason:"strong normalized attribute match",confidence:"strong"}:null;
}
