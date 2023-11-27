set search_path = pay_transparency;
alter table pay_transparency_report add column report_status varchar(255) constraint report_status_check check (report_status in ('Draft', 'Published')) default 'Draft';
alter table report_history add column report_status varchar(255) constraint report_status_check check (report_status in ('Draft', 'Published')) default 'Draft';


