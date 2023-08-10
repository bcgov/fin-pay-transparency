drop table if exists pay_transparency.report cascade;
drop table if exists pay_transparency.company cascade;

create table if not exists pt_user (
    pt_user_id              uuid primary key,
    bceid_user_guid         uuid not null,
    bceid_business_guid     uuid not null,
    display_name            varchar(255) not null,
    create_date             timestamp default current_timestamp not null,
    update_date             timestamp default current_timestamp not null,
    constraint pt_user_id_pk primary key (pt_user_id)
);

create table if not exists pt_company(
    pt_company_id       uuid primary key,
    pt_user_id          uuid not null,
    company_name        varchar(255) not null,
    company_address     varchar(255) not null,
    bceid_business_guid uuid not null,
    naics_code          varchar(255) not null,
    create_date         timestamp default current_timestamp not null,
    update_date         timestamp default current_timestamp not null,
    constraint pt_company_id_pk primary key (pt_company_id),
    constraint pt_company_pt_user_id_fk foreign key (pt_user_id) references pt_user (pt_user_id),
    constraint pt_company_bceid_business_guid_fk foreign key (bceid_business_guid) references pt_user (bceid_business_guid)

);

create table if not exists pt_report(
    pt_report_id        uuid primary key,
    pt_company_id       uuid not null,
    pt_user_id          uuid not null,
    employee_count      varchar(255) not null,
    user_comment        varchar(4000) not null,
    report_data         bytea not null,
    report_start_date   timestamp default current_timestamp not null,
    report_end_date     timestamp default current_timestamp not null,
    create_date         timestamp default current_timestamp not null,
    update_date         timestamp default current_timestamp not null,
    constraint pt_report_id_pk primary key (pt_report_id),
    constraint pt_report_pt_company_id_fk foreign key (pt_company_id) references pt_company (pt_company_id),
    constraint pt_report_pt_user_id_fk foreign key (pt_user_id) references pt_user (pt_user_id)
);

create table if not exists pt_input_data(
  pt_report_id        uuid not null,
  pt_input_data_id    uuid not null,
  employee_number     varchar(10) not null,
  gender_code         varchar(1)  not null,
  hours_worked        numeric not null,
  regular_pay         numeric not null,
  special_pay         numeric not null,
  overtime_pay        numeric not null,
  overtime_hours      numeric not null,
  bonus_pay           numeric not null,
  constraint pt_input_data_pk primary key (pt_input_data_id),
  constraint pt_input_data_pt_report_id_fk foreign key (pt_report_id) references pt_report (pt_report_id)
);

create table if not exists pt_calculated_data(
    pt_calculated_data_id   uuid not null,
    pt_report_id            uuid not null,
    average_hourly_wage     numeric not null,
    constraint pt_calculated_data_pk primary key (pt_calculated_data_id),
    constraint pt_calculated_data_pt_report_id_fk foreign key (pt_report_id) references pt_report (pt_report_id)
);


create table if not exists pt_suppressed_report_data(
  pt_calculated_data_id   uuid not null,
  pt_report_id            uuid not null,
  average_hourly_wage     numeric not null,
  constraint pt_calculated_data_pk primary key (pt_calculated_data_id),
  constraint pt_calculated_data_pt_report_id_fk foreign key (pt_report_id) references pt_report (pt_report_id)
);
