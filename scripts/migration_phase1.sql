-- Phase 1 Migration Script: Idempotency, Payload Hash & Schema Safeguards
-- Target Database: Neon PostgreSQL
-- DO NOT RUN AUTOMATICALLY — Execute in Neon Console after reviewing preflight results.

BEGIN;

-- 1. Add idempotency_key and payload_hash columns to orders table safely
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payload_hash VARCHAR(64);

-- 2. Create partial unique index on idempotency_key (allows multiple NULLs for legacy/non-idempotent orders)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key
  ON orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMIT;

-- Post-Migration Verification Queries:
-- 1. Verify idempotency columns and index presence
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('idempotency_key', 'payload_hash');
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'orders' AND indexname = 'idx_orders_idempotency_key';
