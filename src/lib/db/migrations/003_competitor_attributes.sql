ALTER TABLE canonical_products ADD COLUMN IF NOT EXISTS functional_category VARCHAR;
ALTER TABLE canonical_products ADD COLUMN IF NOT EXISTS active_ingredient VARCHAR;
ALTER TABLE canonical_products ADD COLUMN IF NOT EXISTS coverage VARCHAR;
ALTER TABLE canonical_products ADD COLUMN IF NOT EXISTS application_method VARCHAR;
ALTER TABLE canonical_products ADD COLUMN IF NOT EXISTS indoor_outdoor VARCHAR;
ALTER TABLE canonical_products ADD COLUMN IF NOT EXISTS refill_sprayer_type VARCHAR;
ALTER TABLE canonical_products ADD COLUMN IF NOT EXISTS attributes_json VARCHAR;

CREATE TABLE IF NOT EXISTS canonical_product_events (
  id VARCHAR PRIMARY KEY,
  event_type VARCHAR NOT NULL,
  target_product_id VARCHAR,
  source_product_ids_json VARCHAR,
  retailer_listing_ids_json VARCHAR,
  metadata_json VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_canonical_events_target ON canonical_product_events(target_product_id,created_at);
