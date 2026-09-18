import { getDb } from "@/lib/db"; import { BrandRepository } from "@/lib/db/repositories/brand-repository"; import { ProductRepository } from "@/lib/db/repositories/product-repository";
import { ReviewRepository } from "@/lib/db/repositories/review-repository"; import { getRetailerAdapter } from "@/lib/retailers"; import type { ScrapeJobPayload } from "./types";
export async function processScrapeJob(payload:ScrapeJobPayload){
 const db=await getDb(),brands=new BrandRepository(db),products=new ProductRepository(db),reviews=new ReviewRepository(db),adapter=getRetailerAdapter(payload.retailer);
 const brand=await brands.getOrCreate(payload.brand);
 const refs=payload.discoverProducts?await adapter.discoverProducts(payload.startUrl,payload.brand):[{retailer:payload.retailer,url:payload.startUrl}];
 const limited=(payload.maximumProducts==null?refs:refs.slice(0,payload.maximumProducts)).map(r=>({...r,forceRefresh:payload.forceRefresh}));
 let scraped=0,reused=0,newReviews=0;
 for(const ref of limited){const id=ref.retailerProductId;const existing=id?await products.findRetailerProduct(payload.retailer,id):null;if(existing&&!payload.forceRefresh){reused++;continue;}if(!payload.collectPdp)continue;const product=await adapter.scrapeProduct(ref);await products.upsertRetailerProduct(product,null);scraped++;if(payload.collectProductReviews){const known=await reviews.knownIds(product.retailer,product.productId);const rows=await adapter.scrapeReviews(product,{maxReviews:payload.maximumReviewsPerProduct,incremental:true});const fresh=rows.filter(r=>!known.has(r.reviewId));await reviews.insertMany(fresh);newReviews+=fresh.length;}}
 return{brandId:brand.id,discovered:refs.length,considered:limited.length,scraped,reused,newReviews};
}
