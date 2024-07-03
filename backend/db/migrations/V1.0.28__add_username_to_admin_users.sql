SET search_path TO pay_transparency;

ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS username VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE admin_user_history ADD COLUMN IF NOT EXISTS username VARCHAR(255) NOT NULL DEFAULT '';