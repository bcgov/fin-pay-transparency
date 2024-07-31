
do
$$

declare

adminUserId uuid;

begin

	select admin_user_id into adminUserId from pay_transparency.admin_user limit 1;
 

  insert into pay_transparency.announcement (title, description, published_on, expires_on, status, created_by, updated_by)
	values 
		('Fugiat credo', 'Aeternus conculco nihil desparatus varietas curatio soleo sublime valetudo. Ulciscor comitatus tego atque deputo soluta suadeo concido compello. Et anser bos acsi alias.', now(), now() + interval '12 week', 'PUBLISHED', adminUserId, adminUserId),
	('Totidem ambitus', 'Depraedor adfectus vita ventito stabilis. Vorax numquam sustineo cetera brevis laborum vos ex testimonium. Stultus valeo peccatus comes abscido vilis crepusculum viscus volo.', now() - interval '1 week', now() + interval '12 week', 'DRAFT', adminUserId, adminUserId),
    ('Delibero voluptate', 'Voveo cras tamdiu tenuis dolorem. Commodi deprecator tricesimus crux solium benigne soleo crur. Temeritas tamdiu defetiscor.', now() - interval '2 week', now() + interval '10 week', 'PUBLISHED', adminUserId, adminUserId),
    ('Vox aranea', 'Cavus utique vestrum asporto. Depono tamdiu truculenter cicuta tibi. Tubineus conatus thema ubi.', now() - interval '6 week', now() + interval '11 week', 'PUBLISHED', adminUserId, adminUserId),
    ('Creator solum', 'Adversus quos adeptio. Eius succurro alienus verecundia qui. Spargo basium trans corroboro ustulo.', now() - interval '7 week', now() + interval '14 week', 'DRAFT', adminUserId, adminUserId),
	('Contego aperio', 'Ducimus cras provident tracto cohors vulgivagus. Cuppedia utor turba architecto capitulus ad aperio cur admitto. Tyrannus voluptates demo arguo attero.', now(), now() + interval '12 week', 'PUBLISHED', adminUserId, adminUserId),
	('Eum benigne', 'Consectetur adstringo calculus talis ventito cibo supplanto vomer aegrus. Arbor eos aestivus ater tibi verecundia trans casso aegre. Thesis tribuo bene aggero strenuus ciminatio ver quibusdam virgo.', now() - interval '1 week', now() + interval '12 week', 'DRAFT', adminUserId, adminUserId),
    ('Constans validus', 'Cohaero velut temporibus antepono. Vergo pecus tondeo vergo argentum cribro distinctio torrens. Ullus temporibus facilis magnam bellicus vinum pax nobis.', now() - interval '2 week', now() + interval '11 week', 'PUBLISHED', adminUserId, adminUserId),
    ('Numquam tenus', 'Bonus combibo crebro blanditiis acer abbas acidus. Subnecto charisma viduo sulum expedita una excepturi recusandae causa pecto. Arceo voco cursus similique tempus claudeo sono cultellus abundans decerno.', now() - interval '3 week', now() + interval '5 week', 'DRAFT', adminUserId, adminUserId),
	('Appono itaque', 'Antiquus acervus at vinum spectaculum adulescens adstringo villa. Tergiversatio assumenda defendo conventus usque calculus aeternus abutor cernuus totus. Arcus titulus stabilis perspiciatis.', now() - interval '2 week', now() + interval '8 week', 'PUBLISHED', adminUserId, adminUserId),
    ('Alarte Ascendare', 'Adficio sum perspiciatis umerus cetera cribro absum. Cubitum curiositas utrimque numquam aggredior talis aedificium sortitus aperio. Cetera administratio corpus suscipit patrocinor color suppono.', now() - interval '7 week', now() + interval '13 week', 'DRAFT', adminUserId, adminUserId);

end

$$