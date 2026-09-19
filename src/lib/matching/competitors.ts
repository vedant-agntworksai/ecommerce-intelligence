import type { CanonicalProduct } from "@/lib/domain";
import { normalizeText } from "./normalization";

export const DEFAULT_COMPETITOR_WEIGHTS={
  functionalCategory:.35,formulation:.20,size:.15,targetUse:.10,activeIngredient:.05,coverage:.05,price:.05,retailerAvailability:.05,
};
export type CompetitorWeights=typeof DEFAULT_COMPETITOR_WEIGHTS;

export function competitorScore(source:CanonicalProduct,candidate:CanonicalProduct,sizeTolerance=.25,weights:CompetitorWeights=DEFAULT_COMPETITOR_WEIGHTS){
  if(source.brandId===candidate.brandId)return 0;
  const sourceFunction=normalizeText(source.functionalCategory||source.productType||source.subcategory||source.category);
  const candidateFunction=normalizeText(candidate.functionalCategory||candidate.productType||candidate.subcategory||candidate.category);
  if(!sourceFunction||sourceFunction!==candidateFunction)return 0;

  let score=weights.functionalCategory;
  if(source.formulation&&normalizeText(source.formulation)===normalizeText(candidate.formulation))score+=weights.formulation;
  if(source.targetUse&&normalizeText(source.targetUse)===normalizeText(candidate.targetUse))score+=weights.targetUse;
  if(source.activeIngredient&&candidate.activeIngredient&&normalizeText(source.activeIngredient)===normalizeText(candidate.activeIngredient))score+=weights.activeIngredient;
  if(source.coverage&&candidate.coverage&&normalizeText(source.coverage)===normalizeText(candidate.coverage))score+=weights.coverage;
  if(source.normalizedUnit&&source.normalizedUnit===candidate.normalizedUnit&&source.normalizedQuantity&&candidate.normalizedQuantity){
    const ratio=candidate.normalizedQuantity/source.normalizedQuantity;
    if(ratio>=1-sizeTolerance&&ratio<=1+sizeTolerance)score+=weights.size;
  }
  // Price and retailer availability are added by market analytics when current listings exist.
  return Math.min(score,1);
}
export function matchLabel(score:number){return score>=.8?"Very Close Match":score>=.6?"Close Match":"Alternative";}
