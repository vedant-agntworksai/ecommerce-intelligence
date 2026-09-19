import { OxylabsRetailerAdapter } from "./oxylabs-adapter";
import type { NormalizedRetailerProduct } from "@/lib/domain";
export class HomeDepotAdapter extends OxylabsRetailerAdapter{
  readonly retailer="homedepot" as const;
  protected productIdFromUrl(url:string){return url.match(/\/(\d{6,})(?:\?|$)/)?.[1]??url;}
  protected searchUrl(q:string){return `https://www.homedepot.com/s/${encodeURIComponent(q)}`;}
  protected isProductUrl(url:string){return /homedepot\.com\/p\//i.test(url);}
  protected reviewPageUrl(product:NormalizedRetailerProduct,page:number){return `${product.productUrl}${product.productUrl.includes("?")?"&":"?"}reviewPage=${page}&sort=Newest#ratings-and-reviews`;}
}
