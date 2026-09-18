import { getDb } from "@/lib/db";
import { BrandRepository } from "@/lib/db/repositories/brand-repository";
import { ProductRepository } from "@/lib/db/repositories/product-repository";
import { ReviewRepository } from "@/lib/db/repositories/review-repository";
import { CanonicalRepository } from "@/lib/db/repositories/canonical-repository";
import { CompetitorRepository } from "@/lib/db/repositories/competitor-repository";
import { SnapshotRepository } from "@/lib/db/repositories/snapshot-repository";
import { getRetailerAdapter } from "@/lib/retailers";
import { competitorScore, matchLabel } from "@/lib/matching/competitors";
import type { ScrapeJobPayload } from "./types";

export async function processScrapeJob(payload:ScrapeJobPayload){
 const db=await getDb(),brands=new BrandRepository(db),products=new ProductRepository(db),reviews=new ReviewRepository(db),canonicals=new CanonicalRepository(db),competitors=new CompetitorRepository(db),snapshots=new SnapshotRepository(db),adapter=getRetailerAdapter(payload.retailer);
 const brand=await brands.getOrCreate(payload.brand);
 const refs=payload.discoverProducts?await adapter.discoverProducts(payload.startUrl,payload.brand):[{retailer:payload.retailer,url:payload.startUrl}];
 const limited=(payload.maximumProducts==null?refs:refs.slice(0,payload.maximumProducts)).map(r=>({...r,forceRefresh:payload.forceRefresh}));
 let scraped=0,reused=0,newReviews=0,canonicalCreated=0,competitorLinks=0;
 for(const ref of limited){
   const knownListing=ref.retailerProductId?await products.findRetailerProduct(payload.retailer,ref.retailerProductId):null;
   if(knownListing&&!payload.forceRefresh){reused++;continue;}
   if(!payload.collectPdp)continue;
   const product=await adapter.scrapeProduct(ref);
   const canonical=payload.matchCanonical?await canonicals.getOrCreate(brand,product):null;
   if(canonical?.created)canonicalCreated++;
   await products.upsertRetailerProduct(product,canonical?.product.id??null);
   if(canonical)await snapshots.capture(canonical.product.id,product);
   if(payload.collectProductReviews){
     const known=await reviews.knownIds(product.retailer,product.productId);
     const rows=await adapter.scrapeReviews(product,{maxReviews:payload.maximumReviewsPerProduct,incremental:true});
     const fresh=rows.filter(r=>!known.has(r.reviewId));await reviews.insertMany(fresh);newReviews+=fresh.length;
   }
   if(payload.findCompetitors&&canonical){
     const local=await canonicals.competitorCandidates(canonical.product,100);
     let ranked=local.map(p=>({product:p,score:competitorScore(canonical.product,p,.25)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
     if(ranked.length<payload.competitorsPerProduct){
       const refs=await adapter.discoverCompetitorCandidates(canonical.product,{limit:payload.competitorsPerProduct,sizeTolerance:.25});
       for(const candidateRef of refs){
         const cid=candidateRef.retailerProductId;
         if(cid&&await products.findRetailerProduct(payload.retailer,cid))continue;
         if(ranked.length>=payload.competitorsPerProduct)break;
         const candidate=await adapter.scrapeProduct(candidateRef);
         if(!candidate.brand||candidate.brand.toLowerCase()===brand.name.toLowerCase())continue;
         const competitorBrand=await brands.getOrCreate(candidate.brand);
         const cc=await canonicals.getOrCreate(competitorBrand,candidate);
         await products.upsertRetailerProduct(candidate,cc.product.id);
         ranked.push({product:cc.product,score:competitorScore(canonical.product,cc.product,.25)});
         ranked=ranked.filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
       }
     }
     const top=ranked.slice(0,payload.competitorsPerProduct);
     await competitors.replace(canonical.product.id,top.map(x=>({id:x.product.id,score:x.score,label:matchLabel(x.score),rationale:{localFirst:true,functionalCategory:canonical.product.productType,sizeTolerance:.25}})));
     competitorLinks+=top.length;
   }
 }
 return{brandId:brand.id,discovered:refs.length,considered:limited.length,scraped,reused,newReviews,canonicalCreated,competitorLinks};
}
