SET search_path TO pay_transparency;

-- Delete all old reports to ensure there are no
-- integrity constraint warnings when we add a new unique key 
-- below.
-- Note: The application is not yet in production, so only data 
-- from development and testing will be affected.
delete from pay_transparency_calculated_data;
delete from pay_transparency_report;

-- Add a new unique key constraint on pay_transparency_report
alter table pay_transparency_report add constraint pay_transparency_report_uk unique (company_id, user_id, reporting_year, report_status);

-- Drop some existing indexes.  These indexes were created to support queries that
-- are no longer used (queries related to report_start_date and report_end_date).  
drop index pay_transparency_report_company_id_report_start_date_report_idx;
drop index pay_transparency_report_company_id_create_date_report_start_idx;

-- Replace the dropped indexes with new indexes that are more suitable for 
-- querying against reporting_year
create index "pay_transparency_report_company_id_reporting_year_report_idx" on "pay_transparency_report"("company_id", "reporting_year", "report_status");
create index "pay_transparency_report_company_id_create_date_report_year_idx" on "pay_transparency_report"("company_id", "create_date", "reporting_year", "report_status");