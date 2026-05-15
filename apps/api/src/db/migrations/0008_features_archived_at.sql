-- Hand-written migration: features.archived_at (US-008 / T1).
-- Soft-delete timestamp mirrors projects.archived_at (FR-PROJ-002 pattern).
-- NULL = active feature; set = archived.
-- Catalog list (projectRepo.listFeatures) + direct detail lookup
-- (featureRepo.findByProjectAndSlug) must filter WHERE archived_at IS NULL.

ALTER TABLE features ADD COLUMN archived_at TIMESTAMPTZ;

-- Partial index lets listFeatures filter cheaply on projects with many
-- archived rows (covers the WHERE clause used by both repo paths).
CREATE INDEX features_active_idx ON features (project_id) WHERE archived_at IS NULL;
