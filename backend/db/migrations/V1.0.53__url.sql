create schema if not exists pay_transparency;
set search_path = pay_transparency;

create table if not exists pay_transparency_report_url
(
    url_id              uuid                                not null default gen_random_uuid(),
    create_date         timestamp default current_timestamp not null,
    update_date         timestamp default current_timestamp not null,
    create_user_id      uuid                                not null,
    update_user_id      uuid                                not null,
    report_id           uuid                                not null,
    report_url          varchar(4000)                       not null,
    constraint pay_transparency_report_url_pk primary key (url_id),
    constraint pay_transparency_report_url_create_user_id_fk foreign key (create_user_id) references pay_transparency_user (user_id),
    constraint pay_transparency_report_url_update_user_id_fk foreign key (update_user_id) references pay_transparency_user (user_id),
    constraint pay_transparency_report_url_report_id_fk foreign key (report_id) references pay_transparency_report (report_id),
    constraint pay_transparency_report_url_report_id_unique unique (report_id)
);

create table if not exists report_url_history
(
    url_history_id      uuid                                not null default gen_random_uuid(),
    url_id              uuid                                not null,
    create_date         timestamp default current_timestamp not null,
    update_date         timestamp default current_timestamp not null,
    create_user_id      uuid                                not null,
    update_user_id      uuid                                not null,
    report_id           uuid                                not null,
    report_url          varchar(4000)                       not null,
    constraint report_url_history_pk primary key (url_history_id),
    constraint report_url_history_url_id_fk foreign key (url_id) references pay_transparency_report_url (url_id),
    constraint report_url_history_create_user_id_fk foreign key (create_user_id) references pay_transparency_user (user_id),
    constraint report_url_history_update_user_id_fk foreign key (update_user_id) references pay_transparency_user (user_id),
    constraint report_url_history_report_id_fk foreign key (report_id) references pay_transparency_report (report_id)
);

    comment on column pay_transparency.pay_transparency_report_url.url_id is 'Primary key for report URL.';
    comment on column pay_transparency.pay_transparency_report_url.create_date is 'Record creation timestamp.';
    comment on column pay_transparency.pay_transparency_report_url.update_date is 'Record last update timestamp.';
    comment on column pay_transparency.pay_transparency_report_url.create_user_id is 'User ID who created the record.';
    comment on column pay_transparency.pay_transparency_report_url.update_user_id is 'User ID who last updated the record.';
    comment on column pay_transparency.pay_transparency_report_url.report_id is 'References the report this URL belongs to.';
    comment on column pay_transparency.pay_transparency_report_url.report_url is 'The URL for the report.';

    comment on column pay_transparency.report_url_history.url_history_id is 'Primary key for URL history entries.';
    comment on column pay_transparency.report_url_history.url_id is 'References the original report URL record.';
    comment on column pay_transparency.report_url_history.create_date is 'History record creation timestamp.';
    comment on column pay_transparency.report_url_history.update_date is 'History record last update timestamp.';
    comment on column pay_transparency.report_url_history.create_user_id is 'User ID who created the history record.';
    comment on column pay_transparency.report_url_history.update_user_id is 'User ID who last updated the history record.';
    comment on column pay_transparency.report_url_history.report_id is 'References the report associated with this history entry.';
    comment on column pay_transparency.report_url_history.report_url is 'The URL value stored in this history entry.';

    comment on table pay_transparency.pay_transparency_report_url is 'This table holds the URL or where the report is hosted online. This is optional for employers.';
    comment on table pay_transparency.report_url_history is 'Stores historical values for report URLs.';
