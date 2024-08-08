/*
  Script inserts a bunch of dummy data into temp tables, then uses
  that dummy data to populate the database. Selection of that data for subsequent
  inserts is entirely random. If inserting particular data is required,
  request a revision with your requirements.
  
  You can set the routine to use existing admins or create admins on the fly from
  random data. Set the useExistingAdmins variable in the declaration block.

  Tables affected
  
	ADMIN_USER
	ANNOUNCEMENT
	ANNOUNCEMENT_RESOURCE
	
  This script does not populate the history tables.
  
  Change history
  Developer			DATE	 	Change
  D.Blake			20240724	Initial script
  D.Blake			20240807	Made the announcement status more dynamic (PUBLISHED, DRAFT, EXPIRED)
								Added some date logic to make the published and expired dates look a little more realistic.
*/

do
$$

DECLARE
	adminCounter integer;
	/*
	Use adminUpperBound to configure the number of times the outer admin loop is executed
	*/
	adminUpperBound integer := 10;
	/*
	Use announcementUpperBound to configure the number of annoucements created for each execution of the admin loop.
	*/
	announcementUpperBound integer := 10;
	/*
	true:  uses admins that already exist in the ADMIN_USER table
			Useful if you want to test admins that actually exist and can login
	false: creates admins from random data
			Useful if you want to just create a bunch of data.
	*/
	useExistingAdmins boolean := true;
	
	
	adminID uuid;
	idirGuid uuid;
	adminEmail varchar;
	displayName varchar;
	createUser varchar;
	updateUser varChar;
	
	announcementCounter integer;
	
	announcementId uuid;
	announcementTitle varchar;
	announcementDesc varchar;
	announcementStatus varchar;
	announcementPublished timestamp;
	announcementExpires timestamp;
	
	
	resourceCounter integer;
	
	resourceURL varchar(100);
	resourceDesc varchar(100);
	
	
	
BEGIN
  SET search_path TO pay_transparency;
  
  

  drop table if exists temp_adminUser;
  create table temp_adminUser(
	  fullName varchar(100),
	  IDIR varchar(100)
  );

  insert into temp_adminUser (fullName, IDIR)
  values
	('Archaimbaud Reisenberg','AREISENBERG'),
	('Bette Wickey','BWICKEY'),
	('Wyn Le Gall','WLEGALL'),
	('Ira Marmon','IMARMON'),
	('Neddie Oaten','NOATEN'),
	('Linet Champ','LCHAMP'),
	('Padriac Pyvis','PPYVIS'),
	('Elsie Eich','EEICH'),
	('Keri Lamdin','KLAMDIN'),
	('Redford Orrocks','RORROCKS'),
	('Modestia Keoghan','MKEOGHAN'),
	('Mike Bydaway','MBYDAWAY'),
	('Mick Bresnahan','MBRESNAHAN'),
	('Dominique Plaskitt','DPLASKITT'),
	('Ealasaid Filipic','EFILIPIC'),
	('Hermia Winkworth','HWINKWORTH'),
	('Lisetta Kedward','LKEDWARD'),
	('Davin Baskerfield','DBASKERFIELD'),
	('Randi Pelzer','RPELZER'),
	('Patrizius Risen','PRISEN'),
	('Alonzo Crilley','ACRILLEY'),
	('Mendel Tembridge','MTEMBRIDGE'),
	('Shane Sterrick','SSTERRICK'),
	('Letizia Durrington','LDURRINGTON'),
	('Aubert Hurch','AHURCH'),
	('Dorene Trousdale','DTROUSDALE'),
	('Antonin Haugg','AHAUGG'),
	('Coop Liddle','CLIDDLE'),
	('Lorianne Gallymore','LGALLYMORE'),
	('Johny McAuslan','JMCAUSLAN'),
	('Jeniece Roswarne','JROSWARNE'),
	('Carmon Bills','CBILLS'),
	('Marchelle Gatheridge','MGATHERIDGE'),
	('Kip Simister','KSIMISTER'),
	('Bobbie Larkby','BLARKBY'),
	('Fallon Prozillo','FPROZILLO'),
	('Kingsly Jerrold','KJERROLD'),
	('Nichol Chattington','NCHATTINGTON'),
	('Dixie Goranov','DGORANOV'),
	('Findley Piele','FPIELE'),
	('Rudolf Skentelbery','RSKENTELBERY'),
	('Germayne Caret','GCARET'),
	('Stephenie Kemston','SKEMSTON'),
	('Hermione Burk','HBURK'),
	('Abie Giovannazzi','AGIOVANNAZZI'),
	('Bella Gaish','BGAISH'),
	('Celinka Boxhall','CBOXHALL'),
	('Geoff Tatford','GTATFORD'),
	('Marisa Cunney','MCUNNEY');
  
  drop table if exists temp_announce;
  
  create table temp_announce(
	description varchar(150),
	title varchar(100));
 
  insert into temp_announce (description, title)
  values
	('Antidesma L.','Mungos mungo'),
	('Cyperus prolixus Kunth','Zenaida asiatica'),
	('Erigeron pulcherrimus A. Heller','Bucephala clangula'),
	('Quercus ×bernardiensis W. Wolf (pro sp.)','Rhea americana'),
	('Erigeron utahensis A. Gray','Bucorvus leadbeateri'),
	('Lepidium ramosissimum A. Nelson var. bourgeauanum (Thell.) Rollins','Stercorarius longicausus'),
	('Setaria setosa (Sw.) P. Beauv.','Ovis ammon'),
	('Trollius laxus Salisb.','Taxidea taxus'),
	('Bidens heterosperma A. Gray','Larus fuliginosus'),
	('Castela emoryi (A. Gray) Moran & Felger','Choloepus hoffmani'),
	('×Pseudelymus Barkworth & D.R. Dewey','Dasypus septemcincus'),
	('Pyrenula cuyabensis (Malme) R.C. Harris','Phalacrocorax albiventer'),
	('Baptisia australis (L.) R. Br. var. aberrans (Larisey) M. Mendenhall','Paradoxurus hermaphroditus'),
	('Geranium cuneatum Hook. var. cuneatum','Streptopelia senegalensis'),
	('Geranium caespitosum James var. parryi (Engelm.) W.A. Weber','Falco mexicanus'),
	('Cirsium ochrocentrum A. Gray ssp. ochrocentrum','Bettongia penicillata'),
	('Psidium sintenisii (Kiaersk.) Alain','Macropus robustus'),
	('Cymopterus williamsii R.L. Hartm. & Constance','Lamprotornis chalybaeus'),
	('Botrychium campestre W.H. Wagner & Farrar','Elephas maximus bengalensis'),
	('Gilia stellata A. Heller','Helogale undulata'),
	('Selaginella P. Beauv.','Gazella thompsonii'),
	('Banksia ashbyi Baker f.','Felis concolor'),
	('Prunella vulgaris L. ssp. aleutica (Fernald) Hultén','Dolichitus patagonum'),
	('Carex stricta Lam.','Tiliqua scincoides'),
	('Thelignya lignyota (Wahlenb.) P.M. Jørg. & Henssen','Eudyptula minor'),
	('Strigula wilsonii (Riddle) R.C. Harris','Tadorna tadorna'),
	('Cladonia anitae W.L. Culb. & C.F. Culb.','Cacatua tenuirostris'),
	('Cavernularia Degel.','Herpestes javanicus'),
	('Alectra Thunb.','Larus dominicanus'),
	('Heliconia rostrata Ruiz & Pav.','Cacatua tenuirostris'),
	('Myrciaria floribunda (West ex Willd.) Berg','Meleagris gallopavo'),
	('Antennaria friesiana (Trautv.) Ekman ssp. friesiana','Cervus elaphus'),
	('Zantedeschia albomaculata (Hook.) Baill.','Smithopsis crassicaudata'),
	('Cladonia maxima (Asah.) Ahti','Damaliscus lunatus'),
	('Nonea Medik.','Dendrocitta vagabunda'),
	('Wijkia carlottae (Schof.) H.A. Crum','Junonia genoveua'),
	('Mahonia dictyota (Jeps.) Fedde','Arctogalidia trivirgata'),
	('Eriogonum ovalifolium Nutt. var. pansum Reveal','Tayassu tajacu'),
	('Penstemon linarioides A. Gray ssp. compactifolius D.D. Keck','Naja haje'),
	('Asplenium kaulfussii Schltdl.','Genetta genetta'),
	('Sedum oreganum Nutt.','Chauna torquata'),
	('Descurainia pinnata (Walter) Britton ssp. paysonii Detling','Rangifer tarandus'),
	('Piper cubeba L. f.','Corvus brachyrhynchos'),
	('Ranunculus suksdorfii A. Gray','Cebus apella'),
	('Ruellia devosiana hort. Makoy ex A.E. Murray','Cynomys ludovicianus'),
	('Vitis labrusca L.','Pteronura brasiliensis'),
	('Lycopodiella alopecuroides (L.) Cranfill','Naja sp.'),
	('Erythronium multiscapoideum (Kellogg) A. Nelson & Kennedy','Pandon haliaetus'),
	('Dicoria canescens A. Gray','Phasianus colchicus'),
	('Downingia bella Hoover','Lasiorhinus latifrons'),
	('Mangifera odorata Griffith','Nectarinia chalybea'),
	('Thelesperma flavodiscum (Shinners) B.L. Turner','Tadorna tadorna'),
	('Hypoxis curtissii Rose','Bos taurus'),
	('Potentilla glandulosa Lindl. ssp. glandulosa','Trichoglossus chlorolepidotus'),
	('Adiantum concinnum Humb. & Bonpl. ex Willd.','Tamiasciurus hudsonicus'),
	('Streptanthus tortuosus Kellogg var. orbiculatus (Greene) H.M. Hall','Acinynox jubatus'),
	('Camissonia ovata (Nutt. ex Torr. & A. Gray) P.H. Raven','Spilogale gracilis'),
	('Lecanora utahensis H. Magn.','Marmota monax'),
	('Caloplaca castellana (Rasanen) Poelt','Paroaria gularis'),
	('Calamovilfa longifolia (Hook.) Scribn.','Panthera pardus'),
	('Veronica officinalis L. var. tournefortii (Vill.) Rchb.','Francolinus leucoscepus'),
	('Dodecatheon dentatum Hook.','Cacatua tenuirostris'),
	('Trichomanes polypodioides L.','Centrocercus urophasianus'),
	('Polygala hemipterocarpa A. Gray','Acrantophis madagascariensis'),
	('Lechea mensalis Hodgdon','Ciconia ciconia'),
	('Diodia virginiana L. var. attenuata Fernald','Agouti paca'),
	('Argemone polyanthemos (Fedde) G.B. Ownbey','Trichosurus vulpecula'),
	('Henriettea squamulosum (Cogn.) W.S. Judd','Agkistrodon piscivorus'),
	('Cryptogramma crispa (L.) R. Br. ex Hook. [excluded]','Larus dominicanus'),
	('Hesperolinon (A. Gray) Small','Actophilornis africanus'),
	('Nipponanthemum (Kitam.) Kitam.','Canis aureus'),
	('Isoetes flaccida Shuttlw. ex A. Braun var. chapmanii Engelm.','Leprocaulinus vipera'),
	('Scabiosa caucasica M. Bieb.','Macaca mulatta'),
	('Asclepias michauxii Decne.','Threskionis aethiopicus'),
	('Dactylina madreporiformis (Ach.) Tuck.','Cygnus atratus'),
	('Penstemon attenuatus Douglas ex Lindl. var. palustris (Pennell) Cronquist','Pandon haliaetus'),
	('Salvia azurea Michx. ex Lam.','Neotis denhami'),
	('Origanum heracleoticum L.','Ploceus intermedius'),
	('Eriastrum diffusum (A. Gray) H. Mason','Ephippiorhynchus mycteria'),
	('Euchiton gymnocephalus (DC.) Anderb.','Mycteria ibis'),
	('Matelea brevicoronata (B.L. Rob.) Woodson','Grus rubicundus'),
	('Ratibida tagetes (James) Barnhart','Procyon cancrivorus'),
	('Pediomelum cyphocalyx (A. Gray) Rydb.','Canis latrans'),
	('Petalonyx parryi A. Gray','Chlidonias leucopterus'),
	('Malus mandshurica (Maxim.) Kom.','Paroaria gularis'),
	('Setaria pumila (Poir.) Roem. & Schult.','Corvus albicollis'),
	('Cyanea profuga Forbes','Ovis dalli stonei'),
	('Muellerella pygmaea (Körb.) D. Hawksw.','Anhinga rufa'),
	('Veratrum californicum Durand','Crax sp.'),
	('Eleocharis fallax Weath.','Zosterops pallidus'),
	('Erigeron decumbens Nutt.','Ctenophorus ornatus'),
	('Dodecatheon meadia L. ssp. meadia','Semnopithecus entellus'),
	('Schaereria fuscocinerea (Nyl.) Clauzade & Roux','Naja haje'),
	('Lupinus affinis J. Agardh','Ceryle rudis'),
	('Tradescantia zanonia (L.) Sw.','Mabuya spilogaster'),
	('Matricaria L.','Dasypus novemcinctus'),
	('Hibiscadelphus giffardianus Rock','Diomedea irrorata'),
	('Varilla texana A. Gray','Gazella granti'),
	('Cupressus cashmeriana Carrière','Nyctereutes procyonoides'),
	('Mimulus leptaleus A. Gray','Bradypus tridactylus'),
	('Phlox covillei E.E. Nelson','Vulpes vulpes'),
	('Minuartia nuttallii (Pax) Briq. ssp. fragilis (Maguire & A.H. Holmgren) McNeill','Otaria flavescens'),
	('Aconitum reclinatum A. Gray','Sylvilagus floridanus'),
	('Lilium maritimum Kellogg','Thalasseus maximus'),
	('Pentodon Hochst.','Antilope cervicapra'),
	('Malus ×dawsoniana Rehder','Dusicyon thous'),
	('Silene caroliniana Walter','Speotyte cuniculata'),
	('Salix monochroma C.R. Ball','Felis libyca'),
	('Clermontia multiflora Hillebr.','Trichoglossus haematodus moluccanus'),
	('Rhynchospora globularis (Chapm.) Small var. globularis','Conolophus subcristatus'),
	('Apteria Nutt.','Hippotragus equinus'),
	('Adenophorus ×carsonii T.A. Ranker','Aegypius occipitalis'),
	('Lysimachia ×commixta Fernald','Lama guanicoe'),
	('Aralia chinensis L.','Larus dominicanus'),
	('Tradescantia hirsutiflora Bush','Phasianus colchicus'),
	('Verbesina walteri Shinners','Gekko gecko'),
	('Chaenactis macrantha D.C. Eaton','Falco mexicanus'),
	('Medicago L.','Melanerpes erythrocephalus'),
	('Astragalus xiphoides (Barneby) Barneby','Tamiasciurus hudsonicus'),
	('Trichoramalina crinita (Tuck.) Rundel & Bowler','Ovis ammon'),
	('Iris pallida Lam.','Martes americana'),
	('Euphorbia characias L.','Zenaida asiatica'),
	('Galium andrewsii A. Gray','Anas bahamensis'),
	('Tapellaria epiphylla (Müll. Arg.) R. Sant.','Delphinus delphis'),
	('Machaeranthera canescens (Pursh) A. Gray ssp. glabra (A. Gray) B.L. Turner var. glabra A. Gray','Arctogalidia trivirgata'),
	('Ornithogalum pyrenaicum L.','Macropus robustus'),
	('Forestiera ligustrina (Michx.) Poir.','Chionis alba'),
	('Ebenopsis ebano (Berl.) Barneby & Grimes','Balearica pavonina'),
	('Kallstroemia maxima (L.) Hook. & Arn.','unavailable'),
	('Cuphea carthagenensis (Jacq.) J.F. Macbr.','Heloderma horridum'),
	('Eleocharis macrostachya Britton','Alcelaphus buselaphus cokii'),
	('Ivesia rhypara Ertter & Reveal var. shellyi Ertter','Falco peregrinus'),
	('Microseris paludosa (Greene) J.T. Howell','Pavo cristatus'),
	('Eupatorium mikanioides Chapm.','Libellula quadrimaculata'),
	('Gomphrena haageana Klotzsch','Redunca redunca'),
	('Poa curtifolia Scribn.','Felis caracal'),
	('Alyxia Banks ex R. Br.','Lamprotornis nitens'),
	('Hartwrightia A. Gray ex S. Watson','Paraxerus cepapi'),
	('Prunus maritima Marshall var. gravesii (Small) G.J. Anderson','Cereopsis novaehollandiae'),
	('Funtumia Stapf','Colobus guerza'),
	('Setaria sphacelata (Schumach.) Stapf & C.E. Hubb. ex M.B. Moss var. sphacelata','Felis concolor'),
	('Nekemias arborea (L.) J. Wen & Boggan','Felis caracal'),
	('Arenaria stenomeres Eastw.','Mazama americana'),
	('Nitrophila occidentalis (Moq.) S. Watson','Eudromia elegans'),
	('Cladonia coccifera (L.) Willd.','Smithopsis crassicaudata'),
	('Eucalyptus andrewsii Maiden ssp. campanulata (R.T. Baker & H.G. Sm.) L.A.S. Johnson & Blaxell','Cercopithecus aethiops'),
	('Yucca harrimaniae Trel. var. sterilis Neese & S.L. Welsh','Mellivora capensis'),
	('Myriotrema terebratulum (Nyl.) Hale','Dasypus novemcinctus'),
	('Arceuthobium tsugense (Rosend.) G.N. Jones ssp. mertensianae Hawksw. & Nickrent','Dasyurus maculatus'),
	('Allocasuarina nana (Sieber ex Spreng.) L.A.S. Johnson','Paraxerus cepapi'),
	('Chilopsis linearis (Cav.) Sweet','Plocepasser mahali'),
	('Splachnum sphaericum Hedw.','Aegypius tracheliotus'),
	('Calystegia occidentalis (A. Gray) Brummitt ssp. occidentalis var. tomentella (Greene) Brummitt','Pelecanus conspicillatus'),
	('Plagiothecium cavifolium (Brid.) Z. Iwats.','Tamandua tetradactyla'),
	('Eriogonum corymbosum Benth. var. glutinosum (M.E. Jones) M.E. Jones','Felis chaus'),
	('Eriogonum arborescens Greene','Sylvilagus floridanus'),
	('Polygala leptostachys Shuttlw. ex A. Gray','Spermophilus tridecemlineatus'),
	('Imshaugia placorodia (Ach.) S.L.F. Mey.','Cacatua tenuirostris'),
	('Salix ×ehrhartiana Sm. (pro sp.)','Phasianus colchicus'),
	('Styrax benzoides Craib','Cacatua tenuirostris'),
	('Valeriana edulis Nutt. ex Torr. & A. Gray','Hyaena hyaena'),
	('Drymaria Willd. ex Schult.','Isoodon obesulus'),
	('Hypotrachyna (Vain.) Hale','Tamiasciurus hudsonicus'),
	('Arundinaria tecta (Walter) Muhl.','Macaca radiata'),
	('Nothocalais alpestris (A. Gray) K.L. Chambers','Felis rufus'),
	('Draba maguirei C.L. Hitchc.','Panthera leo persica'),
	('Collinsia sparsiflora Fisch. & C.A. Mey. var. collina (Jeps.) Newsom','Pitangus sulphuratus'),
	('Eriogonum spergulinum A. Gray var. reddingianum (M.E. Jones) J.T. Howell','Dipodomys deserti'),
	('Glycine tabacina (Labill.) Benth.','Varanus salvator'),
	('Lupinus albicaulis Douglas var. albicaulis','Certotrichas paena'),
	('Astragalus sclerocarpus A. Gray','Climacteris melanura'),
	('Halimolobos perplexa (L.F. Hend.) Rollins var. lemhiensis C.L. Hitchc.','Bubalornis niger'),
	('Leptosiphon floribundum (A. Gray) J.M. Porter & L.A. Johnson ssp. hallii (Jeps.) J.M. Porter & L.A. Johnson','Spermophilus tridecemlineatus'),
	('Cynodon bradleyi Stent','Cervus canadensis'),
	('Spiranthes ovalis Lindl. var. ovalis','Ninox superciliaris'),
	('Mertensia paniculata (Aiton) G. Don var. paniculata','Cacatua tenuirostris'),
	('Chamaesaracha crenata Rydb.','Alcelaphus buselaphus cokii'),
	('Agalinis flexicaulis Hays','Corvus albus'),
	('Anopteris hexagona (L.) C. Chr. ssp. intermedia Morton','Macropus eugenii'),
	('Cynara scolymus L.','Lasiodora parahybana'),
	('Eriogonum shockleyi S. Watson','Tayassu tajacu'),
	('Asclepias ovalifolia Decne.','Arctogalidia trivirgata'),
	('Centaurea montana L.','Tayassu pecari'),
	('Pedicularis groenlandica Retz.','Centrocercus urophasianus'),
	('Bryum riparium I. Hagen','Perameles nasuta'),
	('Pannaria pezizoides (Weber) Trevis.','Eutamias minimus'),
	('Vahlodea Fr.','Marmota caligata'),
	('Canarina L.','Tockus flavirostris'),
	('Phyllanthus amarus Schumach. & Thonn.','Canis mesomelas'),
	('Hygroamblystegium tenax (Hedw.) Jenn. var. tenax','Geospiza sp.'),
	('Arenaria hookeri Nutt.','Macropus agilis'),
	('Ptilimnium capillaceum (Michx.) Raf.','Kobus defassa'),
	('Bupleurum L.','Coluber constrictor'),
	('Flindersia R. Br.','Mellivora capensis'),
	('Geranium hanaense Medeiros & H. St. John','Herpestes javanicus'),
	('Scutellaria elliptica Muhl. ex Spreng. var. hirsuta (Short & Peter) Fernald','Eubalaena australis'),
	('Chionanthus domingensis Lam.','Varanus sp.'),
	('Juncus biglumis L.','Callipepla gambelii');

  
  
  DROP TABLE IF EXISTS temp_url;
  
  CREATE TEMP TABLE temp_url (
	URL varchar(100),
	Description varchar(100)
  );
  
  INSERT INTO temp_url(Description, URL)
  values
	('Traxxas RC','https://traxxas.com/'),
	('RedCat Racing', 'https://www.redcatracing.com/'),
	('Axial Adventure', 'https://www.axialadventure.com/'),
	('Cats Cradle Animal Rescue','http://catscradleanimalrescue.com/'),
	('Victoria Humane Society','https://victoriahumanesociety.com/'),
	('Broken Promises Animal Rescue','https://brokenpromisesrescue.com/'),
	('Victoria Buzz','https://www.victoriabuzz.com/'),
	('Victoria News','https://www.vicnews.com/'),
	('BC SPCA','https://spca.bc.ca/'),
	('Google Search','https://www.google.com'),
	('YouTube','https://www.youtube.com	'),
	('Facebook','https://www.facebook.com'),
	('Instagram','https://www.instagram.com'),
	('X','https://www.x.com'),
	('Baidu','https://www.baidu.com'),
	('Wikipedia','https://www.wikipedia.org'),
	('Yahoo!','https://www.yahoo.com'),
	('WhatsApp','https://www.whatsapp.com'),
	('ChatGPT','https://www.chatgpt.com'),
	('Reddit','https://www.reddit.com'),
	('TikTok','https://www.tiktok.com'),
	('Amazon','https://www.amazon.com'),
	('Docomo','https://www.docomo.ne.jp'),
	('Outlook.com','https://www.live.com'),
	('LinkedIn','https://www.linkedin.com'),
	('Netflix','https://www.netflix.com	'),
	('Twitter','https://www.twitter.com'),
	('Microsoft 365','https://www.office.com'),
	('Pinterest','https://www.pinterest.com'),
	('Bing','https://www.bing.com'),
	('Max','https://www.max.com'),
	('Microsoft Online','https://www.microsoftonline.com'),
	('Bilibili','https://www.bilibili.com'),
	('Naver','https://www.naver.com'),
	('Discord','https://www.discord.com	'),
	('Samsung','https://www.samsung.com'),
	('Microsoft','https://www.microsoft.com'),
	('Twitch','https://www.twitch.tv'),
	('Weather','https://www.weather.com'),
	('Quora','https://www.quora.com'),
	('Roblox','https://www.roblox.com'),
	('DuckDuckGo','https://www.duckduckgo.com'),
	('SharePoint','https://www.sharepoint.com'),
	('QQ','https://www.qq.com'),
	('eBay','https://www.ebay.com');
	
	

  FOR adminCounter in 1..adminUpperBound LOOP
	
	
	
	if(useExistingAdmins = true) then
	
		select admin_user_id into adminID from admin_user order by random() limit 1;
		
	else
		adminID := gen_random_uuid();
		idirGuid := gen_random_uuid();
		
		--temp_adminUser (displayName, IDIR)
		select fullName into displayName from temp_adminUser order by random() limit 1;
		select IDIR into createUser from temp_adminUser order by random() limit 1;
		select IDIR into updateUser from temp_adminUser order by random() limit 1;
		
		adminEmail := replace(displayName, ' ', '.') || '@notanemail.com';
		
		insert into admin_user( 
			admin_user_id
			,idir_user_guid
			,display_name
			,create_date
			,create_user
			,update_date
			,update_user
			,is_active
			,assigned_roles
			,preferred_username
			,last_login
			,email)
		values(
			adminID
			,idirGuid
			,displayName
			,NOW() - INTERVAL '7 DAYS'
			,createUser
			,NOW() - INTERVAL '7 DAYS'
			,updateUser
			,true
			,'ADMIN'
			,displayName
			,NOW()
			,adminEmail);
		
	end if;
	
    
	
	FOR announcementCounter in 1..announcementUpperBound LOOP
		
		announcementId = gen_random_uuid();
		
		select description, title into announcementDesc, announcementTitle from temp_announce order by random() limit 1;
		
		--DELETED is excluded because deleted announcements are only found in the history table (removed from annoucement table)
		select code into announcementStatus from announcement_status where code in ('DRAFT', 'EXPIRED', 'PUBLISHED') order by random() limit 1;
		
		IF (announcementStatus = 'PUBLISHED') THEN
			announcementPublished := NOW() - INTERVAL '4 days';
			announcementExpires   := NOW() + INTERVAL '90 days';
		ELSIF(announcementStatus = 'DRAFT') THEN
			announcementPublished := null;
			announcementExpires := null; 
		ELSIF(announcementStatus = 'EXPIRED') THEN
			announcementPublished := NOW() - INTERVAL '7 days';
		    announcementExpires := NOW() - INTERVAL '1 days';  
		END if;
		
		
		insert into announcement(
			announcement_id
			,title
			,description
			,created_by
			,updated_by
			,published_on
			,expires_on
			,status)
		values(
			announcementId
			,announcementTitle
			,announcementDesc
			,adminID
			,adminID
			,announcementPublished
			,announcementExpires
			,announcementStatus);
		
		FOR resourceCounter in 1..3 LOOP
		
			select description, url into resourceDesc, resourceURL from temp_url order by random() limit 1;
			
			insert into announcement_resource(
				announcement_id
				,display_name
				,resource_url
				,created_by
				,updated_by
				,resource_type)
			values(
				announcementId
				,resourceDesc
				,resourceURL
				,adminID
				,adminID
				,'LINK');
			
		END LOOP; -- resourceCounter
			
			
		
	END LOOP; -- announcementCounter
	
	
  
  END LOOP; --adminCounter loop
  
  DROP TABLE IF EXISTS temp_url;
  drop table if exists temp_announce;
  drop table if exists temp_adminUser;

END
$$
