export type Retailer = "amazon" | "walmart" | "lowes" | "homedepot";

export interface ProductReference {
  retailer: Retailer;
  retailerProductId?: string;
  url: string;
  titleHint?: string;
  forceRefresh?: boolean;
}

export interface CanonicalProduct {
  id: string; brandId: string; brand: string; title: string;
  category?: string | null; subcategory?: string | null; productType?: string | null; targetUse?: string | null; formulation?: string | null;
  modelNumber?: string | null; mpn?: string | null; upc?: string | null; gtin?: string | null; ean?: string | null;
  sizeText?: string | null; normalizedQuantity?: number | null; normalizedUnit?: string | null; packQuantity?: number | null;
}

export interface NormalizedRetailerProduct {
  retailer: Retailer; brand?: string | null; productId: string; retailerSku?: string | null; asin?: string | null;
  upc?: string | null; gtin?: string | null; ean?: string | null; modelNumber?: string | null; mpn?: string | null;
  title?: string | null; description?: string | null; category?: string | null; subcategory?: string | null; productType?: string | null;
  targetUse?: string | null; formulation?: string | null; sizeText?: string | null; normalizedQuantity?: number | null;
  normalizedUnit?: string | null; packQuantity?: number | null; productUrl: string; canonicalUrl?: string | null;
  price?: number | null; originalPrice?: number | null; currency?: string | null; availability?: string | null; seller?: string | null;
  fulfilledBy?: string | null; rating?: number | null; reviewCount?: number | null; images: string[]; features: string[];
  specifications: Record<string,string>; variants: unknown[]; scrapedAt: string; raw?: unknown;
}

export interface NormalizedReview {
  retailer: Retailer; retailerProductId: string; reviewId: string; rating?: number | null; title?: string | null; reviewText?: string | null;
  reviewerName?: string | null; verifiedPurchase?: boolean | null; reviewDate?: string | null; helpfulVotes?: number | null; variant?: string | null; scrapedAt: string;
}

export interface CompetitorSearchOptions { limit: number; sizeTolerance: number; }
export interface ReviewOptions {
  maxReviews: number;
  incremental: boolean;
  knownReviewIds?: string[];
  forceRefresh?: boolean;
}
