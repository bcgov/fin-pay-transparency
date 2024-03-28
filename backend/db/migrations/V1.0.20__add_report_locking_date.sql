SET search_path TO pay_transparency;

alter table pay_transparency_report add column report_unlock_date timestamp null;
alter table report_history add column report_unlock_date timestamp null;
alter table pay_transparency_report alter column is_unlocked set default true;
alter table report_history alter column is_unlocked set default true;

create index "pay_transparency_report_report_unlock_date_is_unlocked_idx" on "pay_transparency_report"("report_unlock_date", "is_unlocked");
