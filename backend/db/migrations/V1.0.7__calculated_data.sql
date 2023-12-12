SET search_path TO pay_transparency;

-- Create a new table listing the code assigned to each of the
-- report-related calculations
create table if not exists calculation_code
(
    calculation_code_id      uuid          default gen_random_uuid() not null,    
    calculation_code_desc                  varchar(255)              not null,
    constraint calculation_code_id_pk primary key (calculation_code_id),
    unique(calculation_code_desc)
);

-- Populate 'calculation_code' with codes corresponding to all
-- calculations needed for the report
insert into calculation_code 
  (calculation_code_desc)
values 
  ('Mean hourly pay gap M'),
  ('Mean hourly pay gap W'),
  ('Mean hourly pay gap X'),
  ('Mean hourly pay gap U'),
  ('Median hourly pay gap M'),
  ('Median hourly pay gap W'),
  ('Median hourly pay gap X'),
  ('Median hourly pay gap U');



-- Drop the original 'pay_transparency_calculated_data' table 
-- and replace with a new table (of the same name) with a 
-- key-value format.  The key-value format is more suitable
-- for storing the 50+ different calculations that are expected
-- for each report.
drop table pay_transparency_calculated_data;
create table if not exists pay_transparency_calculated_data
(
    calculated_data_id                uuid         not null,
    report_id                         uuid         not null,
    calculation_code_id               uuid         not null,
    value                             numeric      not null,
    is_suppressed                     boolean      not null,
    constraint calculated_data_pk primary key (calculated_data_id),
    constraint calculated_data_report_id_fk foreign key (report_id) references pay_transparency_report (report_id),
    constraint calculation_code_id_fk foreign key (calculation_code_id) references calculation_code (calculation_code_id)
);

-- Column changes in 'pay_transparency_report'.  
alter table pay_transparency_report add column revision numeric not null;
alter table pay_transparency_report add column data_constraints varchar(3000);
alter table pay_transparency_report alter column create_user set default current_user;
alter table pay_transparency_report alter column update_user set default current_user;
alter table pay_transparency_report alter column user_comment drop not null; -- recreate without the 'not null' constraint
alter table pay_transparency_report drop column report_data;

-- Drop 'pay_transparency_suppressed_report_data' because 
-- calculations involving suppressed gender groups will now be
-- flagged in 'pay_transparency_calculated_data.is_suppressed
drop table pay_transparency_suppressed_report_data;