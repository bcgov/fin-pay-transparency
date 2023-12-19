SET search_path TO pay_transparency;

alter table pay_transparency_calculated_data alter column value TYPE varchar(50);
alter table pay_transparency_calculated_data alter column value drop not null;

insert into calculation_code 
  (calculation_code)
values 
  ('REFERENCE_GENDER_CATEGORY_CODE'),
  ('MEAN_OT_PAY_DIFF_M'),
  ('MEAN_OT_PAY_DIFF_W'),
  ('MEAN_OT_PAY_DIFF_X'),
  ('MEAN_OT_PAY_DIFF_U'),
  ('MEDIAN_OT_PAY_DIFF_M'),
  ('MEDIAN_OT_PAY_DIFF_W'),
  ('MEDIAN_OT_PAY_DIFF_X'),
  ('MEDIAN_OT_PAY_DIFF_U'),
  ('MEAN_OT_HOURS_DIFF_M'),
  ('MEAN_OT_HOURS_DIFF_W'),
  ('MEAN_OT_HOURS_DIFF_X'),
  ('MEAN_OT_HOURS_DIFF_U'),
  ('MEDIAN_OT_HOURS_DIFF_M'),
  ('MEDIAN_OT_HOURS_DIFF_W'),
  ('MEDIAN_OT_HOURS_DIFF_X'),
  ('MEDIAN_OT_HOURS_DIFF_U'),
  ('MEAN_BONUS_PAY_DIFF_M'),
  ('MEAN_BONUS_PAY_DIFF_W'),
  ('MEAN_BONUS_PAY_DIFF_X'),
  ('MEAN_BONUS_PAY_DIFF_U'),
  ('MEDIAN_BONUS_PAY_DIFF_M'),
  ('MEDIAN_BONUS_PAY_DIFF_W'),
  ('MEDIAN_BONUS_PAY_DIFF_X'),
  ('MEDIAN_BONUS_PAY_DIFF_U')
  ;