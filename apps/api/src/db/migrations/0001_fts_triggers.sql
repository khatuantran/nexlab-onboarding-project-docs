-- Hand-written migration: tsvector FTS + updated_at auto-touch triggers.
-- Reason: drizzle-kit doesn't emit tsvector columns or pg triggers (as of 0.30).
-- This is NEW file alongside the drizzle-generated 0000_*.sql — not an edit
-- of a committed migration. See docs/conventions-be.md §5.

-- =========================================================================
-- updated_at auto-touch
-- =========================================================================
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER projects_touch_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint

CREATE TRIGGER features_touch_updated_at
BEFORE UPDATE ON features
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint

CREATE TRIGGER sections_touch_updated_at
BEFORE UPDATE ON sections
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint

-- =========================================================================
-- Full-text search on features (FR-SEARCH-001)
-- search_vector aggregates title (weight A) + all section bodies (weight B).
-- Recomputed via trigger on features OR its sections changing.
-- =========================================================================
ALTER TABLE features ADD COLUMN search_vector tsvector;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION features_rebuild_search_vector(feature_id_arg uuid)
RETURNS void AS $$
BEGIN
  UPDATE features
  SET search_vector =
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple',
      coalesce(
        (SELECT string_agg(body, ' ') FROM sections WHERE feature_id = feature_id_arg),
        ''
      )
    ), 'B')
  WHERE id = feature_id_arg;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Trigger on features: rebuild when inserted or title changes
CREATE OR REPLACE FUNCTION features_after_change() RETURNS trigger AS $$
BEGIN
  PERFORM features_rebuild_search_vector(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER features_fts_after_insert
AFTER INSERT ON features
FOR EACH ROW EXECUTE FUNCTION features_after_change();
--> statement-breakpoint

CREATE TRIGGER features_fts_after_update
AFTER UPDATE OF title ON features
FOR EACH ROW EXECUTE FUNCTION features_after_change();
--> statement-breakpoint

-- Trigger on sections: rebuild parent feature's search_vector on insert/update/delete
CREATE OR REPLACE FUNCTION sections_after_change() RETURNS trigger AS $$
BEGIN
  PERFORM features_rebuild_search_vector(COALESCE(NEW.feature_id, OLD.feature_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER sections_fts_after_insert
AFTER INSERT ON sections
FOR EACH ROW EXECUTE FUNCTION sections_after_change();
--> statement-breakpoint

CREATE TRIGGER sections_fts_after_update
AFTER UPDATE OF body ON sections
FOR EACH ROW EXECUTE FUNCTION sections_after_change();
--> statement-breakpoint

CREATE TRIGGER sections_fts_after_delete
AFTER DELETE ON sections
FOR EACH ROW EXECUTE FUNCTION sections_after_change();
--> statement-breakpoint

-- GIN index for fast FTS lookup
CREATE INDEX features_search_vector_gin ON features USING GIN (search_vector);
