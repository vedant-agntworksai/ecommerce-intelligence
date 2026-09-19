import type { Database } from "@/lib/db/types";

const n=(v:unknown)=>v==null?0:Number(v);

export async function getOverviewAnalytics(db:Database){
  const scalar=async(sql:string)=>{
    const {rows}=await db.query<any>(sql);
    return n(rows[0]?.n);
  };

  const [brands,products,listings,productsWithReviews,totalReviews,competitors,retailers]=await Promise.all([
    scalar("SELECT COUNT(*) n FROM brands"),
    scalar("SELECT COUNT(*) n FROM canonical_products"),
    scalar("SELECT COUNT(*) n FROM retailer_products"),
    scalar(`SELECT COUNT(DISTINCT rp.canonical_product_id) n
            FROM retailer_products rp
            JOIN reviews r ON r.retailer=rp.retailer AND r.retailer_product_id=rp.retailer_product_id
            WHERE rp.canonical_product_id IS NOT NULL`),
    scalar("SELECT COUNT(*) n FROM reviews"),
    scalar("SELECT COUNT(*) n FROM competitor_relationships"),
    scalar("SELECT COUNT(DISTINCT retailer) n FROM retailer_products"),
  ]);
  const avgRatingRows=await db.query<any>("SELECT AVG(rating) n FROM reviews WHERE rating IS NOT NULL");
  const averageRating=avgRatingRows.rows[0]?.n==null?null:Number(avgRatingRows.rows[0].n);

  const quality=(await db.query<any>(`
    SELECT
      SUM(CASE WHEN upc IS NULL OR TRIM(upc)='' THEN 1 ELSE 0 END) missing_upc,
      SUM(CASE WHEN gtin IS NULL OR TRIM(gtin)='' THEN 1 ELSE 0 END) missing_gtin,
      SUM(CASE WHEN model_number IS NULL OR TRIM(model_number)='' THEN 1 ELSE 0 END) missing_model
    FROM canonical_products
  `)).rows[0]??{};

  const missingPrice=await scalar(`
    SELECT COUNT(*) n FROM canonical_products cp
    WHERE NOT EXISTS (
      SELECT 1 FROM retailer_products rp
      WHERE rp.canonical_product_id=cp.id AND rp.price IS NOT NULL
    )
  `);
  const withoutReviews=await scalar(`
    SELECT COUNT(*) n FROM canonical_products cp
    WHERE NOT EXISTS (
      SELECT 1 FROM retailer_products rp
      JOIN reviews r ON r.retailer=rp.retailer AND r.retailer_product_id=rp.retailer_product_id
      WHERE rp.canonical_product_id=cp.id
    )
  `);
  const coverage=(await db.query<any>(`
    SELECT
      SUM(CASE WHEN retailer_count > 1 THEN 1 ELSE 0 END) multi_retailer,
      SUM(CASE WHEN retailer_count = 1 THEN 1 ELSE 0 END) single_retailer
    FROM (
      SELECT cp.id, COUNT(DISTINCT rp.retailer) retailer_count
      FROM canonical_products cp
      LEFT JOIN retailer_products rp ON rp.canonical_product_id=cp.id
      GROUP BY cp.id
    ) x
  `)).rows[0]??{};

  const productsDiscovered=(await db.query<any>(`
    SELECT CAST(created_at AS DATE) day, COUNT(*) value
    FROM canonical_products GROUP BY CAST(created_at AS DATE) ORDER BY day
  `)).rows.map(r=>({label:String(r.day).slice(0,10),value:n(r.value)}));
  const reviewsCollected=(await db.query<any>(`
    SELECT CAST(scraped_at AS DATE) day, COUNT(*) value
    FROM reviews WHERE scraped_at IS NOT NULL
    GROUP BY CAST(scraped_at AS DATE) ORDER BY day
  `)).rows.map(r=>({label:String(r.day).slice(0,10),value:n(r.value)}));
  const productsByRetailer=(await db.query<any>(`
    SELECT retailer label, COUNT(DISTINCT canonical_product_id) value
    FROM retailer_products WHERE canonical_product_id IS NOT NULL
    GROUP BY retailer ORDER BY value DESC
  `)).rows.map(r=>({label:r.label,value:n(r.value)}));
  const productsByBrand=(await db.query<any>(`
    SELECT b.name label, COUNT(cp.id) value
    FROM brands b LEFT JOIN canonical_products cp ON cp.brand_id=b.id
    GROUP BY b.id,b.name ORDER BY value DESC LIMIT 12
  `)).rows.map(r=>({label:r.label,value:n(r.value)}));
  const ratingDistribution=(await db.query<any>(`
    SELECT CAST(FLOOR(rating) AS INTEGER) star, COUNT(*) value
    FROM reviews WHERE rating IS NOT NULL
    GROUP BY CAST(FLOOR(rating) AS INTEGER) ORDER BY star
  `)).rows.map(r=>({label:`${r.star} star`,value:n(r.value)}));
  const priceHistory=(await db.query<any>(`
    SELECT CAST(captured_at AS DATE) day, AVG(price) value
    FROM historical_snapshots WHERE price IS NOT NULL
    GROUP BY CAST(captured_at AS DATE) ORDER BY day
  `)).rows.map(r=>({label:String(r.day).slice(0,10),value:Number(r.value)}));

  const recentProducts=(await db.query<any>(`
    SELECT cp.id,cp.title,b.name brand,cp.created_at,cp.updated_at
    FROM canonical_products cp JOIN brands b ON b.id=cp.brand_id
    ORDER BY cp.created_at DESC LIMIT 8
  `)).rows;
  const recentUpdated=(await db.query<any>(`
    SELECT cp.id,cp.title,b.name brand,cp.updated_at
    FROM canonical_products cp JOIN brands b ON b.id=cp.brand_id
    ORDER BY cp.updated_at DESC LIMIT 8
  `)).rows;
  const recentFailures=(await db.query<any>(`
    SELECT id,type,error,created_at,finished_at FROM jobs
    WHERE status='failed' ORDER BY created_at DESC LIMIT 8
  `)).rows;

  return {
    kpis:{brands,products,listings,productsWithReviews,totalReviews,averageRating,competitors,retailers},
    quality:{
      missingUpc:n(quality.missing_upc),missingGtin:n(quality.missing_gtin),missingModel:n(quality.missing_model),
      missingPrice,withoutReviews,multiRetailer:n(coverage.multi_retailer),singleRetailer:n(coverage.single_retailer),
    },
    charts:{productsDiscovered,reviewsCollected,productsByRetailer,productsByBrand,ratingDistribution,priceHistory},
    recentProducts,recentUpdated,recentFailures,
  };
}
