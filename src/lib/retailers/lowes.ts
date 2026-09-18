import { OxylabsRetailerAdapter } from "./oxylabs-adapter";
export class LowesAdapter extends OxylabsRetailerAdapter{
  readonly retailer="lowes" as const;
  protected productIdFromUrl(url:string){return url.match(/\/(\d+)(?:\?|$)/)?.[1]??url;}
  protected searchUrl(q:string){return `https://www.lowes.com/search?searchTerm=${encodeURIComponent(q)}`;}
  protected isProductUrl(url:string){return /lowes\.com\/pd\//i.test(url);}
}
