import type { CanonicalProduct } from "@/lib/domain";
import { normalizeText } from "./normalization";

export const DEFAULT_COMPETITOR_WEIGHTS={
  functionalCategory:.35,
  formulation:.20,
  size:.15,
  targetUse:.10,
  activeIngredient:.05,
  coverage:.05,
  price:.05,
  retailerAvailability:.05,
};

export type CompetitorWeights=typeof DEFAULT_COMPETITOR_WEIGHTS;

export function competitorScore(
  source:CanonicalProduct,
  candidate:CanonicalProduct,
  sizeTolerance=.25,
  weights:CompetitorWeights=DEFAULT_COMPETITOR_WEIGHTS,
){
  if(source.brandId===candidate.brandId)return 0;

  const sourceFunction=normalizeText(source.productType||source.subcategory||source.category);
  const candidateFunction=normalizeText(candidate.productType||candidate.subcategory||candidate.category);
  if(!sourceFunction||sourceFunction!==candidateFunction)return 0;

  let score=weights.functionalCategory;

  if(source.formulation&&normalizeText(source.formulation)===normalizeText(candidate.formulation)){
    score+=weights.formulation;
  }
  if(source.targetUse&&normalizeText(source.targetUse)===normalizeText(candidate.targetUse)){
    score+=weights.targetUse;
  }
  if(source.normalizedUnit&&source.normalizedUnit===candidate.normalizedUnit&&source.normalizedQuantity&&candidate.normalizedQuantity){
    const ratio=candidate.normalizedQuantity/source.normalizedQuantity;
    if(ratio>=1-sizeTolerance&&ratio<=1+sizeTolerance)score+=weights.size;
  }

  // Active ingredient, coverage, pricing and retailer availability are intentionally
  // added by analytics when those normalized fields/listings exist; absent data is never invented.
  return Math.min(score,1);
}

export function matchLabel(score:number){
  return score>=.8?"Very Close Match":score>=.6?"Close Match":"Alternative";
}
