import type { Retailer } from "@/lib/domain";
export interface ScrapeJobPayload{
 brand:string;startUrl:string;retailer:Retailer;discoverProducts:boolean;collectPdp:boolean;matchCanonical:boolean;findCompetitors:boolean;
 collectProductReviews:boolean;collectCompetitorReviews:boolean;maximumProducts:number|null;maximumReviewsPerProduct:number;competitorsPerProduct:number;forceRefresh:boolean;
}
