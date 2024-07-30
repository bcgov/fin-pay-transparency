
do
$$

declare

adminUserId uuid;

begin

	select admin_user_id into adminUserId from pay_transparency.admin_user limit 1;
 

  insert into pay_transparency.announcement (title, description, published_on, expires_on, status, created_by, updated_by)
	values 
		('announcement 1', '', now(), now() + interval '12 week', 'PUBLISHED', adminUserId, adminUserId),
	('announcement 2', '', now() - interval '1 week', now() + interval '12 week', 'DRAFT', adminUserId, adminUserId),
    ('announcement 3', '', now() - interval '2 week', now() + interval '10 week', 'PUBLISHED', adminUserId, adminUserId),
    ('announcement 4', '', now() - interval '6 week', now() + interval '11 week', 'PUBLISHED', adminUserId, adminUserId),
    ('announcement 5', '', now() - interval '7 week', now() + interval '14 week', 'DRAFT', adminUserId, adminUserId),
	('announcement 6', '', now(), now() + interval '12 week', 'PUBLISHED', adminUserId, adminUserId),
	('announcement 7', '', now() - interval '1 week', now() + interval '12 week', 'DRAFT', adminUserId, adminUserId),
    ('announcement 8', '', now() - interval '2 week', now() + interval '11 week', 'PUBLISHED', adminUserId, adminUserId),
    ('announcement 9', '', now() - interval '3 week', now() + interval '5 week', 'DRAFT', adminUserId, adminUserId),
	('announcement 10', '', now() - interval '2 week', now() + interval '8 week', 'PUBLISHED', adminUserId, adminUserId),
    ('announcement 11', '', now() - interval '7 week', now() + interval '13 week', 'DRAFT', adminUserId, adminUserId);

end

$$