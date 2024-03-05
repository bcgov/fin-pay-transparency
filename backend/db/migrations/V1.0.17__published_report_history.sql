set search_path = pay_transparency;

create table if not exists calculated_data_history
(
    calculated_data_history_id        uuid      default gen_random_uuid() not null,
    calculated_data_id                uuid                                not null,
    report_history_id                 uuid                                not null,
    report_id                         uuid                                not null,
    calculation_code_id               uuid                                not null,
    value                             varchar(50),
    is_suppressed                     boolean                             not null,
    create_date                       timestamp default current_timestamp not null,
    update_date                       timestamp default current_timestamp not null,
    create_user                       varchar(255) default current_user   not null,
    update_user                       varchar(255) default current_user   not null,    
    constraint calculated_data_history_pk primary key (calculated_data_history_id),
    constraint calculated_data_history_report_id_fk foreign key (report_history_id) references report_history (report_history_id),
    constraint calculated_data_history_calculation_code_id_fk foreign key (calculation_code_id) references calculation_code (calculation_code_id),
    unique(report_history_id, calculation_code_id)
);