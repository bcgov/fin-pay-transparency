SET search_path TO pay_transparency;

-- change data type of two columns from 'timestamp' to 'date'
alter table pay_transparency_report alter column report_start_date TYPE date;
alter table pay_transparency_report alter column report_end_date TYPE date;
