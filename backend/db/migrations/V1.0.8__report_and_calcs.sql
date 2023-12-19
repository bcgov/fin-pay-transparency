SET search_path TO pay_transparency;

alter table pay_transparency_calculated_data alter column value TYPE varchar(50);
alter table pay_transparency_calculated_data alter column value drop not null;

insert into calculation_code 
  (calculation_code)
values 
  ('REFERENCE_GENDER_CATEGORY_CODE'),
  ('MEAN_OVERTIME_PAY_DIFF_M'),
  ('MEAN_OVERTIME_PAY_DIFF_W'),
  ('MEAN_OVERTIME_PAY_DIFF_X'),
  ('MEAN_OVERTIME_PAY_DIFF_U'),
  ('MEDIAN_OVERTIME_PAY_DIFF_M'),
  ('MEDIAN_OVERTIME_PAY_DIFF_W'),
  ('MEDIAN_OVERTIME_PAY_DIFF_X'),
  ('MEDIAN_OVERTIME_PAY_DIFF_U'),
  ('MEAN_OVERTIME_HOURS_DIFF_M'),
  ('MEAN_OVERTIME_HOURS_DIFF_W'),
  ('MEAN_OVERTIME_HOURS_DIFF_X'),
  ('MEAN_OVERTIME_HOURS_DIFF_U'),
  ('MEDIAN_OVERTIME_HOURS_DIFF_M'),
  ('MEDIAN_OVERTIME_HOURS_DIFF_W'),
  ('MEDIAN_OVERTIME_HOURS_DIFF_X'),
  ('MEDIAN_OVERTIME_HOURS_DIFF_U')
  ;