SELECT
  data.calculated_data_id,
  data.report_id,
  data.calculation_code_id,
  data.value,
  data.is_suppressed,
  code.calculation_code
FROM
  (
    (
      SELECT
        data_1.calculated_data_id,
        data_1.report_id,
        data_1.calculation_code_id,
        data_1.value,
        data_1.is_suppressed
      FROM
        pay_transparency_calculated_data data_1
      UNION
      SELECT
        data_1.calculated_data_history_id AS calculated_data_id,
        data_1.report_history_id AS report_id,
        data_1.calculation_code_id,
        data_1.value,
        data_1.is_suppressed
      FROM
        calculated_data_history data_1
    ) data
    LEFT JOIN calculation_code code ON (
      (
        code.calculation_code_id = data.calculation_code_id
      )
    )
  );