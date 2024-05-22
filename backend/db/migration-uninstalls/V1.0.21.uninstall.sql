SET search_path TO pay_transparency;

alter table pay_transparency_report drop constraint pay_transparency_report_uk;

drop index pay_transparency_report_company_id_reporting_year_report_idx;
drop index pay_transparency_report_company_id_create_date_report_year_idx;

CREATE INDEX "pay_transparency_report_company_id_report_start_date_report_idx" ON "pay_transparency_report"("company_id", "report_start_date", "report_end_date", "report_status");
CREATE INDEX "pay_transparency_report_company_id_create_date_report_start_idx" ON "pay_transparency_report"("company_id", "create_date", "report_start_date", "report_end_date", "report_status");