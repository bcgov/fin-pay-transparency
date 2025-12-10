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
  GREATEST(report.update_date, report.admin_modified_date) AS update_date,
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
  report.admin_modified_reason,
  report.admin_last_access_date,
  naics_code.naics_label AS naics_code_label,
  company.company_name,
  company.bceid_business_guid AS company_bceid_business_guid,
  company.address_line1 AS company_address_line1,
  company.address_line2 AS company_address_line2,
  company.city AS company_city,
  company.province AS company_province,
  company.country AS company_country,
  company.postal_code AS company_postal_code,
  employee_count_range.employee_count_range,
  COALESCE(
    json_agg(
      json_build_object(
        'value',
        calc_data.value,
        'is_suppressed',
        calc_data.is_suppressed,
        'calculation_code',
        calc_code.calculation_code
      )
    ) FILTER (
      WHERE
        (calc_data.report_id IS NOT NULL)
    ),
    '[]' :: json
  ) AS calculated_data
FROM
  (
    (
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
      LEFT JOIN pay_transparency_calculated_data calc_data ON ((calc_data.report_id = report.report_id))
    )
    LEFT JOIN calculation_code calc_code ON (
      (
        calc_code.calculation_code_id = calc_data.calculation_code_id
      )
    )
  )
WHERE
  (
    (report.report_status) :: text = ANY (ARRAY ['Published'::text, 'Withdrawn'::text])
  )
GROUP BY
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
  report.admin_modified_reason,
  report.admin_last_access_date,
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
UNION
ALL
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
  GREATEST(report.update_date, report.admin_modified_date) AS update_date,
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
  report.admin_modified_reason,
  report.admin_last_access_date,
  naics_code.naics_label AS naics_code_label,
  company.company_name,
  company.bceid_business_guid AS company_bceid_business_guid,
  company.address_line1 AS company_address_line1,
  company.address_line2 AS company_address_line2,
  company.city AS company_city,
  company.province AS company_province,
  company.country AS company_country,
  company.postal_code AS company_postal_code,
  employee_count_range.employee_count_range,
  COALESCE(
    json_agg(
      json_build_object(
        'value',
        calc_data.value,
        'is_suppressed',
        calc_data.is_suppressed,
        'calculation_code',
        calc_code.calculation_code
      )
    ) FILTER (
      WHERE
        (calc_data.report_history_id IS NOT NULL)
    ),
    '[]' :: json
  ) AS calculated_data
FROM
  (
    (
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
      LEFT JOIN calculated_data_history calc_data ON (
        (
          calc_data.report_history_id = report.report_history_id
        )
      )
    )
    LEFT JOIN calculation_code calc_code ON (
      (
        calc_code.calculation_code_id = calc_data.calculation_code_id
      )
    )
  )
WHERE
  (
    (report.report_status) :: text = ANY (ARRAY ['Published'::text, 'Withdrawn'::text])
  )
GROUP BY
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
  report.admin_modified_reason,
  report.admin_last_access_date,
  naics_code.naics_label,
  company.company_name,
  company.bceid_business_guid,
  company.address_line1,
  company.address_line2,
  company.city,
  company.province,
  company.country,
  company.postal_code,
  employee_count_range.employee_count_range;