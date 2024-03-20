SET search_path TO pay_transparency;

CREATE INDEX "employee_count_range_effective_date_expiry_date_idx" ON "employee_count_range"("effective_date", "expiry_date");

CREATE INDEX "naics_code_effective_date_expiry_date_idx" ON "naics_code"("effective_date", "expiry_date");

CREATE INDEX "pay_transparency_calculated_data_report_id_idx" ON "pay_transparency_calculated_data"("report_id");

CREATE INDEX "pay_transparency_calculated_data_report_id_is_suppressed_idx" ON "pay_transparency_calculated_data"("report_id", "is_suppressed");

CREATE INDEX "pay_transparency_company_bceid_business_guid_idx" ON "pay_transparency_company"("bceid_business_guid");

CREATE INDEX "pay_transparency_report_report_id_company_id_idx" ON "pay_transparency_report"("report_id", "company_id");

CREATE INDEX "pay_transparency_report_create_date_report_status_idx" ON "pay_transparency_report"("create_date", "report_status");

CREATE INDEX "pay_transparency_report_company_id_report_start_date_report_idx" ON "pay_transparency_report"("company_id", "report_start_date", "report_end_date", "report_status");

CREATE INDEX "pay_transparency_report_company_id_create_date_report_start_idx" ON "pay_transparency_report"("company_id", "create_date", "report_start_date", "report_end_date", "report_status");

CREATE INDEX "pay_transparency_user_bceid_user_guid_bceid_business_guid_idx" ON "pay_transparency_user"("bceid_user_guid", "bceid_business_guid");
