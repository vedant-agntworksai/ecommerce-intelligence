import { getDb } from "@/lib/db";
import { BrandRepository } from "@/lib/db/repositories/brand-repository";
import { ProductRepository } from "@/lib/db/repositories/product-repository";
import { ReviewRepository } from "@/lib/db/repositories/review-repository";
import { CanonicalRepository } from "@/lib/db/repositories/canonical-repository";
import { CompetitorRepository } from "@/lib/db/repositories/competitor-repository";
import { SnapshotRepository } from "@/lib/db/repositories/snapshot-repository";
import { SettingsRepository } from "@/lib/db/repositories/settings-repository";
import { getRetailerAdapter } from "@/lib/retailers";
import { competitorScore, matchLabel } from "@/lib/matching/competitors";
import type { CanonicalProduct, NormalizedRetailerProduct, ProductReference } from "@/lib/domain";
import type { ScrapeJobPayload } from "./types";

async function collectIncrementalReviews(
  reviews: ReviewRepository,
  adapter: ReturnType<typeof getRetailerAdapter>,
  product: NormalizedRetailerProduct,
  maximumReviews: number,
  forceRefresh: boolean,
) {
  const known=await reviews.knownIds(product.retailer,product.productId);
  const rows=await adapter.scrapeReviews(product,{
    maxReviews:maximumReviews,
    incremental:true,
    knownReviewIds:[...known],
    forceRefresh,
  });
  const fresh=rows.filter(r=>!known.has(r.reviewId));
  await reviews.insertMany(fresh);
  return fresh.length;
}

export async function processScrapeJob(payload:ScrapeJobPayload){
  const db=await getDb();
  const brands=new BrandRepository(db);
  const products=new ProductRepository(db);
  const reviews=new ReviewRepository(db);
  const canonicals=new CanonicalRepository(db);
  const competitors=new CompetitorRepository(db);
  const snapshots=new SnapshotRepository(db);
  const settings=await new SettingsRepository(db).get();
  const adapter=getRetailerAdapter(payload.retailer);

  const brand=await brands.getOrCreate(payload.brand);
  const refs:ProductReference[]=payload.discoverProducts
    ? await adapter.discoverProducts(payload.startUrl,payload.brand)
    : [{retailer:payload.retailer,url:payload.startUrl}];

  const limited=(payload.maximumProducts==null?refs:refs.slice(0,payload.maximumProducts))
    .map(r=>({...r,forceRefresh:payload.forceRefresh}));

  let scraped=0,reused=0,newReviews=0,canonicalCreated=0,competitorLinks=0,competitorPdps=0,competitorReviews=0;

  for(const ref of limited){
    const knownListing=ref.retailerProductId
      ? await products.findRetailerProduct(payload.retailer,ref.retailerProductId)
      : null;

    let product:NormalizedRetailerProduct|null=null;
    let canonicalProduct:CanonicalProduct|null=null;

    if(knownListing&&!payload.forceRefresh){
      reused++;
      product=storedListingToProduct(knownListing);
      if(knownListing.canonical_product_id){
        canonicalProduct=await canonicals.getById(knownListing.canonical_product_id);
      }
      if(payload.collectProductReviews){
        newReviews+=await collectIncrementalReviews(reviews,adapter,product,payload.maximumReviewsPerProduct,false);
      }
    } else if(payload.collectPdp){
      product=await adapter.scrapeProduct(ref);
      const canonical=payload.matchCanonical?await canonicals.getOrCreate(brand,product):null;
      if(canonical?.created)canonicalCreated++;
      canonicalProduct=canonical?.product??null;
      await products.upsertRetailerProduct(product,canonicalProduct?.id??null);
      if(canonicalProduct)await snapshots.capture(canonicalProduct.id,product);
      scraped++;

      if(payload.collectProductReviews){
        newReviews+=await collectIncrementalReviews(reviews,adapter,product,payload.maximumReviewsPerProduct,payload.forceRefresh);
      }
    }

    if(!payload.findCompetitors||!canonicalProduct)continue;

    const local=await canonicals.competitorCandidates(canonicalProduct,150);
    let ranked=local
      .map(p=>({product:p,score:competitorScore(canonicalProduct!,p,settings.competitorSizeTolerance,settings.competitorWeights)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score);

    const requested=Math.max(1,payload.competitorsPerProduct);
    if(ranked.length<requested){
      const needed=requested-ranked.length;
      const candidates=await adapter.discoverCompetitorCandidates(canonicalProduct,{
        limit:requested,
        sizeTolerance:settings.competitorSizeTolerance,
      });

      // Bound paid candidate PDPs. Search results are filtered/reused first; we only
      // buy enough missing PDPs to fill the requested top set plus a small quality buffer.
      const maxMissingPdps=Math.max(needed,Math.min(needed*2,6));
      let paidCandidatePdps=0;

      for(const candidateRef of candidates){
        if(ranked.length>=requested&&paidCandidatePdps>=needed)break;

        const existingListing=candidateRef.retailerProductId
          ? await products.findRetailerProduct(payload.retailer,candidateRef.retailerProductId)
          : null;

        if(existingListing?.canonical_product_id){
          const existingCanonical=await canonicals.getById(existingListing.canonical_product_id);
          if(existingCanonical){
            const score=competitorScore(canonicalProduct,existingCanonical,settings.competitorSizeTolerance,settings.competitorWeights);
            if(score>0&&!ranked.some(x=>x.product.id===existingCanonical.id)){
              ranked.push({product:existingCanonical,score});
              ranked.sort((a,b)=>b.score-a.score);
            }
          }
          continue;
        }

        if(paidCandidatePdps>=maxMissingPdps)break;
        const candidate=await adapter.scrapeProduct(candidateRef);
        paidCandidatePdps++;
        competitorPdps++;

        if(!candidate.brand||candidate.brand.toLowerCase()===brand.name.toLowerCase())continue;
        const competitorBrand=await brands.getOrCreate(candidate.brand);
        const cc=await canonicals.getOrCreate(competitorBrand,candidate);
        await products.upsertRetailerProduct(candidate,cc.product.id);
        await snapshots.capture(cc.product.id,candidate);

        const score=competitorScore(canonicalProduct,cc.product,settings.competitorSizeTolerance,settings.competitorWeights);
        if(score>0&&!ranked.some(x=>x.product.id===cc.product.id)){
          ranked.push({product:cc.product,score});
          ranked.sort((a,b)=>b.score-a.score);
        }

        if(payload.collectCompetitorReviews){
          competitorReviews+=await collectIncrementalReviews(
            reviews,adapter,candidate,payload.maximumReviewsPerProduct,payload.forceRefresh
          );
        }
      }
    }

    const top=ranked.slice(0,requested);
    await competitors.replace(canonicalProduct.id,top.map(x=>({
      id:x.product.id,
      score:x.score,
      label:matchLabel(x.score),
      rationale:{
        localFirst:true,
        functionalCategory:canonicalProduct!.productType,
        sizeTolerance:settings.competitorSizeTolerance,
      },
    })));
    competitorLinks+=top.length;
  }

  return{
    brandId:brand.id,
    discovered:refs.length,
    considered:limited.length,
    scraped,
    reused,
    newReviews,
    canonicalCreated,
    competitorLinks,
    competitorPdps,
    competitorReviews,
  };
}

function storedListingToProduct(row:any):NormalizedRetailerProduct{
  return {
    retailer:row.retailer,
    productId:row.retailer_product_id,
    retailerSku:row.retailer_sku??null,
    asin:row.asin??null,
    upc:row.upc??null,gtin:row.gtin??null,ean:row.ean??null,modelNumber:row.model_number??null,mpn:row.mpn??null,
    title:row.title??null,productUrl:row.product_url,canonicalUrl:row.canonical_url??null,
    price:row.price==null?null:Number(row.price),originalPrice:row.original_price==null?null:Number(row.original_price),
    currency:row.currency??null,availability:row.availability??null,seller:row.seller??null,fulfilledBy:row.fulfilled_by??null,
    rating:row.rating==null?null:Number(row.rating),reviewCount:row.review_count==null?null:Number(row.review_count),
    images:[],features:[],specifications:{},variants:[],scrapedAt:String(row.last_scraped??new Date().toISOString()),
  };
}
