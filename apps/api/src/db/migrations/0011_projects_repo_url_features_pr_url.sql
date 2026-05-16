-- Hand-written migration: external repo + PR URL linking (US-013 / T1 / FR-LINK-001).
-- Two nullable text columns back the "Repo" button on /projects/:slug
-- and the "Xem PR" button on /projects/:slug/features/:fSlug — replacing the
-- v4 placeholder toast wires. NULL = button rendered disabled with tooltip.

ALTER TABLE projects ADD COLUMN repo_url TEXT;
ALTER TABLE features ADD COLUMN pr_url TEXT;
