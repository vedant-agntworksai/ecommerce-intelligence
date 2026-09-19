CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR PRIMARY KEY,
  value_json VARCHAR NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_canonical_brand ON canonical_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_canonical_identifiers ON canonical_products(gtin, upc, ean, model_number, mpn);
CREATE INDEX IF NOT EXISTS idx_canonical_category ON canonical_products(category, subcategory, product_type);
CREATE INDEX IF NOT EXISTS idx_retailer_canonical ON retailer_products(canonical_product_id);
CREATE INDEX IF NOT EXISTS idx_retailer_last_scraped ON retailer_products(last_scraped);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(retailer, retailer_product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_product_time ON historical_snapshots(canonical_product_id, captured_at);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at);
