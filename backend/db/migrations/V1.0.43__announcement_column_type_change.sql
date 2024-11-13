SET search_path TO pay_transparency;

-- alter the data type of the description column to accommodate 
-- larger blocks of text with html formatting
alter table announcement alter column description TYPE text;

--also alter the corresponding colunm in the history table
alter table announcement_history alter column description TYPE text;

-- update the comments on the altered columns to note that HTML content is
-- expected
comment on column announcement.description is 'Description of the announcement.  Value should be HTML';
comment on column announcement_history.description is 'Description of the announcement.  Value should be HTML';
