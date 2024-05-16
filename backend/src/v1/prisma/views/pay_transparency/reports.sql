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
  report.is_unlocked,
  report.reporting_year,
  report.report_unlock_date,
  naics_code.naics_label,
  company.company_name,
  company.bceid_business_guid,
  company.address_line1,
  company.address_line2,
  company.city,
  company.province,
  company.country,
  company.postal_code,
  employee_count_range.employee_count_range
FROM
  (
    (
      (
        pay_transparency_report report
        LEFT JOIN naics_code naics_code ON (
          (
            (naics_code.naics_code) :: text = (report.naics_code) :: text
          )
        )
      )
      LEFT JOIN pay_transparency_company company ON ((company.company_id = report.company_id))
    )
    LEFT JOIN employee_count_range employee_count_range ON (
      (
        employee_count_range.employee_count_range_id = report.employee_count_range_id
      )
    )
  )
WHERE
  ((report.report_status) :: text = 'Published' :: text)
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
  report.is_unlocked,
  report.reporting_year,
  report.report_unlock_date,
  naics_code.naics_label,
  company.company_name,
  company.bceid_business_guid,
  company.address_line1,
  company.address_line2,
  company.city,
  company.province,
  company.country,
  company.postal_code,
  employee_count_range.employee_count_range
FROM
  (
    (
      (
        report_history report
        LEFT JOIN naics_code naics_code ON (
          (
            (naics_code.naics_code) :: text = (report.naics_code) :: text
          )
        )
      )
      LEFT JOIN pay_transparency_company company ON ((company.company_id = report.company_id))
    )
    LEFT JOIN employee_count_range employee_count_range ON (
      (
        employee_count_range.employee_count_range_id = report.employee_count_range_id
      )
    )
  )
WHERE
  ((report.report_status) :: text = 'Published' :: text);