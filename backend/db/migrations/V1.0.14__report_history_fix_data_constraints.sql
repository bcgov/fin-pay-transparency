SET search_path TO pay_transparency;

-- The previous migration set the incorrect length of the 
-- report_history.data_constraints column.  Fix that here.
alter table report_history alter column data_constraints TYPE varchar(3000);