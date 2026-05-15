-- Hand-written migration: users.avatar_url (US-009 / T1).
-- Cloudinary secure_url của ảnh đại diện. NULL = chưa upload (fallback
-- initials gradient). UI render qua Avatar component imageUrl prop.
-- Upload route ghi đè URL khi user thay ảnh; không Cloudinary cleanup
-- (orphan drift accepted v1).

ALTER TABLE users ADD COLUMN avatar_url TEXT;
