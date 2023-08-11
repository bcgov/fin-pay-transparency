drop table if exists pay_transparency.report cascade;
drop table if exists pay_transparency.company cascade;

set search_path = pay_transparency;

create table if not exists pay_transparency_user
(
    user_id             uuid,
    bceid_user_guid     uuid                                not null,
    bceid_business_guid uuid                                not null,
    display_name        varchar(255)                        not null,
    create_date         timestamp default current_timestamp not null,
    update_date         timestamp default current_timestamp not null,
    constraint user_id_pk primary key (user_id)
);

create table if not exists pay_transparency_company
(
    company_id          uuid,
    bceid_business_guid uuid                                not null,
    company_name        varchar(255)                        not null,
    company_address     varchar(255)                        not null,
    naics_code          varchar(255)                        not null,
    create_date         timestamp default current_timestamp not null,
    update_date         timestamp default current_timestamp not null,
    constraint company_id_pk primary key (company_id),
    constraint company_bceid_business_guid_uk unique (bceid_business_guid)

);

create table if not exists pay_transparency_company_user
(
    company_id  uuid,
    user_id     uuid                                not null,
    create_date timestamp default current_timestamp not null,
    update_date timestamp default current_timestamp not null,
    constraint company_user_id_uk unique (company_id, user_id),
    constraint company_id_fk foreign key (company_id) references pay_transparency_company (company_id),
    constraint company_user_id_fk foreign key (user_id) references pay_transparency_user (user_id)

);


create table if not exists pay_transparency_report
(
    report_id         uuid,
    company_id        uuid                                not null,
    user_id           uuid                                not null,
    employee_count    varchar(255)                        not null,
    user_comment      varchar(4000)                       not null,
    report_data       bytea                               not null,
    report_start_date timestamp default current_timestamp not null,
    report_end_date   timestamp default current_timestamp not null,
    create_date       timestamp default current_timestamp not null,
    update_date       timestamp default current_timestamp not null,
    constraint report_id_pk primary key (report_id),
    constraint report_pt_company_id_fk foreign key (company_id) references pay_transparency_company (company_id),
    constraint report_pt_user_id_fk foreign key (user_id) references pay_transparency_user (user_id)
);

create table if not exists pay_transparency_input_data
(
    report_id       uuid        not null,
    input_data_id   uuid        not null,
    employee_number varchar(10) not null,
    gender_code     varchar(1)  not null,
    hours_worked    numeric     not null,
    regular_pay     numeric     not null,
    special_pay     numeric     not null,
    overtime_pay    numeric     not null,
    overtime_hours  numeric     not null,
    bonus_pay       numeric     not null,
    constraint input_data_pk primary key (input_data_id),
    constraint input_data_report_id_fk foreign key (report_id) references pay_transparency_report (report_id)
);

create table if not exists pay_transparency_calculated_data
(
    calculated_data_id  uuid    not null,
    report_id           uuid    not null,
    average_hourly_wage numeric not null,
    constraint calculated_data_pk primary key (calculated_data_id),
    constraint calculated_data_report_id_fk foreign key (report_id) references pay_transparency_report (report_id)
);


create table if not exists pay_transparency_suppressed_report_data
(
    suppressed_report_data_id uuid    not null,
    report_id                 uuid    not null,
    average_hourly_wage       numeric not null,
    constraint suppressed_report_data_pk primary key (suppressed_report_data_id),
    constraint calculated_data_report_id_fk foreign key (report_id) references pay_transparency_report (report_id)
);
