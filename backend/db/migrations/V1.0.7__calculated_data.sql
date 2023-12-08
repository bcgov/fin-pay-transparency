-- Create a new table listing the code assigned to each of the
-- report-related calculations
create table if not exists calculation_code
(
    calculation_code_id      uuid          default gen_random_uuid() not null,    
    calculation_code_desc                  varchar(255)              not null,
    constraint calculation_code_id primary key (calculated_data_id),
    unique(description)
);

-- Populate 'calculation_code' with codes corresponding to all
-- calculations needed for the report
insert into
  calculation_code (calculation_code_desc)
values 
(
  'Mean hourly pay gap M',
  'Mean hourly pay gap W',
  'Mean hourly pay gap X',
  'Mean hourly pay gap U',
  'Median hourly pay gap M',
  'Median hourly pay gap W',
  'Median hourly pay gap X',
  'Median hourly pay gap U',
);


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
    value                             numeric      not null
    is_suppressed                     boolean      not null,
    constraint calculated_data_pk primary key (calculated_data_id),
    constraint calculated_data_report_id_fk foreign key (report_id) references pay_transparency_report (report_id)
    constraint calculation_code_id_fk foreign key (calculation_code_id) references calculation_code (calculation_code_id)
);

-- Add a new 'revision' column to 'pay_transparency_report'.  
-- This column will be used to avoid updating reports that
-- are out-of-date (as might happen if two users are 
-- simultaneously editing).
alter table pay_transparency_report add column revision numeric not null;

-- Drop 'pay_transparency_suppressed_report_data' because 
-- calculations involving suppressed gender groups will now be
-- flagged in 'pay_transparency_calculated_data.is_suppressed
drop table pay_transparency_suppressed_report_data;