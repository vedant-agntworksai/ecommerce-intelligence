import { OxylabsRetailerAdapter } from "./oxylabs-adapter";
import type { NormalizedRetailerProduct } from "@/lib/domain";
export class WalmartAdapter extends OxylabsRetailerAdapter{
  readonly retailer="walmart" as const;
  protected productIdFromUrl(url:string){return url.match(/\/ip\/(?:[^/]+\/)?(\d+)/)?.[1]??url;}
  protected searchUrl(q:string){return `https://www.walmart.com/search?q=${encodeURIComponent(q)}`;}
  protected isProductUrl(url:string){return /walmart\.com\/ip\//i.test(url);}
  protected reviewPageUrl(product:NormalizedRetailerProduct,page:number){return `${product.productUrl}${product.productUrl.includes("?")?"&":"?"}page=${page}&sort=submission-desc#reviews`;}
}
