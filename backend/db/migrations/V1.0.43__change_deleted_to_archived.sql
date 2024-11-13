SET search_path TO pay_transparency;

-- replace constraints so that when updating the key, it's change value cascades to other tables
ALTER table announcement DROP CONSTRAINT announcement_status_fk;
ALTER table announcement ADD CONSTRAINT announcement_status_fk
  FOREIGN KEY (status) REFERENCES announcement_status (code)
  ON UPDATE CASCADE;
ALTER table announcement_history DROP CONSTRAINT announcement_status_fk;
ALTER table announcement_history ADD CONSTRAINT announcement_status_fk
  FOREIGN KEY (status) REFERENCES announcement_status (code)
  ON UPDATE CASCADE;

-- Change the key and all rows in other tables with that key (cascading)
update announcement_status
set code = 'ARCHIVED', updated_date = NOW(), description = 'Archived'
where code = 'DELETED';

-- put the constraints back, because it would be better that the default is an error if changing a key
ALTER table announcement DROP CONSTRAINT announcement_status_fk;
ALTER table announcement ADD CONSTRAINT announcement_status_fk
  FOREIGN KEY (status) REFERENCES announcement_status (code);
ALTER table announcement_history DROP CONSTRAINT announcement_status_fk;
ALTER table announcement_history ADD CONSTRAINT announcement_status_fk
  FOREIGN KEY (status) REFERENCES announcement_status (code);