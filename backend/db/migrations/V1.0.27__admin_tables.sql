SET search_path TO pay_transparency;

create table if not exists admin_user
(
    admin_user_id  uuid                                not null default gen_random_uuid(),
    idir_user_guid uuid                                not null,
    display_name   varchar(255)                        not null,
    create_date    timestamp default current_timestamp not null,
    create_user    varchar(255)                        not null,
    update_date    timestamp default current_timestamp not null,
    update_user    varchar(255)                        not null,
    is_active      boolean   default true              not null,
    assigned_roles varchar(255)                        not null,
    constraint admin_user_id_pk primary key (admin_user_id)
);

create table if not exists admin_user_history
(
    admin_user_history_id uuid                                not null default gen_random_uuid(),
    admin_user_id         uuid                                not null,
    idir_user_guid        uuid                                not null,
    display_name          varchar(255)                        not null,
    create_date           timestamp default current_timestamp not null,
    create_user           varchar(255)                        not null,
    update_date           timestamp default current_timestamp not null,
    update_user           varchar(255)                        not null,
    is_active             boolean   default true              not null,
    assigned_roles        varchar(255)                        not null,
    constraint admin_user_history_id_pk primary key (admin_user_history_id),
    constraint admin_user_fk foreign key (admin_user_id) references admin_user (admin_user_id)
);

create table if not exists admin_user_onboarding
(
    admin_user_onboarding_id uuid                                not null default gen_random_uuid(),
    email                    varchar(255)                        not null,
    first_name               varchar(255)                        not null,
    assigned_roles           varchar(255)                        not null,
    create_date              timestamp default current_timestamp not null,
    created_by               uuid                                not null,
    is_onboarded             boolean   default false             not null,
    expiry_date              timestamp                           not null,
    constraint admin_user_onboarding_id_pk primary key (admin_user_onboarding_id)
);

comment on table admin_user is 'To track the associated roles and status active/inactive of admin users of the application';
comment on table admin_user_history is 'History is updated when there is change in roles or status of the admin user.';
comment on table admin_user_onboarding is 'To track pending admin users of the application that are waiting to be onboarded.';
comment on column admin_user_onboarding.assigned_roles is 'Roles assigned to the user.Comma separated list of roles that can be assigned to the user';
comment on column admin_user_onboarding.is_onboarded is 'Flag to indicate if the user has been onboarded or not';
