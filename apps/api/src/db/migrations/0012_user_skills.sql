-- Hand-written migration: user skills CRUD table (US-018 / T1 / FR-PROFILE-002).
-- Replaces the 7 hardcoded `SKILLS` chips on `/profile` SkillsCard with a
-- per-user table backing GET/PUT /me/skills (replace-all semantics).
-- Unique index uses `lower(label)` so "SQL" and "sql" collide.

CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX user_skills_user_label_uidx ON user_skills (user_id, lower(label));
CREATE INDEX user_skills_user_idx ON user_skills (user_id, sort_order);
