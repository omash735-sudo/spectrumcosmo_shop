-- Read-Only Preflight Checks for Spectrum Cosmo E-Commerce Phase 1

-- 1. Inspect orders table columns, constraints, and stock_deducted type/default
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Inspect order_items table columns, constraints, and foreign keys
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'order_items'
ORDER BY ordinal_position;

SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public'
  AND c.conrelid = 'order_items'::regclass;

-- 3. Inspect order_stock_reservations table (columns, order_id uniqueness, expires_at)
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'order_stock_reservations'
ORDER BY ordinal_position;

SELECT
    i.relname AS index_name,
    idx.indisunique AS is_unique,
    pg_get_indexdef(idx.indexrelid) AS index_definition
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class c ON c.oid = idx.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'order_stock_reservations';

-- 4. Inspect products table for price vs price_usd and stock columns
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name IN ('price', 'price_usd', 'stock', 'stock_quantity', 'reserved_stock')
ORDER BY ordinal_position;

-- 5. Inspect products stock column variance and count discrepancies
SELECT
    COUNT(*) AS total_products,
    COUNT(price) AS count_price,
    COUNT(price_usd) AS count_price_usd,
    COUNT(stock) AS count_stock,
    COUNT(stock_quantity) AS count_stock_quantity,
    COUNT(reserved_stock) AS count_reserved_stock
FROM products;

-- 6. Check existing indexes on orders table for idempotency_key
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'orders';
