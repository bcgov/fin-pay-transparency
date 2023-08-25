set search_path = pay_transparency;
create table if not exists naics_code
(
    naics_code      varchar(255)                        not null,
    naics_label     varchar(255)                        not null,
    naics_code_desc varchar(255)                        not null,
    effective_date  timestamp default current_timestamp not null,
    expiry_date     timestamp default current_timestamp not null,
    create_date     timestamp default current_timestamp not null,
    update_date     timestamp default current_timestamp not null,
    create_user     varchar(255)                        not null,
    update_user     varchar(255)                        not null,
    constraint naics_code_id_pk primary key (naics_code)
);

create table if not exists employee_count_range
(
    employee_count_range_id uuid                                not null,
    employee_count_range    varchar(255)                        not null,
    create_date             timestamp default current_timestamp not null,
    update_date             timestamp default current_timestamp not null,
    effective_date          timestamp default current_timestamp not null,
    expiry_date             timestamp default current_timestamp not null,
    create_user             varchar(255)                        not null,
    update_user             varchar(255)                        not null,
    constraint employee_count_range_id_pk primary key (employee_count_range_id)
);

drop table if exists pay_transparency.pay_transparency_calculated_data cascade;
drop table if exists pay_transparency.pay_transparency_suppressed_report_data cascade;
create table if not exists pay_transparency_calculated_data
(
    calculated_data_id                uuid         not null,
    report_id                         uuid         not null,
    average_hourly_wage               numeric      not null,
    percentage_average_hourly_wage    numeric      not null,
    percentage_reference_category     varchar(255) not null,
    gender                            varchar(1)   not null,
    received_overtime_pay             numeric      not null,
    received_bonus_pay                numeric      not null,
    mean_hourly_pay_rate_difference   numeric      not null,
    median_hourly_pay_rate_difference numeric      not null,
    mean_overtime_pay_difference      numeric      not null,
    median_overtime_pay_difference    numeric      not null,
    mean_overtime_hours_difference    numeric      not null,
    median_overtime_hours_difference  numeric      not null,
    mean_bonus_pay_difference         numeric      not null,
    median_bonus_pay_difference       numeric      not null,
    constraint calculated_data_pk primary key (calculated_data_id),
    constraint calculated_data_report_id_fk foreign key (report_id) references pay_transparency_report (report_id)
);

create table if not exists pay_transparency_suppressed_report_data
(
    suppressed_report_data_id         uuid         not null,
    report_id                         uuid         not null,
    average_hourly_wage               numeric      not null,
    percentage_average_hourly_wage    numeric      not null,
    percentage_reference_category     varchar(255) not null,
    gender                            varchar(1)   not null,
    received_overtime_pay             numeric      not null,
    received_bonus_pay                numeric      not null,
    mean_hourly_pay_rate_difference   numeric      not null,
    median_hourly_pay_rate_difference numeric      not null,
    mean_overtime_pay_difference      numeric      not null,
    median_overtime_pay_difference    numeric      not null,
    mean_overtime_hours_difference    numeric      not null,
    median_overtime_hours_difference  numeric      not null,
    mean_bonus_pay_difference         numeric      not null,
    median_bonus_pay_difference       numeric      not null,
    constraint suppressed_report_data_pk primary key (suppressed_report_data_id),
    constraint calculated_data_report_id_fk foreign key (report_id) references pay_transparency_report (report_id)
);

alter table pay_transparency_company
    drop column naics_code;

alter table pay_transparency_report
    drop column employee_count;

alter table pay_transparency_report
    add column naics_code              varchar(255),
    add column employee_count_range_id uuid,
    add column create_user             varchar(255),
    add column update_user             varchar(255),
    add constraint pay_transparency_report_naics_code_fk foreign key (naics_code) references naics_code (naics_code),
    add constraint pay_transparency_report_employee_count_range_id_fk foreign key (employee_count_range_id) references employee_count_range (employee_count_range_id);

create table if not exists report_history
(
    report_history_id       uuid                                not null,
    report_id               uuid                                not null,
    company_id              uuid                                not null,
    user_id                 uuid                                not null,
    employee_count_range_id uuid                                not null,
    user_comment            varchar(4000)                       not null,
    report_data             bytea                               not null,
    report_start_date       timestamp default current_timestamp not null,
    report_end_date         timestamp default current_timestamp not null,
    create_date             timestamp default current_timestamp not null,
    update_date             timestamp default current_timestamp not null,
    create_user             varchar(255),
    update_user             varchar(255),
    constraint report_history_pk primary key (report_history_id),
    constraint report_history_report_id_fk foreign key (report_id) references pay_transparency_report (report_id),
    constraint report_history_company_id_fk foreign key (company_id) references pay_transparency_company (company_id),
    constraint report_history_user_id_fk foreign key (user_id) references pay_transparency_user (user_id),
    constraint report_history_employee_count_range_id_fk foreign key (employee_count_range_id) references employee_count_range (employee_count_range_id)
);

create table if not exists company_history(
    company_history_id uuid not null,
    company_id uuid not null,
    bceid_business_guid uuid                                not null,
    company_name        varchar(255)                        not null,
    company_address     varchar(255)                        not null,
    create_date         timestamp default current_timestamp not null,
    update_date         timestamp default current_timestamp not null,
    create_user             varchar(255),
    update_user             varchar(255),
    constraint company_history_pk primary key (company_history_id),
    constraint company_history_company_id_fk   foreign key (company_id) references pay_transparency_company (company_id)
);



