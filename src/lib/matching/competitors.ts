import type { CanonicalProduct } from "@/lib/domain";
import { normalizeText } from "./normalization";

export const DEFAULT_COMPETITOR_WEIGHTS={functionalCategory:.35,formulation:.20,size:.15,targetUse:.10,activeIngredient:.05,coverage:.05,price:.05,retailerAvailability:.05};

export function competitorScore(source:CanonicalProduct,candidate:CanonicalProduct,sizeTolerance=.25){
  if(source.brandId===candidate.brandId)return 0;
  const sameFunction=normalizeText(source.productType)===normalizeText(candidate.productType) && !!source.productType;
  if(!sameFunction)return 0;
  let score=DEFAULT_COMPETITOR_WEIGHTS.functionalCategory;
  if(source.formulation&&normalizeText(source.formulation)===normalizeText(candidate.formulation))score+=DEFAULT_COMPETITOR_WEIGHTS.formulation;
  if(source.targetUse&&normalizeText(source.targetUse)===normalizeText(candidate.targetUse))score+=DEFAULT_COMPETITOR_WEIGHTS.targetUse;
  if(source.normalizedUnit&&source.normalizedUnit===candidate.normalizedUnit&&source.normalizedQuantity&&candidate.normalizedQuantity){
    const ratio=candidate.normalizedQuantity/source.normalizedQuantity;
    if(ratio>=1-sizeTolerance&&ratio<=1+sizeTolerance)score+=DEFAULT_COMPETITOR_WEIGHTS.size;
  }
  return Math.min(score,1);
}
export function matchLabel(score:number){return score>=.8?"Very Close Match":score>=.6?"Close Match":"Alternative";}
