SET search_path TO pay_transparency;

-- remove the "not null" constraint on pay_transparency_calculated_data.value
alter table pay_transparency_calculated_data alter column value drop not null;