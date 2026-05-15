-- Hand-written migration: users lifecycle columns (US-007 / T1).
-- Adds nullable `archived_at` (soft-delete / disable timestamp matching
-- the projects pattern) + `last_login_at` (informational; updated on
-- successful POST /auth/login). Partial index over active rows keeps
-- list queries (status=active default) cheap.

ALTER TABLE users ADD COLUMN archived_at timestamptz;
ALTER TABLE users ADD COLUMN last_login_at timestamptz;
CREATE INDEX users_archived_at_idx ON users (archived_at) WHERE archived_at IS NULL;
