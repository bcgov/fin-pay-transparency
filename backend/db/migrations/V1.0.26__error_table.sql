SET search_path TO pay_transparency;

create table if not exists user_error
(
    user_error_id   uuid            default gen_random_uuid()   not null,
    user_id         uuid                                        not null,
    company_id      uuid                                        not null,
    error           varchar(255)                                not null,
    create_date     timestamp       default current_timestamp   not null,
    constraint user_error_id_pk primary key (user_error_id),
    constraint error_pt_user_id_fk foreign key (user_id) references pay_transparency_user (user_id),
    constraint error_pt_company_id_fk foreign key (company_id) references pay_transparency_company (company_id)

);

CREATE INDEX "user_error_create_date_idx" ON "user_error"("create_date");

