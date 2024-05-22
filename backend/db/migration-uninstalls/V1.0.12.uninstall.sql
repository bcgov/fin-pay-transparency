SET search_path TO pay_transparency;

-- restore original data type of two columns (back from 'date' to 'timestamp')
alter table pay_transparency_report alter column report_start_date TYPE timestamp;
alter table pay_transparency_report alter column report_end_date TYPE timestamp;