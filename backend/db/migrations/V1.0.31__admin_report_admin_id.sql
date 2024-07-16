SET search_path TO pay_transparency;

alter table pay_transparency_report rename column idir_modified_username to admin_user_id;
alter table pay_transparency_report alter column admin_user_id TYPE uuid using null;
alter table pay_transparency_report rename column idir_modified_date to admin_modified_date;
alter table pay_transparency_report add constraint admin_user_fk foreign key (admin_user_id) references admin_user (admin_user_id);
 
alter table report_history rename column idir_modified_username to admin_user_id;
alter table report_history alter column admin_user_id TYPE uuid using null;
alter table report_history rename column idir_modified_date to admin_modified_date;
alter table report_history add constraint admin_user_fk foreign key (admin_user_id) references admin_user (admin_user_id);

ALTER TABLE admin_user ADD CONSTRAINT admin_user_idir_user_guid_uk UNIQUE (idir_user_guid);