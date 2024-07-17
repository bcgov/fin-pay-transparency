SET search_path TO pay_transparency;

ALTER TABLE pay_transparency_report ADD COLUMN IF NOT EXISTS admin_last_access_date timestamp null;
COMMENT ON COLUMN pay_transparency_report.admin_last_access_date IS 'timestamp of last access by any admin user';

ALTER TABLE report_history ADD COLUMN IF NOT EXISTS admin_last_access_date timestamp null;
COMMENT ON COLUMN report_history.admin_last_access_date IS 'timestamp of last access by any admin user';