SET search_path TO pay_transparency;

alter table company_history alter column company_id set default gen_random_uuid();
alter table company_history drop column company_address;
alter table company_history add column address_line1 varchar(255);
alter table company_history add column address_line2 varchar(255);
alter table company_history add column city varchar(255);
alter table company_history add column province varchar(255);
alter table company_history add column country varchar(255);
alter table company_history add column postal_code varchar(255);
alter table company_history drop column create_user;
alter table company_history drop column update_user;

CREATE INDEX "company_history_bceid_business_guid_idx" ON "company_history"("bceid_business_guid");

