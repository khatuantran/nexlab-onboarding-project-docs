-- Hand-written migration: uploads.cloudinary_public_id (CR-004 / Phase 2).
-- Adds the column nullable so existing rows (now pointing at the
-- destroyed Fly volume) keep their metadata for audit; new uploads
-- ship to Cloudinary and populate this column non-null at insert.

ALTER TABLE uploads ADD COLUMN cloudinary_public_id text;
