set search_path to pay_transparency;

delete from pay_transparency_input_data;
alter table pay_transparency_input_data drop constraint input_data_report_id_fk;
drop table pay_transparency_input_data;

select * from pay_transparency_input_data;