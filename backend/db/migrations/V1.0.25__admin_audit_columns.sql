SET search_path TO pay_transparency;

alter table pay_transparency_report add column idir_modified_username varchar(255) null;
alter table pay_transparency_report add column idir_modified_date timestamp null;