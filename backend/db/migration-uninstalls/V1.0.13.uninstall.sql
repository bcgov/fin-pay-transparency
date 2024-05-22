SET search_path TO pay_transparency;

alter table report_history alter column user_comment set not null;
alter table report_history alter column create_user drop not null;
alter table report_history alter column update_user drop not null;
alter table report_history alter column report_start_date TYPE timestamp;
alter table report_history alter column report_end_date TYPE timestamp;
alter table report_history drop column naics_code;
alter table report_history drop column data_constraints;
alter table report_history drop column revision;
alter table report_history add column report_data bytea not null;
alter table report_history add FOREIGN KEY (report_id) REFERENCES pay_transparency_report(report_id);
ALTER TABLE report_history RENAME CONSTRAINT report_history_report_id_fkey TO report_history_report_id_fk