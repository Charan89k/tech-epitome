-- Postgres extensions the schema depends on.
--
-- Kept in its own migration that sorts first, because the initial migration
-- creates a gin_trgm_ops index on problems.title and that operator class
-- does not exist until pg_trgm is installed. `migrate dev` replays migrations
-- in order against the shadow database too, so the ordering holds there.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
