import { OxylabsRetailerAdapter } from "./oxylabs-adapter";
import type { NormalizedRetailerProduct } from "@/lib/domain";
export class LowesAdapter extends OxylabsRetailerAdapter{
  readonly retailer="lowes" as const;
  protected productIdFromUrl(url:string){return url.match(/\/(\d+)(?:\?|$)/)?.[1]??url;}
  protected searchUrl(q:string){return `https://www.lowes.com/search?searchTerm=${encodeURIComponent(q)}`;}
  protected isProductUrl(url:string){return /lowes\.com\/pd\//i.test(url);}
  protected reviewPageUrl(product:NormalizedRetailerProduct,page:number){return `${product.productUrl}${product.productUrl.includes("?")?"&":"?"}reviewPage=${page}&reviewSort=Newest#reviews`;}
}
