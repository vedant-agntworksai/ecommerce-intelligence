export type ResourceKind =
  | "pdp_static" | "identifiers" | "specifications" | "images" | "price"
  | "availability" | "rating" | "review_count" | "review_page"
  | "competitor_relationship" | "retailer_search";

export const DEFAULT_TTLS_MS: Record<ResourceKind, number> = {
  pdp_static: 30*24*60*60*1000,
  identifiers: 90*24*60*60*1000,
  specifications: 30*24*60*60*1000,
  images: 30*24*60*60*1000,
  price: 24*60*60*1000,
  availability: 12*60*60*1000,
  rating: 7*24*60*60*1000,
  review_count: 7*24*60*60*1000,
  review_page: 24*60*60*1000,
  competitor_relationship: 30*24*60*60*1000,
  retailer_search: 7*24*60*60*1000,
};

export const PDP_RESOURCE_KINDS: ResourceKind[] = [
  "pdp_static","identifiers","specifications","images","price","availability","rating","review_count",
];

export function isFresh(updatedAt: Date | string | null | undefined, ttlMs: number) {
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() <= ttlMs;
}
