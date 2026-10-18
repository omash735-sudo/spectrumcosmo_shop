-- Phase 1 Rollback Script
-- Target Database: Neon PostgreSQL

BEGIN;

-- 1. Drop partial unique index on idempotency_key
DROP INDEX IF EXISTS idx_orders_idempotency_key;

-- 2. Drop idempotency_key and payload_hash columns from orders
ALTER TABLE orders
  DROP COLUMN IF EXISTS idempotency_key,
  DROP COLUMN IF EXISTS payload_hash;

COMMIT;

-- Post-Rollback Verification Query:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('idempotency_key', 'payload_hash');
