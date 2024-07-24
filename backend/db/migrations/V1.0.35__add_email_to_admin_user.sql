SET search_path TO pay_transparency;

-- A note about the default email value of '': a "not null" constraint is desirable 
-- on the new "email" column because every user will  have an email address associated 
-- with their idir account.  
-- As a small complication, there may be pre-existing users listed in this table, 
-- and we don't know the email address of those pre-existing users. We can neither 
-- leave the column with a null value (because of the "not null" constraint), nor
-- easily determine the valid email address.  Because the system isn't yet in 
-- production:
--   - The larger effort to lookup valid email addressses for existing users
--     probably isn't justified.  
--   - We're really only setting empty string email addresses on users
--     in sandbox and dev environments, and this should only have a very minor 
--     impact on application functionality (re-adding an existing user won't 
--     be prevented as it normally would)
-- In a future migration we could potentially drop the default from the schema, 
-- although it also won't hurt to leave it in place indefinately.
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS email varchar(255) NOT NULL DEFAULT '';
COMMENT ON COLUMN admin_user.email IS 'email address of the admin user';

ALTER TABLE admin_user_history ADD COLUMN IF NOT EXISTS email varchar(255) NOT NULL DEFAULT '';
COMMENT ON COLUMN admin_user_history.email IS 'email address of the admin user';