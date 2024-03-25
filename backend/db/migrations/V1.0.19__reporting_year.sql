SET search_path TO pay_transparency;

alter table pay_transparency_report add column reporting_year numeric not null default 2023;
alter table pay_transparency_report alter column reporting_year drop default;
alter table report_history add column reporting_year numeric not null default 2023;
alter table report_history alter column reporting_year drop default;