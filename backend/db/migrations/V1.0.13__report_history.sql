SET search_path TO pay_transparency;

-- update the report_history table to have the same columns 
-- and types as the pay_transparency_report table (the tables 
-- need to match so we can copy data from one to the other)
alter table report_history alter column user_comment drop not null;
alter table report_history alter column create_user set not null;
alter table report_history alter column update_user set not null;
alter table report_history alter column report_start_date TYPE date;
alter table report_history alter column report_end_date TYPE date;
alter table report_history add column naics_code varchar(5) not null references naics_code;
alter table report_history add column data_constraints varchar(5);
alter table report_history add column revision numeric not null;
alter table report_history drop column report_data;

