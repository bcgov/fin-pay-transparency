SET search_path TO pay_transparency;

DROP VIEW reports_view;
DROP VIEW calculated_data_view;

CREATE OR REPLACE VIEW reports_calculated_data_view
AS
SELECT 
    report.report_id,
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
    report.is_unlocked,
    report.reporting_year,
    report.report_unlock_date,
    report.admin_user_id,
    report.admin_modified_date,
    report.admin_last_access_date,
    naics_code.naics_label as naics_code_label,
    company.company_name,
    company.bceid_business_guid as company_bceid_business_guid,
    company.address_line1 as company_address_line1,
    company.address_line2 as company_address_line2,
    company.city as company_city,
    company.province as company_province,
    company.country as company_country,
    company.postal_code as company_postal_code,
    employee_count_range.employee_count_range,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'value', calc_data.value,
                'is_suppressed', calc_data.is_suppressed,
                'calculation_code', calc_code.calculation_code
            )
        ) FILTER (WHERE calc_data.report_id IS NOT NULL),
        '[]'::json
    ) as calculated_data
FROM pay_transparency.pay_transparency_report report
    LEFT JOIN pay_transparency.naics_code naics_code ON naics_code.naics_code::text = report.naics_code::text
    LEFT JOIN pay_transparency.pay_transparency_company company ON company.company_id = report.company_id
    LEFT JOIN pay_transparency.employee_count_range employee_count_range ON employee_count_range.employee_count_range_id = report.employee_count_range_id
    LEFT JOIN pay_transparency.pay_transparency_calculated_data calc_data ON calc_data.report_id = report.report_id
    LEFT JOIN pay_transparency.calculation_code calc_code ON calc_code.calculation_code_id = calc_data.calculation_code_id
WHERE report.report_status::text IN ('Published', 'Withdrawn')
GROUP BY 
    report.report_id, report.company_id, report.user_id, report.user_comment, 
    report.employee_count_range_id, report.naics_code, report.report_start_date, 
    report.report_end_date, report.create_date, report.update_date, 
    report.create_user, report.update_user, report.report_status, 
    report.revision, report.data_constraints, report.is_unlocked, 
    report.reporting_year, report.report_unlock_date, report.admin_user_id, 
    report.admin_modified_date, report.admin_last_access_date,
    naics_code.naics_label, company.company_name, company.bceid_business_guid,
    company.address_line1, company.address_line2, company.city,
    company.province, company.country, company.postal_code,
    employee_count_range.employee_count_range

UNION ALL

SELECT 
    report.report_id,
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
    report.is_unlocked,
    report.reporting_year,
    report.report_unlock_date,
    report.admin_user_id,
    report.admin_modified_date,
    report.admin_last_access_date,
    naics_code.naics_label as naics_code_label,
    company.company_name,
    company.bceid_business_guid as company_bceid_business_guid,
    company.address_line1 as company_address_line1,
    company.address_line2 as company_address_line2,
    company.city as company_city,
    company.province as company_province,
    company.country as company_country,
    company.postal_code as company_postal_code,
    employee_count_range.employee_count_range,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'value', calc_data.value,
                'is_suppressed', calc_data.is_suppressed,
                'calculation_code', calc_code.calculation_code
            )
        ) FILTER (WHERE calc_data.report_history_id IS NOT NULL),
        '[]'::json
    ) as calculated_data
FROM pay_transparency.report_history report
    LEFT JOIN pay_transparency.naics_code naics_code ON naics_code.naics_code::text = report.naics_code::text
    LEFT JOIN pay_transparency.pay_transparency_company company ON company.company_id = report.company_id
    LEFT JOIN pay_transparency.employee_count_range employee_count_range ON employee_count_range.employee_count_range_id = report.employee_count_range_id
    LEFT JOIN pay_transparency.calculated_data_history calc_data ON calc_data.report_history_id = report.report_history_id
    LEFT JOIN pay_transparency.calculation_code calc_code ON calc_code.calculation_code_id = calc_data.calculation_code_id
WHERE report.report_status::text IN ('Published', 'Withdrawn')
GROUP BY 
    report.report_id, report.company_id, report.user_id, report.user_comment, 
    report.employee_count_range_id, report.naics_code, report.report_start_date, 
    report.report_end_date, report.create_date, report.update_date, 
    report.create_user, report.update_user, report.report_status, 
    report.revision, report.data_constraints, report.is_unlocked, 
    report.reporting_year, report.report_unlock_date, report.admin_user_id, 
    report.admin_modified_date, report.admin_last_access_date,
    naics_code.naics_label, company.company_name, company.bceid_business_guid,
    company.address_line1, company.address_line2, company.city,
    company.province, company.country, company.postal_code,
    employee_count_range.employee_count_range;

 
-- re-add all comments on the view and its columns
comment on view reports_calculated_data_view is 'This view is a union of the `pay_transparency_report` table and `report_history` table. The columns `naics_code.naics_label` and `employee_count_range.employee_count_range`, as well as the full address and company name from `pay_transparency_company` have been included in this view.

This view allows the webapp to fetch the most recent report as well as the historical versions of the report in one query.

Only one new column is created in this view, `report_change_id`, which is used to associate this view with the `calculated_data_view` view. The `is_unlocked` column from the two report tables is not included in this view.';
comment on column reports_calculated_data_view.report_id is 'Primary unique ID for this report. Even when a published report is updated, this ID stays the same.';
comment on column reports_calculated_data_view.company_id is 'The employer (a BCeID Business) the report is made for. This references the primary key of `pay_transparency_company` table.';
comment on column reports_calculated_data_view.user_id is 'The user who created/modified this report. This references the primary key of `pay_transparency_user` table.';
comment on column reports_calculated_data_view.user_comment is 'User optionally fills this text area on the form, called ''Employer statement'', which is shown at the top of the report. This is for additional information about the employer.  Value should be HTML.';
comment on column reports_calculated_data_view.employee_count_range_id is 'User selects range indicating the number of employees an employer has on the form, which is shown on the report. This references the primary key of `employee_count_range` table.';
comment on column reports_calculated_data_view.naics_code is 'User selects the NAICS code for their business on the form, which is shown on the report. This references the primary key of `naics_code` table.';
comment on column reports_calculated_data_view.report_start_date is 'User selects the start date of the report, which is shown on the report. Start date is always a year before the end date. The range could be a calendar year, fiscal year, school year, or any range the employer prefers.';
comment on column reports_calculated_data_view.report_end_date is 'User selects the end date of the report, which is shown on the report. End date is always a year after the start date.';
comment on column reports_calculated_data_view.create_date is 'The date and time when the first revision was inserted. This is used for locking published reports older than 30 days.';
comment on column reports_calculated_data_view.update_date is 'The date and time when this revision was modified. This is used for deleting draft reports older than 24 hours.';
comment on column reports_calculated_data_view.create_user is 'The username of the database user who created the record.';
comment on column reports_calculated_data_view.update_user is 'The username of the database user who modified the record.';
comment on column reports_calculated_data_view.report_status is 'Reports are first created with the status of ''Draft'' and the user can publish their report which changes the status to ''Published''.';
comment on column reports_calculated_data_view.revision is 'Every published report has a revision. Each time a published report is replaced the revision goes up.';
comment on column reports_calculated_data_view.data_constraints is 'User optionally fills this text area on the form, which is shown at the bottom of the report. This is for any relevant information, such as limitations, constraints, or dependencies, that may help explain the employers payroll data. Value should be HTML.';
comment on column reports_calculated_data_view.is_unlocked is 'Indicates if the report is unlocked for editing.';
comment on column reports_calculated_data_view.reporting_year is 'User selects the year this report is for. Each employer is limited to one report annually. This is distinct from the report''s start and end dates as employers may generate reports for any period, like a fiscal or school year, yet the specific year the report pertains to may not be discernible from those dates.';
comment on column reports_calculated_data_view.report_unlock_date is 'This date is set by an administrator and is used by a scheduled task to change `is_unlocked` to false after 3 days.';
comment on column reports_calculated_data_view.admin_user_id is 'Admin users can lock a report which updates `report_unlock_date` and `admin_modified_date`. They can also look at reports which updates `admin_last_access_date`.';
comment on column reports_calculated_data_view.admin_modified_date is 'The time when an admin user locked or unlocked a report.';
comment on column reports_calculated_data_view.admin_last_access_date is 'The time when an admin user last looked at this report.';
comment on column reports_calculated_data_view.naics_code_label is 'The name of the sector (eg ''Construction'') of the NAICS code.';
comment on column reports_calculated_data_view.company_name is 'The name of the employer provided by BCeID account.';
comment on column reports_calculated_data_view.company_bceid_business_guid is 'The BCeID unique ID for this company. Used to associate a user with a company.';
comment on column reports_calculated_data_view.company_address_line1 is 'Street address provided by BCeID account.';
comment on column reports_calculated_data_view.company_address_line2 is 'Optional second address line provided by BCeID account.';
comment on column reports_calculated_data_view.company_city is 'City provided by BCeID account.';
comment on column reports_calculated_data_view.company_province is 'Province provided by BCeID account.';
comment on column reports_calculated_data_view.company_country is 'Country provided by BCeID account.';
comment on column reports_calculated_data_view.company_postal_code is 'Postal Code provided by BCeID account.';
comment on column reports_calculated_data_view.employee_count_range is 'The name of the employee count record, for example ''50-100''.';
comment on column reports_calculated_data_view.calculated_data is 'This JSON column contains the all calculated data for the report instead of being in a separate view due to a limitation of the Database ORM.';