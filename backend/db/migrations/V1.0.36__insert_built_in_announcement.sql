SET search_path TO pay_transparency;

-- make created_by and updated_by optional in 'announcement', 'announcement_resource'
-- and their corresponding history tables
alter table announcement alter column created_by drop not null;
alter table announcement alter column updated_by drop not null;
alter table announcement_resource alter column created_by drop not null;
alter table announcement_resource alter column updated_by drop not null;
alter table announcement_history alter column created_by drop not null;
alter table announcement_history alter column updated_by drop not null;
alter table announcement_resource_history alter column created_by drop not null;
alter table announcement_resource_history alter column updated_by drop not null;

-- create a built-in announcement (and its associated LINK resource)
do
$$
DECLARE
  announcementId uuid;
BEGIN
    announcementId := gen_random_uuid();

    insert into announcement (
      announcement_id, 
      title, 
      description, 
      status
      ) 
    values (
      announcementId, 
      'Guidance for preparing reports', 
      'For more information on Pay Transparency reporting, please visit:',
      'PUBLISHED'
      );
    insert into announcement_resource (
      announcement_id,       
      display_name,
      resource_url,
      resource_type
      ) 
    values (
      announcementId, 
      'Guidance for preparing pay transparency reports - Province of British Columbia (gov.bc.ca)', 
      'https://www2.gov.bc.ca/gov/content/gender-equity/preparing-pay-transparency-reports',
      'LINK'
      );
END;
$$