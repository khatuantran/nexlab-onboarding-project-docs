-- Hand-written migration: unaccent + pg_trgm support for search v2.1
-- (US-006 / FR-SEARCH-004 — prefix + accent-insensitive + fuzzy match).
--
-- Strategy:
--   1. Enable `unaccent` + `pg_trgm` extensions.
--   2. Wrap unaccent as IMMUTABLE (Postgres' built-in unaccent is STABLE,
--      which prevents use in functional indexes / generated expressions).
--   3. Replace the 3 *_rebuild_search_vector trigger functions to apply
--      immutable_unaccent so tsvector lexemes are accent-stripped at index
--      time. Backfill existing rows by re-firing each function.
--   4. Add 4 trigram GIN indexes over immutable_unaccent(<short_field>) to
--      support fuzzy fallback ranking on projects.name, features.title,
--      users.display_name, uploads.filename.

-- =========================================================================
-- Extensions + immutable wrapper
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint

CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION immutable_unaccent(text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
  STRICT
AS $$ SELECT public.unaccent('public.unaccent', $1) $$;
--> statement-breakpoint

-- A text search configuration that strips diacritics during tokenization.
-- Using this config in plainto_tsquery + ts_headline lets the highlighter
-- re-tokenize the original (accented) text on the fly so <mark> wraps the
-- correct substring even when stored vectors are unaccent-normalized.
DROP TEXT SEARCH CONFIGURATION IF EXISTS public.simple_unaccent;
--> statement-breakpoint

CREATE TEXT SEARCH CONFIGURATION public.simple_unaccent ( COPY = pg_catalog.simple );
--> statement-breakpoint

ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH public.unaccent, pg_catalog.simple;
--> statement-breakpoint

-- =========================================================================
-- features_rebuild_search_vector — wrap title + section bodies with unaccent
-- =========================================================================
CREATE OR REPLACE FUNCTION features_rebuild_search_vector(feature_id_arg uuid)
RETURNS void AS $$
BEGIN
  UPDATE features
  SET search_vector =
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(title, ''))), 'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(
      coalesce(
        (SELECT string_agg(body, ' ') FROM sections WHERE feature_id = feature_id_arg),
        ''
      )
    )), 'B')
  WHERE id = feature_id_arg;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- =========================================================================
-- projects_rebuild_search_vector — wrap name + description with unaccent
-- =========================================================================
CREATE OR REPLACE FUNCTION projects_rebuild_search_vector(project_id_arg uuid) RETURNS void AS $$
BEGIN
  UPDATE projects
  SET search_vector =
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(name, ''))), 'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(description, ''))), 'B')
  WHERE id = project_id_arg;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- =========================================================================
-- uploads_rebuild_search_vector — wrap filename + caption with unaccent
-- =========================================================================
CREATE OR REPLACE FUNCTION uploads_rebuild_search_vector(upload_id_arg uuid) RETURNS void AS $$
BEGIN
  UPDATE uploads
  SET search_vector =
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(filename, ''))), 'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(caption, ''))), 'B')
  WHERE id = upload_id_arg;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- =========================================================================
-- Backfill: re-fire each rebuild fn for every existing row.
-- Pilot scale (< 100 rows total) → straightforward UPDATE-by-id loop equivalent.
-- =========================================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM features LOOP
    PERFORM features_rebuild_search_vector(r.id);
  END LOOP;
  FOR r IN SELECT id FROM projects LOOP
    PERFORM projects_rebuild_search_vector(r.id);
  END LOOP;
  FOR r IN SELECT id FROM uploads LOOP
    PERFORM uploads_rebuild_search_vector(r.id);
  END LOOP;
END $$;
--> statement-breakpoint

-- =========================================================================
-- Trigram GIN indexes for fuzzy fallback on short fields (FR-SEARCH-004).
-- Section.body is intentionally excluded (long text → trigram noise + bloat).
-- =========================================================================
CREATE INDEX projects_name_trgm_idx
  ON projects USING gin (immutable_unaccent(name) gin_trgm_ops);
--> statement-breakpoint

CREATE INDEX features_title_trgm_idx
  ON features USING gin (immutable_unaccent(title) gin_trgm_ops);
--> statement-breakpoint

CREATE INDEX users_display_name_trgm_idx
  ON users USING gin (immutable_unaccent(display_name) gin_trgm_ops);
--> statement-breakpoint

CREATE INDEX uploads_filename_trgm_idx
  ON uploads USING gin (immutable_unaccent(filename) gin_trgm_ops);
