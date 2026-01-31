-- Drop tables in reverse order (respecting foreign key constraints)
DROP TABLE IF EXISTS "Price";
DROP TABLE IF EXISTS "Store";
DROP TABLE IF EXISTS "Product";
DROP TABLE IF EXISTS "Category";

-- Drop extension
DROP EXTENSION IF EXISTS "uuid-ossp";
