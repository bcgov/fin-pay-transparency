SET search_path TO pay_transparency;

ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS last_login timestamp NOT NULL DEFAULT current_timestamp;
ALTER TABLE admin_user ALTER COLUMN create_user DROP NOT NULL;
ALTER TABLE admin_user ALTER COLUMN update_user DROP NOT NULL;

ALTER TABLE admin_user_history ADD COLUMN IF NOT EXISTS last_login timestamp NOT NULL DEFAULT current_timestamp;
ALTER TABLE admin_user_history ALTER COLUMN create_user DROP NOT NULL;
ALTER TABLE admin_user_history ALTER COLUMN update_user DROP NOT NULL;