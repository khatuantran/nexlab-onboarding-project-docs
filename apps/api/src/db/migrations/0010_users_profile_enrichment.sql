-- Hand-written migration: users profile enrichment (US-010 / T1).
-- 4 nullable text columns to back PersonalInfoCard real values
-- (replaces hardcoded "0901 234 567" / "Product · BA Team" / "TP. Hồ Chí Minh"
-- + new bio field). NULL = "Chưa cập nhật" placeholder in FE.

ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN department TEXT;
ALTER TABLE users ADD COLUMN location TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
