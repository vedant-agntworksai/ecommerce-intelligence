import type { RetailerAdapter } from "./base";
import type { CanonicalProduct, CompetitorSearchOptions, NormalizedRetailerProduct, NormalizedReview, ProductReference, Retailer, ReviewOptions } from "@/lib/domain";
import { PDP_RESOURCE_KINDS } from "@/lib/cache/policy";
import { CostOptimizedScraper } from "@/lib/oxylabs/scraper";
import { parseMeasure } from "@/lib/matching/units";

export abstract class OxylabsRetailerAdapter implements RetailerAdapter {
  protected scraper=new CostOptimizedScraper();
  abstract readonly retailer:Retailer;
  protected abstract productIdFromUrl(url:string):string;
  protected sourceFor(_kind:"listing"|"product"|"reviews"){return "universal";}
  protected reviewPageUrl(product:NormalizedRetailerProduct,page:number){return page===1?product.productUrl:`${product.productUrl}${product.productUrl.includes("?")?"&":"?"}page=${page}#reviews`;}

  async discoverProducts(startUrl:string,brand:string):Promise<ProductReference[]>{
    const key=`${this.retailer}:search:${startUrl}`;
    const {data}=await this.scraper.getOrFetch<any>(key,"retailer_search",{source:this.sourceFor("listing"),url:startUrl,parse:true});
    const links=this.extractLinks(data).filter((u:string)=>this.isProductUrl(u));
    return [...new Set(links)].map(url=>({retailer:this.retailer,retailerProductId:this.productIdFromUrl(url),url}));
  }

  async scrapeProduct(ref:ProductReference):Promise<NormalizedRetailerProduct>{
    const id=ref.retailerProductId||this.productIdFromUrl(ref.url);
    const {data}=await this.scraper.getOrFetch<any>(
      `${this.retailer}:pdp:${id}`,
      PDP_RESOURCE_KINDS,
      {source:this.sourceFor("product"),url:ref.url,parse:true},
      Boolean(ref.forceRefresh)
    );
    return this.normalizeProduct(data,ref.url,id);
  }

  async discoverCompetitorCandidates(product:CanonicalProduct,options:CompetitorSearchOptions):Promise<ProductReference[]>{
    const q=[product.productType,product.targetUse,product.formulation,product.sizeText].filter(Boolean).join(" ");
    if(!q)return[];
    return (await this.discoverProducts(this.searchUrl(q),"")).slice(0,Math.max(options.limit*3,10));
  }

  async scrapeReviews(product:NormalizedRetailerProduct,options:ReviewOptions):Promise<NormalizedReview[]>{
    const known=new Set(options.knownReviewIds??[]);
    const collected:NormalizedReview[]=[];
    const maxPages=Math.max(1,Math.min(100,Math.ceil(options.maxReviews/20)+2));
    for(let page=1;page<=maxPages&&collected.length<options.maxReviews;page++){
      const url=this.reviewPageUrl(product,page);
      const {data}=await this.scraper.getOrFetch<any>(
        `${this.retailer}:reviews:${product.productId}:page:${page}`,
        "review_page",
        {source:this.sourceFor("reviews"),url,parse:true},
        Boolean(options.forceRefresh)
      );
      const rows=this.normalizeReviews(data,product.productId);
      if(!rows.length)break;
      let hitKnown=false;
      for(const review of rows){
        if(known.has(review.reviewId)){hitKnown=true;continue;}
        collected.push(review);
        if(collected.length>=options.maxReviews)break;
      }
      if(options.incremental&&hitKnown)break;
    }
    return collected;
  }

  protected abstract searchUrl(query:string):string;
  protected abstract isProductUrl(url:string):boolean;

  protected extractLinks(data:any):string[]{
    const text=JSON.stringify(data);
    const matches=text.match(/https?:\\?\/\\?\/[^"\\\s]+/g)??[];
    return matches.map((x:string)=>x.replace(/\\u002F/g,"/").replace(/\\\//g,"/"));
  }

  protected normalizeProduct(data:any,url:string,id:string):NormalizedRetailerProduct{
    const r=data?.results?.[0]?.content??data?.results?.[0]??data?.content??data??{};
    const p=r?.results?.[0]??r?.product??r;
    const sizeText=p.size??p.size_text??p.net_content??null;
    const measure=parseMeasure(sizeText);
    return {
      retailer:this.retailer,productId:id,retailerSku:p.sku??null,asin:p.asin??null,brand:p.brand??null,
      upc:p.upc??null,gtin:p.gtin??null,ean:p.ean??null,modelNumber:p.model_number??p.model??null,mpn:p.mpn??null,
      title:p.title??null,description:p.description??null,category:p.category??null,subcategory:p.subcategory??null,
      productType:p.product_type??p.type??null,targetUse:p.target_use??null,formulation:p.formulation??null,sizeText,
      normalizedQuantity:measure?.quantity??null,normalizedUnit:measure?.unit??null,packQuantity:p.pack_quantity??null,
      productUrl:url,canonicalUrl:p.canonical_url??null,
      price:typeof p.price==="number"?p.price:null,originalPrice:typeof p.original_price==="number"?p.original_price:null,
      currency:p.currency??"USD",availability:p.availability??null,seller:p.seller??null,fulfilledBy:p.fulfilled_by??null,
      rating:typeof p.rating==="number"?p.rating:null,reviewCount:typeof p.review_count==="number"?p.review_count:null,
      images:Array.isArray(p.images)?p.images:[],features:Array.isArray(p.features)?p.features:[],
      specifications:p.specifications&&typeof p.specifications==="object"?p.specifications:{},
      variants:Array.isArray(p.variants)?p.variants:[],scrapedAt:new Date().toISOString(),raw:data
    };
  }

  protected normalizeReviews(data:any,productId:string):NormalizedReview[]{
    const r=data?.results?.[0]?.content??data?.content??data;
    const rows=Array.isArray(r?.reviews)?r.reviews:Array.isArray(r?.results?.reviews)?r.results.reviews:Array.isArray(r)?r:[];
    return rows.filter((x:any)=>x?.id||x?.review_id).map((x:any)=>({
      retailer:this.retailer,retailerProductId:productId,reviewId:String(x.id??x.review_id),
      rating:typeof x.rating==="number"?x.rating:Number.isFinite(Number(x.rating))?Number(x.rating):null,
      title:x.title??null,reviewText:x.text??x.review_text??x.body??null,reviewerName:x.author??x.reviewer_name??null,
      verifiedPurchase:x.verified_purchase??x.verified??null,reviewDate:x.date??x.review_date??null,
      helpfulVotes:x.helpful_votes??null,variant:x.variant??null,scrapedAt:new Date().toISOString()
    }));
  }
}
