import type { CanonicalProduct, CompetitorSearchOptions, NormalizedRetailerProduct, NormalizedReview, ProductReference, ReviewOptions } from "@/lib/domain";

export interface RetailerAdapter {
  readonly retailer: NormalizedRetailerProduct["retailer"];
  discoverProducts(startUrl: string, brand: string): Promise<ProductReference[]>;
  scrapeProduct(product: ProductReference): Promise<NormalizedRetailerProduct>;
  discoverCompetitorCandidates(product: CanonicalProduct, options: CompetitorSearchOptions): Promise<ProductReference[]>;
  scrapeReviews(product: NormalizedRetailerProduct, options: ReviewOptions): Promise<NormalizedReview[]>;
}

export function detectRetailer(url: string): NormalizedRetailerProduct["retailer"] {
  const host = new URL(url).hostname.replace(/^www\./,"").toLowerCase();
  if (host.includes("amazon.")) return "amazon";
  if (host.endsWith("walmart.com")) return "walmart";
  if (host.endsWith("lowes.com")) return "lowes";
  if (host.endsWith("homedepot.com")) return "homedepot";
  throw new Error("Unsupported retailer URL");
}
