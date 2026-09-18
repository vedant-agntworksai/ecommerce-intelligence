CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR PRIMARY KEY, name VARCHAR NOT NULL UNIQUE, slug VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS canonical_products (
  id VARCHAR PRIMARY KEY, brand_id VARCHAR NOT NULL, title VARCHAR, normalized_title VARCHAR,
  category VARCHAR, subcategory VARCHAR, product_type VARCHAR, target_use VARCHAR, formulation VARCHAR,
  model_number VARCHAR, mpn VARCHAR, upc VARCHAR, gtin VARCHAR, ean VARCHAR, size_text VARCHAR,
  normalized_quantity DOUBLE, normalized_unit VARCHAR, pack_quantity INTEGER, description VARCHAR,
  images_json VARCHAR, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS retailer_products (
  id VARCHAR DEFAULT gen_random_uuid()::VARCHAR,
  canonical_product_id VARCHAR, retailer VARCHAR NOT NULL, retailer_product_id VARCHAR NOT NULL,
  retailer_sku VARCHAR, asin VARCHAR, product_url VARCHAR NOT NULL, canonical_url VARCHAR, title VARCHAR,
  price DOUBLE, original_price DOUBLE, currency VARCHAR, availability VARCHAR, seller VARCHAR, fulfilled_by VARCHAR,
  rating DOUBLE, review_count BIGINT, upc VARCHAR, gtin VARCHAR, ean VARCHAR, model_number VARCHAR, mpn VARCHAR,
  raw_json VARCHAR, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_scraped TIMESTAMP,
  UNIQUE(retailer, retailer_product_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  retailer VARCHAR NOT NULL, retailer_product_id VARCHAR NOT NULL, review_id VARCHAR NOT NULL,
  rating DOUBLE, title VARCHAR, review_text VARCHAR, reviewer_name VARCHAR, verified_purchase BOOLEAN,
  review_date TIMESTAMP, helpful_votes BIGINT, variant VARCHAR, scraped_at TIMESTAMP,
  PRIMARY KEY(retailer, retailer_product_id, review_id)
);

CREATE TABLE IF NOT EXISTS competitor_relationships (
  source_product_id VARCHAR NOT NULL, competitor_product_id VARCHAR NOT NULL, label VARCHAR,
  score DOUBLE, rationale_json VARCHAR, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(source_product_id, competitor_product_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR PRIMARY KEY, type VARCHAR NOT NULL, status VARCHAR NOT NULL, payload_json VARCHAR NOT NULL,
  result_json VARCHAR, error VARCHAR, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP, finished_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historical_snapshots (
  id VARCHAR PRIMARY KEY, canonical_product_id VARCHAR, retailer_product_id VARCHAR,
  price DOUBLE, rating DOUBLE, review_count BIGINT, availability VARCHAR,
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_cache (
  resource_key VARCHAR NOT NULL, resource_kind VARCHAR NOT NULL, payload_json VARCHAR NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(resource_key, resource_kind)
);
