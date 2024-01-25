SET search_path TO pay_transparency;

-- Add new codes for:
--  percent of each gender category receiving overtime pay, and
--  percent of each gender category receiving bonus pay
insert into calculation_code 
  (calculation_code)
values 
  ('PERCENT_RECEIVING_OT_PAY_M'),
  ('PERCENT_RECEIVING_OT_PAY_W'),
  ('PERCENT_RECEIVING_OT_PAY_X'),
  ('PERCENT_RECEIVING_OT_PAY_U'),
  ('PERCENT_RECEIVING_BONUS_PAY_M'),
  ('PERCENT_RECEIVING_BONUS_PAY_W'),
  ('PERCENT_RECEIVING_BONUS_PAY_X'),
  ('PERCENT_RECEIVING_BONUS_PAY_U')
  ;

