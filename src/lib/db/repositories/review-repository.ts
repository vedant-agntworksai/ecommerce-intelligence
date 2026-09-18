import type { Database } from "../types"; import type { NormalizedReview } from "@/lib/domain";
export class ReviewRepository{
 constructor(private db:Database){}
 async knownIds(retailer:string,productId:string){const {rows}=await this.db.query<{review_id:string}>("SELECT review_id FROM reviews WHERE retailer=$1 AND retailer_product_id=$2",[retailer,productId]);return new Set(rows.map(r=>r.review_id));}
 async newestDate(retailer:string,productId:string){const {rows}=await this.db.query<{d:string|null}>("SELECT MAX(review_date) d FROM reviews WHERE retailer=$1 AND retailer_product_id=$2",[retailer,productId]);return rows[0]?.d??null;}
 async insertMany(reviews:NormalizedReview[]){for(const r of reviews)await this.db.query(`INSERT INTO reviews(retailer,retailer_product_id,review_id,rating,title,review_text,reviewer_name,verified_purchase,review_date,helpful_votes,variant,scraped_at)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(retailer,retailer_product_id,review_id) DO NOTHING`,
 [r.retailer,r.retailerProductId,r.reviewId,r.rating,r.title,r.reviewText,r.reviewerName,r.verifiedPurchase,r.reviewDate,r.helpfulVotes,r.variant,r.scrapedAt]);}
}
