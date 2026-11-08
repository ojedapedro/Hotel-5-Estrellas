-- Init script for Hotel ERP PostgreSQL
-- Creates extensions needed for the project

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search

-- Set timezone
SET timezone = 'America/Caracas';
