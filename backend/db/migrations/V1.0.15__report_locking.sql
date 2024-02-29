SET search_path TO pay_transparency;

alter table pay_transparency_report add column unlocked boolean not null default false;

