import { OxylabsRetailerAdapter } from "./oxylabs-adapter";
import type { NormalizedRetailerProduct } from "@/lib/domain";
export class AmazonAdapter extends OxylabsRetailerAdapter{
  readonly retailer="amazon" as const;
  protected productIdFromUrl(url:string){return url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase()??url;}
  protected searchUrl(q:string){return `https://www.amazon.com/s?k=${encodeURIComponent(q)}`;}
  protected isProductUrl(url:string){return /amazon\.[^/]+\/(?:[^/]+\/)?(?:dp|gp\/product)\/[A-Z0-9]{10}/i.test(url);}
  protected reviewPageUrl(product:NormalizedRetailerProduct,page:number){
    const asin=product.asin??product.productId;
    return `https://www.amazon.com/product-reviews/${asin}/?sortBy=recent&pageNumber=${page}`;
  }
}
