set search_path = pay_transparency;
alter table pay_transparency_company drop column company_address;
alter table pay_transparency_company add column address_line1 varchar(255);
alter table pay_transparency_company add column address_line2 varchar(255);
alter table pay_transparency_company add column city varchar(255);
alter table pay_transparency_company add column province varchar(255);
alter table pay_transparency_company add column country varchar(255);
alter table pay_transparency_company add column postal_code varchar(255);


