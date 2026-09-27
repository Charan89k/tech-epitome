-- Keeps the tsvector columns current.
--
-- The columns and their GIN indexes are declared in schema.prisma (as
-- Unsupported("tsvector") plus @@index(type: Gin)), so Prisma owns those.
-- What Prisma cannot express is *how* each vector is populated, which is
-- what this migration adds. Functions and triggers are not introspected by
-- Prisma, so unlike an index, nothing here shows up as schema drift.
--
-- Weighting: 'A' titles and names, 'B' taglines, summaries and recognition
-- clues, 'C' body text. A hit in a title therefore outranks a hit buried in
-- a lesson, which is what a search box should do.

-- --------------------------------------------------------------------------
-- chapters
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION chapters_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW."title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."summary", '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW."objectives", ' ')), 'C') ||
    setweight(to_tsvector('english', array_to_string(NEW."keyTakeaways", ' ')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER chapters_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "title", "summary", "objectives", "keyTakeaways"
  ON "chapters"
  FOR EACH ROW EXECUTE FUNCTION chapters_search_vector_update();

-- --------------------------------------------------------------------------
-- patterns
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION patterns_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW."name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."tagline", '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW."recognitionClues", ' ')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."description", '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER patterns_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "name", "tagline", "description", "recognitionClues"
  ON "patterns"
  FOR EACH ROW EXECUTE FUNCTION patterns_search_vector_update();

-- --------------------------------------------------------------------------
-- problems
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION problems_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW."title", '')), 'A') ||
    setweight(to_tsvector('english', array_to_string(NEW."constraints", ' ')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER problems_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "title", "constraints"
  ON "problems"
  FOR EACH ROW EXECUTE FUNCTION problems_search_vector_update();

-- --------------------------------------------------------------------------
-- notes
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notes_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', coalesce(NEW."body", ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "body"
  ON "notes"
  FOR EACH ROW EXECUTE FUNCTION notes_search_vector_update();

-- --------------------------------------------------------------------------
-- system_design_problems
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sdp_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW."title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."tagline", '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW."functionalRequirements", ' ')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER sdp_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "title", "tagline", "functionalRequirements"
  ON "system_design_problems"
  FOR EACH ROW EXECUTE FUNCTION sdp_search_vector_update();

-- --------------------------------------------------------------------------
-- lld_problems
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION lld_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW."title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."tagline", '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW."requirements", ' ')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER lld_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "title", "tagline", "requirements"
  ON "lld_problems"
  FOR EACH ROW EXECUTE FUNCTION lld_search_vector_update();
