SET search_path TO pay_transparency;

alter table pay_transparency_report add column admin_modified_reason varchar(255);
comment on column pay_transparency_report.admin_modified_reason is 'Action by admin when modifying the report. LOCK, UNLOCK, WITHDRAW, REPORTYEAR';

alter table report_history add column admin_modified_reason varchar(255);
comment on column report_history.admin_modified_reason is 'Action by admin when modifying the report. LOCK, UNLOCK, WITHDRAW, REPORTYEAR';


