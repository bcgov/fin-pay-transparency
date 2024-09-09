SET search_path TO pay_transparency;

ALTER TABLE announcement RENAME COLUMN published_on TO active_on;
ALTER TABLE announcement_history RENAME COLUMN published_on TO active_on;