SET search_path TO pay_transparency;

alter table report_history add column is_unlocked boolean not null default false;

