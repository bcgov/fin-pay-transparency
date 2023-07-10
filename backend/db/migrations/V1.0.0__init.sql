create schema if not exists pay_transparency;

create table if not exists pay_transparency.company
(
    id    uuid     not null,
    name  varchar(200) not null,
    address varchar(200) not null,
    number_of_employees numeric not null,
    constraint "pay_transparency_company_pk" primary key (id)

);
create table if not exists pay_transparency.report
(
    id    uuid      not null,
    company_id uuid not null,
    create_date numeric not null,
    report_data varchar(200) not null,
    constraint "pay_transparency_report_fk" foreign key (company_id) references pay_transparency.company(id),
    constraint "pay_transparency_report_pk" primary key (id)
    );


