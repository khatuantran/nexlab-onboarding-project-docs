-- Hand-written migration: tsvector FTS for projects + uploads (US-005 / FR-SEARCH-002).
-- Mirrors the trigger pattern from 0001_fts_triggers.sql so that name/description/
-- filename/caption updates rebuild the search_vector lazily without app-side glue.

-- =========================================================================
-- uploads.caption (new optional column for FR-SEARCH-002 upload search).
-- =========================================================================
ALTER TABLE uploads ADD COLUMN caption text;
--> statement-breakpoint

-- =========================================================================
-- projects.search_vector — name (weight A) + description (weight B).
-- =========================================================================
ALTER TABLE projects ADD COLUMN search_vector tsvector;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION projects_rebuild_search_vector(project_id_arg uuid) RETURNS void AS $$
BEGIN
  UPDATE projects
  SET search_vector =
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  WHERE id = project_id_arg;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION projects_after_change() RETURNS trigger AS $$
BEGIN
  PERFORM projects_rebuild_search_vector(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER projects_fts_after_insert
AFTER INSERT ON projects
FOR EACH ROW EXECUTE FUNCTION projects_after_change();
--> statement-breakpoint

CREATE TRIGGER projects_fts_after_update
AFTER UPDATE OF name, description ON projects
FOR EACH ROW EXECUTE FUNCTION projects_after_change();
--> statement-breakpoint

-- Backfill existing rows.
UPDATE projects SET search_vector =
  setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'B');
--> statement-breakpoint

CREATE INDEX projects_search_vector_gin ON projects USING GIN (search_vector);
--> statement-breakpoint

-- =========================================================================
-- uploads.search_vector — filename (weight A) + caption (weight B).
-- =========================================================================
ALTER TABLE uploads ADD COLUMN search_vector tsvector;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION uploads_rebuild_search_vector(upload_id_arg uuid) RETURNS void AS $$
BEGIN
  UPDATE uploads
  SET search_vector =
    setweight(to_tsvector('simple', coalesce(filename, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(caption, '')), 'B')
  WHERE id = upload_id_arg;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION uploads_after_change() RETURNS trigger AS $$
BEGIN
  PERFORM uploads_rebuild_search_vector(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER uploads_fts_after_insert
AFTER INSERT ON uploads
FOR EACH ROW EXECUTE FUNCTION uploads_after_change();
--> statement-breakpoint

CREATE TRIGGER uploads_fts_after_update
AFTER UPDATE OF filename, caption ON uploads
FOR EACH ROW EXECUTE FUNCTION uploads_after_change();
--> statement-breakpoint

-- Backfill existing rows (uploads may have no rows yet — safe no-op).
UPDATE uploads SET search_vector =
  setweight(to_tsvector('simple', coalesce(filename, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(caption, '')), 'B');
--> statement-breakpoint

CREATE INDEX uploads_search_vector_gin ON uploads USING GIN (search_vector);
