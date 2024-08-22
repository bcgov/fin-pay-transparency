SET search_path TO pay_transparency;

-- Delete the 'built-in' announcement created in V1.0.36
-- (There are no published announcements in Prod yet, so we don't need to be 
-- too precise with these delete statements, but try to avoid removing
-- most of the test data.)
delete from announcement_resource where resource_url = 'https://www2.gov.bc.ca/gov/content/gender-equity/preparing-pay-transparency-reports';
delete from announcement where title = 'Guidance for preparing reports';

-- Recreate the 'built-in' announcement as before, except now with 
-- the 'published_on' date set
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
      status,
      published_on
      ) 
    values (
      announcementId, 
      'Guidance for preparing reports', 
      'For more information on Pay Transparency reporting, please visit:',
      'PUBLISHED',
      LOCALTIMESTAMP AT TIME ZONE 'UTC-7'
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