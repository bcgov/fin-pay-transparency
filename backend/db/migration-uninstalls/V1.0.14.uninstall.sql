SET search_path TO pay_transparency;

alter table report_history alter column data_constraints TYPE varchar(5);