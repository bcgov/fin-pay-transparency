SET search_path TO pay_transparency;


CREATE OR REPLACE VIEW reports_view
AS
    SELECT 
        report.report_id,
        report.report_id AS report_change_id,
        report.company_id,
        report.user_id,
        report.user_comment,
        report.employee_count_range_id,
        report.naics_code,
        report.report_start_date,
        report.report_end_date,
        report.create_date,
        report.update_date,
        report.create_user,
        report.update_user,
        report.report_status,
        report.revision,
        report.data_constraints,
        report.reporting_year,
        report.report_unlock_date,
        naics_code.naics_label as naics_code_label,
        company.company_name,
        company.bceid_business_guid as company_bceid_business_guid,
        company.address_line1 as company_address_line1,
        company.address_line2 as company_address_line2,
        company.city as company_city,
        company.province as company_province,
        company.country as company_country,
        company.postal_code as company_postal_code,
        employee_count_range.employee_count_range
   FROM pay_transparency.pay_transparency_report report
     LEFT JOIN pay_transparency.naics_code naics_code ON naics_code.naics_code::text = report.naics_code::text
     LEFT JOIN pay_transparency.pay_transparency_company company ON company.company_id = report.company_id
     LEFT JOIN pay_transparency.employee_count_range employee_count_range ON employee_count_range.employee_count_range_id = report.employee_count_range_id
  WHERE report.report_status::text = 'Published'::text
UNION
 SELECT 
    report.report_id,
    report.report_history_id AS report_change_id,
    report.company_id,
    report.user_id,
    report.user_comment,
    report.employee_count_range_id,
    report.naics_code,
    report.report_start_date,
    report.report_end_date,
    report.create_date,
    report.update_date,
    report.create_user,
    report.update_user,
    report.report_status,
    report.revision,
    report.data_constraints,
    report.reporting_year,
    report.report_unlock_date,
    naics_code.naics_label as naics_code_label,
    company.company_name,
    company.bceid_business_guid as company_bceid_business_guid,
    company.address_line1 as company_address_line1,
    company.address_line2 as company_address_line2,
    company.city as company_city,
    company.province as company_province,
    company.country as company_country,
    company.postal_code as company_postal_code,
    employee_count_range.employee_count_range
   FROM pay_transparency.report_history report
     LEFT JOIN pay_transparency.naics_code naics_code ON naics_code.naics_code::text = report.naics_code::text
     LEFT JOIN pay_transparency.pay_transparency_company company ON company.company_id = report.company_id
     LEFT JOIN pay_transparency.employee_count_range employee_count_range ON employee_count_range.employee_count_range_id = report.employee_count_range_id
  WHERE report.report_status::text = 'Published'::text;


CREATE OR REPLACE VIEW calculated_data_view
AS
   SELECT 
        data.calculated_data_id,
        data.report_id,
        data.calculation_code_id,
        data.value,
        data.is_suppressed,
        code.calculation_code
    FROM (SELECT 
            data_1.calculated_data_id,
            data_1.report_id,
            data_1.calculation_code_id,
            data_1.value,
            data_1.is_suppressed
            FROM pay_transparency.pay_transparency_calculated_data data_1
        UNION
            SELECT 
                data_1.calculated_data_history_id as calculated_data_id,
                data_1.report_history_id AS report_id,
                data_1.calculation_code_id,
                data_1.value,
                data_1.is_suppressed
            FROM pay_transparency.calculated_data_history data_1) data
        LEFT JOIN pay_transparency.calculation_code code ON code.calculation_code_id = data.calculation_code_id;

 