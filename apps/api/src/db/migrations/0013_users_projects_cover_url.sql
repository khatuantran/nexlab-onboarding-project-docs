-- Hand-written migration: users.cover_url + projects.cover_url (US-019 / T1).
-- Cloudinary secure_url của ảnh bìa (cover). NULL = chưa upload (fallback gradient hero).
-- ProfilePage hero + ProjectHero render `<img>` + overlay khi set; folder Cloudinary:
--   - covers/users/<userId>     cho /me/cover
--   - covers/projects/<projectId>  cho /projects/:slug/cover
-- Upload route ghi đè URL khi user thay ảnh; không cleanup orphan (drift accepted v1).

ALTER TABLE users ADD COLUMN cover_url TEXT;
ALTER TABLE projects ADD COLUMN cover_url TEXT;
