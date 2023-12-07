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
    key                               varchar(255) not null,
    value                             numeric      not null
    is_suppressed                     boolean      not null,
    constraint calculated_data_pk primary key (calculated_data_id),
    constraint calculated_data_report_id_fk foreign key (report_id) references pay_transparency_report (report_id)
);

-- Add a new 'revision_id' column to 'pay_transparency_report'.  
-- This column will be used to avoid updating reports that
-- are out-of-date (as might happen if two users are 
-- simultaneously editing).
alter table pay_transparency_report add column revision_id uuid not null;

-- Drop 'pay_transparency_suppressed_report_data' because 
-- calculations involving suppressed gender groups will now be
-- flagged in 'pay_transparency_calculated_data.is_suppressed'
-- instead.
drop table pay_transparency_suppressed_report_data;