/*
Creates a bunch of test data using the same calculation data for each report.

*/

do
$$

declare
	yearCounter integer;
	companyCounter integer;
	

	
	companyId uuid;
	bceidBusinessGuid uuid;
	companyName varchar; 
	address1 varchar;
	city varchar;
	
	userId uuid;
	fName varchar;
	lName varChar;
	userDisplayName varchar;
	
	reportId uuid;
	naicsCode varchar;
	empCountRangeId uuid; 
	
	reportStartDate varchar;
	reportEndDate varchar;
	reportLoopUpperBound integer;
	reportCounter integer;
	reportStatus varchar;
	reportStartMonth integer;
	reportEndMonth integer;
	reportStartMonthText varchar;
	reportEndMonthText varchar;
	reportEndDayText varChar;
	
	percentReceivingOtPayx uuid;
	percentReceivingOtPayu uuid;
	percentReceivingBonusPaym uuid;
	percentReceivingBonusPayw uuid;
	percentReceivingBonusPayx uuid;
	percentReceivingBonusPayu uuid;
	referenceGenderCategoryCode uuid;
	meanOtHoursDiffm uuid;
	meanOtHoursDiffW uuid;
	meanOtHoursDiffX uuid;
	meanOtHoursDiffU uuid;
	medianOtHoursDiffM uuid;
	medianOtHoursDiffW uuid;
	medianOtHoursDiffX uuid;
	medianOtHoursDiffU uuid;
	meanBonusPayDiffM uuid;
	meanBonusPayDiffW uuid;
	meanBonusPayDiffX uuid;
	meanHourlyPayDiffM uuid;
	meanHourlyPayDiffW uuid;
	meanHourlyPayDiffX uuid;
	meanHourlyPayDiffU uuid;
	medianHourlyPayDiffM uuid;
	medianHourlyPayDiffW uuid;
	medianHourlyPayDiffX uuid;
	medianHourlyPayDiffU uuid;
	meanOtPayDiffM uuid;
	meanOtPayDiffW uuid;
	meanOtPayDiffX uuid;
	meanOtPayDiffU uuid;
	medianOtPayDiffM uuid;
	medianOtPayDiffW uuid;
	medianOtPayDiffX uuid;
	medianOtPayDiffU uuid;
	meanBonusPayDiffU uuid;
	medianBonusPayDiffM uuid;
	medianBonusPayDiffW uuid;
	medianBonusPayDiffX uuid;
	medianBonusPayDiffU uuid;
	hourlyPayPercentQuartile1M uuid;
	hourlyPayPercentQuartile1W uuid;
	hourlyPayPercentQuartile1X uuid;
	hourlyPayPercentQuartile1U uuid;
	hourlyPayPercentQuartile2M uuid;
	hourlyPayPercentQuartile2W uuid;
	hourlyPayPercentQuartile2X uuid;
	hourlyPayPercentQuartile2U uuid;
	hourlyPayPercentQuartile3M uuid;
	hourlyPayPercentQuartile3W uuid;
	hourlyPayPercentQuartile3X uuid;
	hourlyPayPercentQuartile3U uuid;
	hourlyPayPercentQuartile4M uuid;
	hourlyPayPercentQuartile4W uuid;
	hourlyPayPercentQuartile4X uuid;
	hourlyPayPercentQuartile4U uuid;
	percentReceivingOtPayM uuid;
	percentReceivingOtPayW uuid;
	
begin
	--select calculation_code_id into  from pay_transparency.calculation_code where calculation_code = '';
	--load the uuids into variables using the codes. 
	--This will allow this script to be run regardless of where the codes were created (uuids are always distinct)
	
	select calculation_code_id into percentReceivingOtPayx from pay_transparency.calculation_code where calculation_code = 'PERCENT_RECEIVING_OT_PAY_X';
	select calculation_code_id into percentReceivingOtPayu from pay_transparency.calculation_code where calculation_code = 'PERCENT_RECEIVING_OT_PAY_U';
	select calculation_code_id into percentReceivingBonusPaym from pay_transparency.calculation_code where calculation_code = 'PERCENT_RECEIVING_BONUS_PAY_M';
	select calculation_code_id into percentReceivingBonusPayw from pay_transparency.calculation_code where calculation_code = 'PERCENT_RECEIVING_BONUS_PAY_W';
	select calculation_code_id into percentReceivingBonusPayx from pay_transparency.calculation_code where calculation_code = 'PERCENT_RECEIVING_BONUS_PAY_X';
	select calculation_code_id into percentReceivingBonusPayu from pay_transparency.calculation_code where calculation_code = 'PERCENT_RECEIVING_BONUS_PAY_U';
	select calculation_code_id into referenceGenderCategoryCode from pay_transparency.calculation_code where calculation_code = 'REFERENCE_GENDER_CATEGORY_CODE';
	select calculation_code_id into meanOtHoursDiffm from pay_transparency.calculation_code where calculation_code = 'MEAN_OT_HOURS_DIFF_M';
	select calculation_code_id into meanOtHoursDiffW from pay_transparency.calculation_code where calculation_code = 'MEAN_OT_HOURS_DIFF_W';
	select calculation_code_id into meanOtHoursDiffX from pay_transparency.calculation_code where calculation_code = 'MEAN_OT_HOURS_DIFF_X';
	select calculation_code_id into meanOtHoursDiffU from pay_transparency.calculation_code where calculation_code = 'MEAN_OT_HOURS_DIFF_U';
	select calculation_code_id into medianOtHoursDiffM from pay_transparency.calculation_code where calculation_code = 'MEDIAN_OT_HOURS_DIFF_M';
	select calculation_code_id into medianOtHoursDiffW from pay_transparency.calculation_code where calculation_code = 'MEDIAN_OT_HOURS_DIFF_W';
	select calculation_code_id into medianOtHoursDiffX from pay_transparency.calculation_code where calculation_code = 'MEDIAN_OT_HOURS_DIFF_X';
	select calculation_code_id into medianOtHoursDiffU from pay_transparency.calculation_code where calculation_code = 'MEDIAN_OT_HOURS_DIFF_U';
	select calculation_code_id into meanBonusPayDiffM from pay_transparency.calculation_code where calculation_code = 'MEAN_BONUS_PAY_DIFF_M';
	select calculation_code_id into meanBonusPayDiffW from pay_transparency.calculation_code where calculation_code = 'MEAN_BONUS_PAY_DIFF_W';
	select calculation_code_id into meanBonusPayDiffX from pay_transparency.calculation_code where calculation_code = 'MEAN_BONUS_PAY_DIFF_X';
	select calculation_code_id into meanHourlyPayDiffM from pay_transparency.calculation_code where calculation_code = 'MEAN_HOURLY_PAY_DIFF_M';
	select calculation_code_id into meanHourlyPayDiffW from pay_transparency.calculation_code where calculation_code = 'MEAN_HOURLY_PAY_DIFF_W';
	select calculation_code_id into meanHourlyPayDiffX from pay_transparency.calculation_code where calculation_code = 'MEAN_HOURLY_PAY_DIFF_X';
	select calculation_code_id into meanHourlyPayDiffU from pay_transparency.calculation_code where calculation_code = 'MEAN_HOURLY_PAY_DIFF_U';
	select calculation_code_id into medianHourlyPayDiffM from pay_transparency.calculation_code where calculation_code = 'MEDIAN_HOURLY_PAY_DIFF_M';
	select calculation_code_id into medianHourlyPayDiffW from pay_transparency.calculation_code where calculation_code = 'MEDIAN_HOURLY_PAY_DIFF_W';
	select calculation_code_id into medianHourlyPayDiffX from pay_transparency.calculation_code where calculation_code = 'MEDIAN_HOURLY_PAY_DIFF_X';
	select calculation_code_id into medianHourlyPayDiffU from pay_transparency.calculation_code where calculation_code = 'MEDIAN_HOURLY_PAY_DIFF_U';
	select calculation_code_id into meanOtPayDiffM from pay_transparency.calculation_code where calculation_code = 'MEAN_OT_PAY_DIFF_M';
	select calculation_code_id into meanOtPayDiffW from pay_transparency.calculation_code where calculation_code = 'MEAN_OT_PAY_DIFF_W';
	select calculation_code_id into meanOtPayDiffX from pay_transparency.calculation_code where calculation_code = 'MEAN_OT_PAY_DIFF_X';
	select calculation_code_id into meanOtPayDiffU from pay_transparency.calculation_code where calculation_code = 'MEAN_OT_PAY_DIFF_U';
	select calculation_code_id into medianOtPayDiffM from pay_transparency.calculation_code where calculation_code = 'MEDIAN_OT_PAY_DIFF_M';
	select calculation_code_id into medianOtPayDiffW from pay_transparency.calculation_code where calculation_code = 'MEDIAN_OT_PAY_DIFF_W';
	select calculation_code_id into medianOtPayDiffX from pay_transparency.calculation_code where calculation_code = 'MEDIAN_OT_PAY_DIFF_X';
	select calculation_code_id into medianOtPayDiffU from pay_transparency.calculation_code where calculation_code = 'MEDIAN_OT_PAY_DIFF_U';
	select calculation_code_id into meanBonusPayDiffU from pay_transparency.calculation_code where calculation_code = 'MEAN_BONUS_PAY_DIFF_U';
	select calculation_code_id into medianBonusPayDiffM from pay_transparency.calculation_code where calculation_code = 'MEDIAN_BONUS_PAY_DIFF_M';
	select calculation_code_id into medianBonusPayDiffW from pay_transparency.calculation_code where calculation_code = 'MEDIAN_BONUS_PAY_DIFF_W';
	select calculation_code_id into medianBonusPayDiffX from pay_transparency.calculation_code where calculation_code = 'MEDIAN_BONUS_PAY_DIFF_X';
	select calculation_code_id into medianBonusPayDiffU from pay_transparency.calculation_code where calculation_code = 'MEDIAN_BONUS_PAY_DIFF_U';
	select calculation_code_id into hourlyPayPercentQuartile1M from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_1_M';
	select calculation_code_id into hourlyPayPercentQuartile1W from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_1_W';
	select calculation_code_id into hourlyPayPercentQuartile1X from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_1_X';
	select calculation_code_id into hourlyPayPercentQuartile1U from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_1_U';
	select calculation_code_id into hourlyPayPercentQuartile2M from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_2_M';
	select calculation_code_id into hourlyPayPercentQuartile2W from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_2_W';
	select calculation_code_id into hourlyPayPercentQuartile2X from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_2_X';
	select calculation_code_id into hourlyPayPercentQuartile2U from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_2_U';
	select calculation_code_id into hourlyPayPercentQuartile3M from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_3_M';
	select calculation_code_id into hourlyPayPercentQuartile3W from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_3_W';
	select calculation_code_id into hourlyPayPercentQuartile3X from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_3_X';
	select calculation_code_id into hourlyPayPercentQuartile3U from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_3_U';
	select calculation_code_id into hourlyPayPercentQuartile4M from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_4_M';
	select calculation_code_id into hourlyPayPercentQuartile4W from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_4_W';
	select calculation_code_id into hourlyPayPercentQuartile4X from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_4_X';
	select calculation_code_id into hourlyPayPercentQuartile4U from pay_transparency.calculation_code where calculation_code = 'HOURLY_PAY_PERCENT_QUARTILE_4_U';
	select calculation_code_id into percentReceivingOtPayM from pay_transparency.calculation_code where calculation_code = 'PERCENT_RECEIVING_OT_PAY_M';
	select calculation_code_id into percentReceivingOtPayW from pay_transparency.calculation_code where calculation_code = 'PERCENT_RECEIVING_OT_PAY_W';
	
	--temp table for names, company names and addresses from Mockeraoo
	
	DROP TABLE IF EXISTS temp_names;
	
	CREATE TEMP TABLE temp_names (
		title varchar(5),
		firstName varchar(50),
		lastName varchar(50),
		compName varchar(50),
		address varchar(50));
	


	insert into temp_names (firstName, lastName, compName, address)
	values 
		('Wynny','Carol','Viva','6269 Debra Alley'),
		('Dido','Vaskin','Yakitri','5 Carey Place'),
		('Magnum','Philipeau','Linkbuzz','6 Continental Road'),
		('Benny','Muslim','Blognation','69 Donald Place'),
		('Doris','Surgeoner','Npath','2 Jenifer Avenue'),
		('Adey','Gauntlett','Twitterbridge','72 Anthes Street'),
		('Karisa','Pieroni','Brightdog','88 Linden Crossing'),
		('Adora','Lemasney','Reallinks','70923 Rigney Circle'),
		('Adel','Davidovich','Brainverse','08232 Pleasure Parkway'),
		('Dimitry','Dominiak','Quamba','99734 Canary Terrace'),
		('Aloysia','Connar','Meetz','05 Summer Ridge Terrace'),
		('Karie','Benezet','Bubbletube','599 Myrtle Avenue'),
		('Clarence','Edlin','Fivechat','5 Sherman Parkway'),
		('Mamie','Dmytryk','Dabfeed','73 Mockingbird Circle'),
		('Harlin','Nias','Skipstorm','7 Bowman Center'),
		('Deva','Busch','Vidoo','51699 Shoshone Drive'),
		('Halie','Phippard','Twinte','13 Brentwood Point'),
		('Phoebe','Bartleet','BlogXS','3389 Darwin Place'),
		('Cello','Stiebler','Topicblab','36390 Old Shore Point'),
		('Auberon','Bore','Quinu','6806 Pawling Junction'),
		('May','Stetson','Kazio','2 Arizona Parkway'),
		('Staci','Spary','Jabberbean','4 Talisman Point'),
		('Darell','Bissatt','Janyx','98508 Waywood Plaza'),
		('Ailina','Jest','Jaloo','250 Bellgrove Park'),
		('Dan','Saphir','Thoughtstorm','59934 Erie Alley'),
		('Joe','Giampietro','Twiyo','34 Sutteridge Street'),
		('Barbi','Espinoza','Flashset','89746 Laurel Lane'),
		('Amalee','Waszkiewicz','Meejo','56 Miller Road'),
		('Tandi','Raper','Skimia','1066 Crownhardt Avenue'),
		('Budd','Edmott','Photobug','001 North Crossing'),
		('Rebekah','Gash','Twiyo','4525 Buena Vista Park'),
		('Maris','Bransdon','Jetwire','2438 Old Gate Lane'),
		('Wittie','Ansley','Browsezoom','208 Ridgeview Street'),
		('Maye','Sawtell','Tambee','151 Eggendart Pass'),
		('Elisabeth','Le - Count','Blognation','359 Mcbride Parkway'),
		('Garnette','Kiddey','Midel','042 Starling Crossing'),
		('Wilmette','Sier','Flipbug','03 Northland Alley'),
		('Cody','Maingot','Zooveo','840 La Follette Park'),
		('Dodie','Frushard','Tambee','1895 Forest Run Parkway'),
		('Valeria','Delagnes','Yakijo','07 Porter Alley'),
		('Chandra','Insko','Rhyzio','4 Vera Drive'),
		('Isacco','Hysom','Feedmix','47524 Swallow Street'),
		('Zaccaria','Swepson','Realfire','4248 Calypso Point'),
		('Julienne','Gauthorpp','Tanoodle','0921 Paget Alley'),
		('Geri','Caudelier','Jaxspan','4965 Sullivan Junction'),
		('Giffy','McAirt','Avamba','66 Veith Lane'),
		('Luke','Fruish','Jabbercube','49 Spaight Junction'),
		('Boonie','Moorey','Vidoo','9228 Kim Hill'),
		('Saxe','Fenck','Meejo','1694 Graedel Hill'),
		('Rania','Emlin','Devshare','5 Beilfuss Avenue'),
		('Dee dee','Hugnin','Buzzbean','4134 Gateway Junction'),
		('Lindon','Hollidge','Tagtune','63 Bowman Point'),
		('Jenna','Kareman','Jayo','90 Everett Drive'),
		('Grayce','Jopling','Browsedrive','980 Dunning Hill'),
		('Demetri','Ricardo','Midel','9482 Pierstorff Avenue'),
		('Carlynne','Dumingos','Ntags','52 Old Gate Trail'),
		('Eryn','Gentiry','Oyondu','1 Rigney Alley'),
		('Roxy','Swanton','Einti','90 Cottonwood Pass'),
		('Ursa','Wollers','Zoonoodle','057 Forest Run Junction'),
		('Jemimah','Gebby','Jazzy','198 Lighthouse Bay Court'),
		('Pearline','Piccard','Babbleopia','243 Alpine Avenue'),
		('Kylie','Maly','Reallinks','0798 Orin Terrace'),
		('Melisande','Brody','Skiba','50 Morrow Pass'),
		('Sunny','Towl','Jabbercube','881 Marcy Circle'),
		('Dario','Enos','Fanoodle','3665 Ridge Oak Road'),
		('Edithe','Baldinotti','Blogtags','70 Bonner Road'),
		('Nicolle','Lightbown','Devshare','637 Linden Lane'),
		('Giacomo','Bourhill','Eadel','799 Packers Junction'),
		('Grover','Barnicott','Kazu','97 Gateway Circle'),
		('Nicko','Amies','Oyondu','01 Forest Run Terrace'),
		('Dennie','Iglesias','Myworks','51758 Menomonie Hill'),
		('Candis','Cromett','Oyoba','4 Harper Pass'),
		('Melvin','Partkya','Fadeo','83 Morningstar Place'),
		('Remus','Scardifield','Zoombox','28 Starling Parkway'),
		('Sunshine','Di Domenico','Bubblebox','392 Talisman Plaza'),
		('Ripley','Petett','Aimbo','0 Fairfield Crossing'),
		('Quincey','Woolley','Abata','92 New Castle Hill'),
		('Bradney','Dubbin','Wikizz','06 Marquette Park'),
		('Nicoline','Trouncer','Tagfeed','4 Northview Center'),
		('Bartlett','Menzies','Eayo','61710 Hagan Terrace'),
		('Rufus','Allbrook','Mybuzz','733 Pawling Road'),
		('Layne','Haile','Centizu','9816 Moland Crossing'),
		('Whitney','Ochterlony','Katz','4052 Havey Crossing'),
		('Zaneta','O''Riordan','Quimm','7065 Coleman Circle'),
		('Paige','Hazeley','Centidel','94136 Elka Pass'),
		('Armin','Roberti','Tagcat','887 Hanover Place'),
		('Brad','Sailor','Janyx','8472 Thackeray Crossing'),
		('Misty','Balcock','Dazzlesphere','525 Linden Way'),
		('Roger','Loreit','Dablist','2 Monument Road'),
		('Margaretta','Bill','Flashdog','5 Bluestem Drive'),
		('Emyle','Caddy','Fliptune','75457 La Follette Way'),
		('Mirella','Piet','Tambee','4279 Arrowood Drive'),
		('Alvina','Cutress','Bubblemix','54 Bluestem Lane'),
		('Katrinka','Yakubovics','Jaxworks','76 Southridge Crossing'),
		('Wiatt','Chevers','Katz','055 Cottonwood Avenue'),
		('Laura','Dowbakin','Edgewire','368 Randy Junction'),
		('Dorita','Bartolomucci','Fivebridge','885 Lotheville Park'),
		('Pebrook','Millen','Yozio','340 Toban Circle'),
		('Paula','Farherty','Trudoo','1756 Paget Crossing'),
		('Almeta','Scarlett','Tekfly','89438 Bunting Plaza'),
		('Dorice','Upson','Jaxworks','1 Dexter Trail'),
		('Katie','Haversham','Centizu','6676 Ridgeview Alley'),
		('Anabal','Hallam','Myworks','144 Anderson Center'),
		('Christyna','Lortz','Flashdog','47 Kropf Terrace'),
		('Sim','Lafayette','Shufflebeat','895 Sunfield Plaza'),
		('Paulina','Rowlatt','Ailane','7952 Continental Park'),
		('Geri','Chasney','Eire','484 Hermina Place'),
		('Suzanne','Pregal','Shufflester','5782 Reindahl Way'),
		('Sheilah','Piscopiello','Skippad','6084 Heffernan Point'),
		('Lyndsey','Wye','Eidel','180 Maple Wood Place'),
		('Mair','Scherme','Realmix','5182 Prentice Road'),
		('Kit','Tilne','Devcast','498 Quincy Alley'),
		('Morly','Bridgestock','Chatterbridge','183 Clove Trail'),
		('Vincenty','Dunbobbin','Browsetype','5323 Mockingbird Drive'),
		('Barnabas','Minerdo','Twitternation','76241 Merrick Parkway'),
		('Kippie','Isac','Trilia','3769 Carey Point'),
		('Gannon','Nibloe','Linkbridge','1422 Algoma Alley'),
		('Leonanie','Butcher','Skyvu','0746 Buell Terrace'),
		('Owen','Griss','Twinte','2 Manley Point'),
		('Kyle','Clipson','Katz','76 3rd Plaza'),
		('Sauncho','Ferebee','Youspan','1629 Superior Place'),
		('Muriel','Blest','Devcast','93 Comanche Drive'),
		('Trumaine','Molfino','Wordtune','88726 Dovetail Hill'),
		('Kippie','Knutsen','Mybuzz','50013 Montana Hill'),
		('Herc','Skarin','Meetz','905 Lighthouse Bay Avenue'),
		('Karilynn','Hyndes','Yodoo','7383 Trailsway Street'),
		('Avictor','Aishford','Realmix','92 Hayes Avenue'),
		('Ceciley','McLise','Lazz','679 Eagan Circle'),
		('Zonnya','Ramme','Eayo','643 Dorton Park'),
		('Ninette','Drinkall','Yodel','01 American Ash Circle'),
		('Annabel','Vize','Voonte','66841 Bellgrove Trail'),
		('Oralla','Gladwish','Jayo','7 Colorado Trail'),
		('Gerianna','Gratrex','Gabspot','0835 Marcy Plaza'),
		('Katey','Mease','Dablist','9078 Rowland Crossing'),
		('Tedman','Minor','Edgetag','55 Ridge Oak Road'),
		('Kermy','Squibb','Voonyx','973 Iowa Lane'),
		('Fredrika','Gareisr','Jazzy','99 Evergreen Road'),
		('Merissa','Kasher','Browsedrive','8678 Judy Terrace'),
		('Garold','Rodda','Topdrive','90139 Spohn Hill'),
		('Eugen','Franck','Blogtag','66028 Buell Road'),
		('Darline','Beades','DabZ','986 Jenifer Point'),
		('Shandee','Whitland','Vitz','16714 Reinke Avenue'),
		('Candy','Lancett','Kaymbo','938 Londonderry Alley'),
		('Saxe','Dagger','Browsecat','264 Moose Way'),
		('Paige','Greathead','Realbridge','14660 Vahlen Place'),
		('Maxie','Newnham','Fivespan','818 Petterle Street'),
		('Trenton','Keetley','Browseblab','7805 High Crossing Terrace'),
		('Rabbi','Billett','Meevee','071 Pawling Trail'),
		('Taffy','Leyzell','Oyoloo','33001 Gina Alley'),
		('Bern','Bridal','Shufflebeat','06047 Prentice Pass'),
		('Isa','Wedderburn','Browsecat','99985 Becker Park'),
		('Jeno','Dowty','Yodoo','33 Valley Edge Trail'),
		('Terrijo','Leffek','Ooba','1777 Melby Road'),
		('Othella','Sweetmore','Yadel','854 Cherokee Terrace'),
		('Elnora','Wemm','Flashset','641 Stuart Junction'),
		('Sela','Elwood','Layo','07581 Morning Road'),
		('Xerxes','Goold','Riffpath','64493 Rutledge Hill'),
		('Constantine','Fearn','Fliptune','310 Transport Road'),
		('Matias','Priddle','Linkbuzz','90812 Glendale Park'),
		('Michell','Geraldo','Plambee','728 Boyd Road'),
		('Merwyn','Avison','Jabbertype','0076 Laurel Trail'),
		('Aura','Skentelbury','Browsedrive','5952 Sauthoff Crossing'),
		('Jammal','Winson','Talane','7 Browning Pass'),
		('Carleen','Muat','Pixope','8623 Lerdahl Drive'),
		('Antonia','Jamme','Devpulse','890 Daystar Road'),
		('Lynnea','Gerardet','Eayo','1277 Cody Center'),
		('Mohammed','Pay','Voonte','42 Corscot Hill'),
		('Dell','Osborne','Rooxo','7 Fisk Point'),
		('Paulina','Cornick','Edgeify','3386 Londonderry Junction'),
		('Michael','Heaselgrave','Lajo','16001 Rieder Road'),
		('Constancia','Borless','Thoughtmix','4745 Carpenter Place'),
		('Lawry','Kelson','Yakitri','786 Kenwood Plaza'),
		('Elston','Brattan','Tagcat','8 Burning Wood Alley'),
		('Anselm','Allonby','Photobug','13131 Elka Crossing'),
		('Jeremias','Dimitrie','Meedoo','1 Mendota Parkway'),
		('Shannan','Howselee','Aimbu','34755 Fair Oaks Alley'),
		('Marianna','Simants','Dynabox','4056 Weeping Birch Center'),
		('Timmy','Beves','Centizu','842 Kipling Place'),
		('Balduin','Turgoose','Babblestorm','91367 Colorado Pass'),
		('Harley','Elcoate','Eimbee','296 Katie Center'),
		('Bruis','Dockrill','Katz','0412 Grover Avenue'),
		('Con','Wilkinson','Gigashots','954 Anniversary Terrace'),
		('Linc','Boame','Browsedrive','73679 Merrick Hill'),
		('Patricia','Flamank','Podcat','412 Village Terrace'),
		('Halsy','Slopier','Twitterbeat','1 Maywood Pass'),
		('Royce','Coltart','Twinte','840 Haas Parkway'),
		('Valentina','Ledbury','Zoozzy','22137 Mifflin Court'),
		('Anstice','Whitesel','Kaymbo','1 7th Park'),
		('Hadley','Dallemore','Yozio','23565 Drewry Park'),
		('Jobi','Romanet','InnoZ','7 Cardinal Street'),
		('Gustie','Moss','Brainverse','7049 Glacier Hill Point'),
		('Christophe','Windridge','Skyndu','8 Northridge Park'),
		('Starla','Dripp','Zoomlounge','19 Dixon Alley'),
		('Haily','Tomanek','Gabtype','47546 Springs Hill'),
		('Othilia','Jahns','Mita','803 Valley Edge Court'),
		('Balduin','Tirrell','Jazzy','23753 Washington Plaza'),
		('Jeremiah','Lightbown','Roombo','8 Tomscot Park'),
		('Edwin','Lansley','Feedspan','52685 Bay Alley'),
		('Krispin','Elliker','Fiveclub','87040 New Castle Hill'),
		('Crissie','Wallhead','Wordware','859 Starling Junction'),
		('Faustine','Trenfield','Flashset','576 Kingsford Crossing'),
		('Emery','Lisciardelli','Twinte','32158 Steensland Hill'),
		('Gwendolin','Tonry','Kazu','96331 Summer Ridge Alley'),
		('Wiatt','Goeff','Reallinks','3293 Kingsford Junction'),
		('Kristina','Birch','Eidel','8106 Barby Hill'),
		('Jermain','Cheney','Kare','83939 Walton Pass'),
		('Cece','Shapcote','Agivu','6191 Carpenter Terrace'),
		('Jeanne','Moraleda','Jazzy','02755 Roth Park'),
		('Anjela','Whellans','Livepath','0925 Toban Alley'),
		('Tiffie','Kybird','Jamia','85 Waywood Street'),
		('Danielle','Scoggan','Brainverse','9973 Ruskin Pass'),
		('Paulo','Dunniom','Skalith','4898 Cambridge Avenue'),
		('Grier','Tremain','Fiveclub','2 Rutledge Terrace'),
		('Giacinta','Tims','Twitterbeat','2 Sycamore Drive'),
		('Joella','Georg','Skivee','068 Stuart Avenue'),
		('Mattias','Saunt','Youspan','48 Becker Plaza'),
		('Karim','Sherred','Roomm','769 Hauk Pass'),
		('Amalita','Halling','Skinder','4 Lakewood Gardens Trail'),
		('Xaviera','Trees','Rhyzio','637 Melby Way'),
		('Julita','Willets','Topiczoom','0795 Pearson Center'),
		('Carissa','McKinie','Kwinu','712 Londonderry Parkway'),
		('Ricca','Gleave','Skibox','541 Muir Point'),
		('Milty','Linturn','Quatz','8111 Everett Point'),
		('Lyda','Lutwyche','Shuffledrive','12 Brentwood Drive'),
		('Mohandas','McAster','Fiveclub','72 Browning Circle'),
		('Caren','Littler','Quatz','54 Continental Center'),
		('Hart','Kilfeather','Quamba','1 Maple Circle'),
		('Kayla','Reinhard','Brainbox','1 Dawn Way'),
		('Jacqueline','Fannin','Oyoba','28449 Kenwood Pass'),
		('Gerick','Rawstron','Cogibox','0 Twin Pines Alley'),
		('Annabal','Sydry','Skimia','9083 Menomonie Drive'),
		('Sansone','Lequeux','Lazz','83963 Spaight Trail'),
		('Adrien','Aisman','Yakidoo','7 Sullivan Plaza'),
		('Germain','Giacomuzzo','Youbridge','547 Arrowood Lane'),
		('Ethelbert','Kelso','Wikizz','82392 Waubesa Drive'),
		('Patrizia','O''Dulchonta','Twinder','4657 Lyons Park'),
		('Kasey','Swyre','Chatterpoint','80 Hoepker Crossing'),
		('Janette','Napoli','Rhyloo','19 Hollow Ridge Circle'),
		('Astrid','Haskur','Blognation','69 Corry Junction'),
		('Kaleena','Dran','Voonix','3689 Red Cloud Hill'),
		('Dagny','Yetman','Thoughtbeat','9875 Dawn Junction'),
		('Giraldo','Southerns','Flipstorm','641 Daystar Way'),
		('Corella','Nicol','Photofeed','522 Northview Center'),
		('Stan','Pescott','Rhynoodle','1716 Glacier Hill Point'),
		('Bev','Osorio','Mymm','03042 Bayside Avenue'),
		('Stephanie','Jewks','Topicshots','97493 Longview Center'),
		('Lemmie','Gillean','Dazzlesphere','3 Calypso Circle'),
		('Sianna','Cabane','Skibox','72 Lukken Point'),
		('Adelbert','Mateja','Bluezoom','3958 Fuller Court'),
		('Margy','Drohun','Teklist','98 Monument Court'),
		('Bax','McQuillin','Flashspan','356 Grim Point'),
		('Vergil','Greggor','Lazzy','5 Dawn Pass'),
		('Brendon','Gander','Voomm','50 Namekagon Parkway'),
		('Juan','Geldeford','Wikido','5 Redwing Circle'),
		('Eli','de Tocqueville','Flashdog','5976 Sommers Drive'),
		('Sumner','Agronski','Tagpad','6577 Almo Crossing'),
		('Collin','Cecchetelli','DabZ','13 Boyd Center'),
		('Valerye','Arnholz','Zooveo','4 Rockefeller Crossing'),
		('Tommi','Cure','Jabbersphere','311 David Drive'),
		('Imogen','McGilvray','Geba','87 Goodland Pass'),
		('Nanny','Billany','Quamba','5955 Moose Street'),
		('Michel','Hagston','Yoveo','92 Village Green Park'),
		('Abel','Brunke','Twitterlist','535 Kenwood Drive'),
		('Everett','Allridge','Quire','7554 Barnett Junction'),
		('Alexandr','Gilmour','Mita','0 Bay Point'),
		('Rip','Cashmore','Jabbertype','71958 Sunbrook Way'),
		('Kayla','Mustarde','Tanoodle','1026 Florence Plaza'),
		('Phillipe','Noad','Edgepulse','31 Crest Line Avenue'),
		('Steffen','Grivori','Bubbletube','27 Warbler Hill'),
		('Alisander','Dhenin','Edgepulse','83640 Chive Center'),
		('Judith','Bortolussi','Browseblab','31 Hoffman Plaza'),
		('Gertrudis','Maris','Jabberbean','61 Dryden Terrace'),
		('Nathalie','Laxen','Realpoint','28 Straubel Pass'),
		('Cornelle','Sagrott','Brainlounge','91562 Erie Hill'),
		('Lyle','Molnar','Ozu','506 Holmberg Drive'),
		('Torrie','Van T''Hoog','Buzzdog','7834 Vahlen Alley'),
		('Gwennie','Borzoni','Dabtype','20852 Maywood Crossing'),
		('Brendan','Dallan','Tambee','35339 Marquette Point'),
		('Kori','Ubach','Roodel','4614 Mandrake Alley'),
		('Kalila','Fillgate','Dynabox','47 Talisman Point'),
		('Harlan','Woodthorpe','Quamba','46575 Mendota Street'),
		('Loise','Aysh','Quimba','039 Manufacturers Center'),
		('Jacynth','Grebert','Livepath','61562 Acker Junction'),
		('Ansell','Pester','Camido','560 Eagle Crest Road'),
		('Stanislaus','Syrad','Yodo','1 Haas Drive'),
		('Domenic','Walding','Oba','33384 Oriole Place'),
		('Letti','Shugg','Zoozzy','0591 Crowley Junction'),
		('Eli','Torrie','Eadel','594 Glendale Road'),
		('Fara','Crewdson','Oba','752 Clemons Avenue'),
		('Shirlene','Stains','Leexo','413 Miller Junction'),
		('Clive','Heyfield','Kwilith','635 Birchwood Trail'),
		('Hetti','Quest','Tazz','03769 East Crossing'),
		('Kellie','Darwen','Tazzy','77 Monica Place'),
		('Brok','Yesson','Kwideo','499 Clyde Gallagher Pass'),
		('Yettie','Foynes','Vipe','139 Hanover Place'),
		('Cele','Denmead','Rhybox','92005 Alpine Junction'),
		('Marcel','Maier','Realfire','0352 Merry Alley'),
		('Edlin','Colafate','Centimia','3204 Talmadge Crossing'),
		('Archy','Cuell','Twimbo','98029 1st Pass'),
		('Gayelord','Goldwater','Browseblab','473 Brown Road'),
		('Ericha','Ginnally','Eamia','644 Ridgeview Park'),
		('Addie','Dedon','Browsezoom','5 Bowman Road'),
		('Edie','Esselin','Oba','76 Cottonwood Alley'),
		('Lauraine','Pikett','Feednation','71 Ronald Regan Hill'),
		('Euell','Molder','Thoughtbeat','77132 Oxford Street'),
		('Ranice','Ripon','Avamm','6102 Oak Crossing'),
		('Dotti','Asbery','Feednation','26 Blackbird Avenue'),
		('Park','Perrottet','Ozu','100 Cascade Crossing'),
		('Gwendolin','January 1st','Oyondu','954 Myrtle Terrace'),
		('Obie','Slocom','Tavu','62 Rowland Plaza'),
		('Jacklin','Howgego','Blognation','57337 Pepper Wood Court'),
		('Antoine','Greenley','Vinder','736 Utah Junction'),
		('Nickie','Ickowics','Buzzdog','667 Union Trail'),
		('Rodd','Jean','Jatri','48117 Golf Parkway'),
		('Sam','Caisley','Kamba','80 Petterle Alley'),
		('Broddie','Barkworth','Thoughtbeat','26 Westerfield Point'),
		('Robbi','Caswall','Thoughtbeat','950 Debra Street'),
		('Aeriell','Klimkowski','Katz','3 American Circle'),
		('Jeanne','Scardafield','Lazzy','86 Judy Junction'),
		('Oswald','McEnhill','Tazzy','83 Tennyson Road'),
		('Jerrylee','Hovenden','Yodoo','3 Pankratz Terrace'),
		('Kakalina','Paskins','Thoughtstorm','0594 5th Street'),
		('Rozelle','Yellop','Thoughtblab','1 Orin Terrace'),
		('Felicio','Goburn','Thoughtbeat','39488 Grayhawk Plaza'),
		('Farica','Halmkin','Jabbertype','91765 New Castle Parkway'),
		('Berny','MacColgan','Gevee','5077 Derek Road'),
		('Isak','Westerman','Thoughtbeat','958 Lien Hill'),
		('Niall','Leaming','Fiveclub','0 Arkansas Parkway'),
		('Constancy','Renault','Brainbox','0 Mayer Hill'),
		('Berke','Burchatt','Eidel','2 Barby Drive'),
		('Clovis','Sickling','Geba','014 Carey Crossing'),
		('Deanna','Snary','Yozio','792 Thackeray Place'),
		('Ranna','Leith','Yozio','5728 Bartillon Parkway'),
		('Borden','Paternoster','Feedbug','29398 Loomis Alley'),
		('Brucie','Scamwell','Babbleopia','3650 Acker Circle'),
		('Hazel','Brinkley','Yakitri','494 Waywood Court'),
		('Mike','Bugbird','Kazu','700 Sloan Pass'),
		('Yuri','Yarham','Voomm','08 Golf View Road'),
		('Emmy','Treble','Roomm','473 Eastlawn Court'),
		('Brier','Glabach','Tagfeed','9 Fallview Circle'),
		('Brett','Benbow','Gabcube','83 Declaration Circle'),
		('Geneva','Sabbatier','Zazio','635 Randy Terrace'),
		('Ari','Pherps','Riffwire','2650 Oak Place'),
		('Gaby','Gemnett','Npath','4680 Commercial Park'),
		('Michal','Daice','Realcube','22 Kennedy Trail'),
		('Billie','Dunabie','Plajo','75970 Division Pass'),
		('Jarrod','Eckly','Pixoboo','87 Emmet Alley'),
		('Layla','Ithell','Skivee','12292 Mariners Cove Road'),
		('Sherlock','Sander','Flashset','32830 Schiller Terrace'),
		('Manolo','Remnant','Fliptune','4 Corben Trail'),
		('Dorotea','MacKellen','Agimba','62 Stang Avenue'),
		('Eugenius','Adrien','Twitterbeat','8 Tomscot Center'),
		('Hatty','Banham','Demimbu','5000 Melody Place'),
		('Elysee','Rembrandt','Jetpulse','21670 Marquette Lane'),
		('Madalyn','Simecek','Kimia','18908 Pine View Crossing'),
		('Tessie','Murkitt','Mycat','77 Browning Park'),
		('Madonna','Adne','Avamm','1907 Bellgrove Circle'),
		('Dionysus','Lias','Quinu','0043 Sycamore Avenue'),
		('Olivie','Ashbey','Skippad','63 Coolidge Crossing'),
		('Toby','Portman','Wikivu','46 Rigney Terrace'),
		('Edythe','Marvelley','Pixoboo','9463 Fordem Point'),
		('Edie','Pesticcio','LiveZ','77747 Fallview Court'),
		('Fitzgerald','Damato','Tagchat','59 Forest Circle'),
		('Melba','Stonhewer','Oyondu','1318 Anzinger Circle'),
		('Gordon','Guerola','Nlounge','06 Parkside Drive'),
		('Herminia','Jerrold','Innojam','27 Graceland Lane'),
		('Renaud','Stucksbury','Cogilith','57399 Dahle Plaza'),
		('Corabelle','Pipworth','Fliptune','79950 Browning Court'),
		('Nobe','Fiddy','Jaloo','09 Waxwing Hill'),
		('Marybelle','Kennifick','Linklinks','8219 Spaight Plaza'),
		('Mateo','Rennix','Ntags','4 Hovde Plaza'),
		('Adelaida','Bernlin','Thoughtbeat','50 Jenna Alley'),
		('Gale','Gove','Edgewire','67365 Oneill Lane'),
		('Oliy','Ashlin','Voolith','0 Moland Street'),
		('Ellissa','Vasyutkin','Gigazoom','355 Hanover Street'),
		('Daveen','Redmille','Twiyo','234 Mallory Drive'),
		('Basil','Hearfield','Gabtune','738 Grayhawk Place'),
		('Dinnie','Waterstone','Trudoo','5458 Lillian Park'),
		('Tammy','Hark','Snaptags','767 Thierer Street'),
		('Storm','Adderley','Topicshots','91307 Stoughton Place'),
		('Oby','Guyon','Browsezoom','808 Delaware Circle'),
		('Kesley','Weerdenburg','Abatz','67248 Granby Place'),
		('Fabio','Paradyce','Skibox','16 Cody Place'),
		('Jessee','Padfield','Meedoo','16902 Brown Circle'),
		('Gianina','Warder','Katz','9700 Fallview Road'),
		('Archibald','Abadam','Dabvine','68081 Hazelcrest Trail'),
		('Margarita','Brilon','Browsetype','9 Carpenter Avenue'),
		('Loydie','Bizzey','Reallinks','64 Welch Junction'),
		('Merv','Maillard','Twitterworks','8 Kingsford Junction'),
		('Nial','Agirre','Skinte','0500 Golf View Plaza'),
		('Roana','Stuchbury','Muxo','4 Goodland Point'),
		('Nessy','Eyers','Flipstorm','7300 Becker Crossing'),
		('Gerhard','Roote','Flashdog','66 Loeprich Junction'),
		('Earlie','Mines','Oloo','121 Fair Oaks Road'),
		('Lanae','Gherarducci','Zoomdog','68837 Aberg Center'),
		('Lilllie','Brignell','Realmix','19528 Pearson Drive'),
		('Lurette','Oldknowe','Flipbug','3 Corben Point'),
		('Henrieta','Bonsey','Oyondu','71 Fair Oaks Parkway'),
		('Thedrick','Berriball','Skivee','131 South Avenue'),
		('Saidee','Avrahamov','Oodoo','426 Mccormick Hill'),
		('Ignatius','Blenkinsopp','Meevee','942 Spohn Point'),
		('Micheil','Fautly','Linklinks','225 Sullivan Parkway'),
		('Isabelle','Cecchetelli','Izio','59 Raven Way'),
		('Bobbie','Lowdiane','Topiczoom','621 Banding Point'),
		('Lennard','Tweddle','Browsecat','858 Carpenter Street'),
		('Wilhelm','Sterry','Yambee','51 Springs Parkway'),
		('Beryl','Hulle','Lazz','29599 Warrior Road'),
		('Eloise','Hawkes','Zoombox','05237 Riverside Hill'),
		('Tessy','Terzo','Quatz','40 Carberry Plaza'),
		('Cammy','Phillpot','Realcube','984 Graceland Lane'),
		('Connor','Klawi','Divape','2 Sycamore Road'),
		('Linet','Hunnisett','Thoughtworks','4456 Westport Junction'),
		('Sunshine','Foldes','Jabbertype','8815 Express Court'),
		('Arley','Petow','Meeveo','7131 Carioca Plaza'),
		('Zena','McGeneay','Jatri','9671 Thackeray Way'),
		('Paulie','McGaw','Edgetag','6 Everett Junction'),
		('Cordell','Pople','Brightbean','57349 Old Shore Trail'),
		('Nata','Maypowder','Bubbletube','76278 Cordelia Court'),
		('Kaleena','Locks','Ooba','5371 Jackson Hill'),
		('Regan','Kainz','Zoombeat','97 Maple Avenue'),
		('Kimmi','Wellington','Dynabox','2923 Banding Trail'),
		('Ronica','Roderham','Edgeify','53 Schurz Pass'),
		('Deni','Ondrousek','Lazzy','21 Kingsford Lane'),
		('Tera','Youthead','Skibox','1941 Nobel Terrace'),
		('Dael','Clarson','Blogtag','04 Crownhardt Junction'),
		('Lenci','Ganders','Fadeo','9343 Forest Road'),
		('Leola','Berrygun','Mybuzz','6866 Esker Alley'),
		('Anetta','Bushel','Linktype','83 Butternut Road'),
		('Frazier','Maisey','Skynoodle','5 Vermont Parkway'),
		('Wenonah','Bowdidge','Eimbee','49354 Kipling Park'),
		('Patty','Cannop','Edgeblab','348 Stoughton Pass'),
		('Maurizia','Constance','Yakijo','6 Sommers Place'),
		('Vivyan','Purnell','Omba','84971 Arizona Court'),
		('Raffaello','Moralee','Twitterbridge','849 Mariners Cove Street'),
		('Morgana','McCanny','Skinder','19 Stone Corner Park'),
		('Frederigo','Tome','Skipfire','548 Prentice Lane'),
		('Rubia','Biaggi','Twitterbridge','28649 Mendota Pass'),
		('Nariko','Mixhel','Leenti','1 Haas Parkway'),
		('Maggi','Santen','Youopia','1733 Ryan Parkway'),
		('Corrinne','Lamplugh','Brightdog','97650 Oxford Point'),
		('Elke','Ordish','Ailane','83 Pennsylvania Center'),
		('Ruthy','Kniveton','Einti','25942 Nelson Center'),
		('Aloysia','Cardnell','Meevee','4828 Lake View Lane'),
		('Pattin','Cochern','Dazzlesphere','598 Raven Park'),
		('Ryann','Cazalet','Minyx','571 Anzinger Court'),
		('Roby','Veronique','Thoughtstorm','18 Quincy Circle'),
		('Orly','Mill','Thoughtsphere','8171 Caliangt Alley'),
		('Alick','Stoddard','Divape','64 Derek Plaza'),
		('Carlin','Whacket','Voonte','493 Dayton Way'),
		('Cherey','McWhinnie','Meeveo','27 Lyons Parkway'),
		('Billye','Grzelczyk','Meedoo','01522 Cherokee Trail'),
		('Theodor','Dalgarnocht','Devpulse','7206 Morrow Hill'),
		('Kathi','Pauluzzi','Topicblab','8992 Sheridan Drive'),
		('Lexine','Mathivon','Twitterbridge','6770 Ohio Parkway'),
		('Paquito','Carillo','Twinder','33 8th Court'),
		('Sheeree','Filippone','Centidel','0114 Graceland Center'),
		('Hale','Scarlan','Gevee','6 Jenifer Center'),
		('Erin','Hazeup','Centimia','732 Cascade Parkway'),
		('Merry','Bellin','Jaxnation','1082 Manufacturers Park'),
		('Astrid','Garnam','Voolith','5414 Coolidge Drive'),
		('Odessa','Byrom','Realbuzz','932 Shelley Park'),
		('Burt','Exall','Oyoyo','8243 Delaware Hill'),
		('Conny','Dumigan','Jabbercube','1021 Sycamore Plaza'),
		('Henderson','Mertel','Edgepulse','672 Mcguire Street'),
		('Brandy','Iacovaccio','Zoombox','55 Homewood Pass'),
		('Kimmi','Fuxman','Katz','65 Fordem Road'),
		('Zsa zsa','Shadfourth','BlogXS','4 Warner Plaza'),
		('Easter','McArthur','Wikizz','05243 Portage Parkway'),
		('Leonerd','Brockie','Thoughtworks','00 Roxbury Way'),
		('Audrye','Ennor','Vipe','7 Marcy Junction'),
		('Dominick','Bradick','Twinder','9 Hudson Road'),
		('Wes','Raulin','Izio','810 Cardinal Junction'),
		('Wilburt','Lagadu','Realbridge','419 Burning Wood Trail'),
		('Westley','Kaufman','Tekfly','45062 Park Meadow Center'),
		('Daisie','Sturgess','Tagtune','8 Oriole Court'),
		('Burke','Margram','Youfeed','3664 Summer Ridge Street'),
		('Cleveland','Bony','Topicstorm','05 Bunting Junction'),
		('Rebe','Giamelli','Ntags','2856 Thompson Avenue'),
		('Gael','Lowing','Kwideo','77 Menomonie Road'),
		('Tony','Perkin','Youtags','6575 Mayer Place'),
		('Nerty','Nyles','Wordware','192 Northridge Parkway'),
		('Thomas','Allsep','Skilith','68 Schmedeman Circle'),
		('Hamil','Delagnes','Bluejam','47672 Farmco Park'),
		('Aindrea','Abramovicz','Fiveclub','583 Kedzie Trail'),
		('Bridget','Tallach','Fiveclub','04298 International Drive'),
		('Ginger','Rivard','Demimbu','8596 Fremont Trail'),
		('Matty','Joicey','Brightbean','26 Rieder Way'),
		('Erin','Tumioto','Kazio','2853 Golf Terrace'),
		('Xavier','Kahane','Jabberstorm','37 Sachtjen Way'),
		('Bibi','Greig','Topicblab','63 Main Avenue'),
		('Cacilie','Cleverly','Zoombox','607 Daystar Drive'),
		('Livia','Bosket','Voolia','8 Dixon Way'),
		('Roxana','McGann','Flashpoint','8 American Avenue'),
		('Jake','Tabbernor','Meeveo','2246 Norway Maple Plaza'),
		('Holly','Grand','Dynabox','6 Forest Point'),
		('Andria','Lisamore','Demizz','765 Ronald Regan Park'),
		('Zak','Dudenie','Eidel','00823 Dwight Hill'),
		('Rudd','Asbrey','Browsecat','160 Pond Point'),
		('Uriel','Hoble','Gabspot','69434 Golden Leaf Point'),
		('Pavlov','Polhill','Twimm','270 Stoughton Way');
		
	-- same for city
	DROP TABLE IF EXISTS temp_city;
	
	CREATE TEMP TABLE temp_city (
		cityName varchar(50)
	);
	
	insert into temp_city(cityName)
	  values
		('Abbotsford'),
		('Armstrong'),
		('Burnaby'),
		('Campbell River'),
		('Castlegar'),
		('Chilliwack'),
		('Colwood'),
		('Coquitlam'),
		('Courtenay'),
		('Cranbrook'),
		('Dawson Creek'),
		('Delta'),
		('Duncan'),
		('Enderby'),
		('Fernie'),
		('Fort St. John'),
		('Grand Forks'),
		('Greenwood'),
		('Kamloops'),
		('Kelowna'),
		('Kimberley'),
		('Langford'),
		('Langley'),
		('Maple Ridge'),
		('Merritt'),
		('Mission'),
		('Nanaimo'),
		('Nelson'),
		('New Westminster'),
		('North Vancouver'),
		('Parksville'),
		('Penticton'),
		('Pitt Meadows'),
		('Port Alberni'),
		('Port Coquitlam'),
		('Port Moody'),
		('Powell River'),
		('Prince George'),
		('Prince Rupert'),
		('Quesnel'),
		('Revelstoke'),
		('Richmond'),
		('Rossland'),
		('Salmon Arm'),
		('Surrey'),
		('Terrace'),
		('Trail'),
		('Vancouver'),
		('Vernon'),
		('Victoria'),
		('West Kelowna'),
		('White Rock'),
		('Williams Lake');
	
	/*
		generate more or less years by modifying the upper bound of this loop
	*/
	FOR yearCounter in 2024..2034 LOOP
		
		/*
			generate more company data by modifying the upper bound of this loop (each company will be distinct)
		*/
		FOR companyCounter in 1..10 LOOP
		    /*
				create a company id, bceidBusinessGuid, contrive a company name
			*/
			companyId := gen_random_uuid();
			bceidBusinessGuid := gen_random_uuid();
			
			--create a company
			select compName into companyName from temp_names order by random() limit 1;
			select address into address1 from temp_names order by random() limit 1;
			select cityName into city from temp_city order by random() limit 1;
			
			INSERT INTO pay_transparency.pay_transparency_company (company_id, bceid_business_guid, company_name, create_date, update_date, address_line1, address_line2, city, province, country, postal_code) 
			VALUES 
				(companyID, bceidBusinessGuid, companyName, NOW(), NOW(), address1, '', city, 'BC', 'CA', 'X1X1X1');	
		
			
			--create a user for each company
			userID := gen_random_uuid();
			select firstName into fName from temp_names order by random() limit 1;
			select lastName into lName from temp_names order by random() limit 1;
			
			userDisplayName := fName || ' ' || lname;
			
			INSERT INTO pay_transparency.pay_transparency_user (user_id, bceid_user_guid, bceid_business_guid, display_name, create_date, update_date) 
			VALUES 
				(userID, gen_random_uuid(), bceidBusinessGuid, userDisplayName, NOW(), NOW());
			
			
			--create a report for this company/year
			/*
				need to make the start and end dates year specific
				I run into an index issue if I try to create >1 report for each company/year/user/status. Would
				need to work a loop that created more distinct users or pushed reports of different status (published or not).
			*/
			
			/*
				make the report date range. Use the same date range for each report/company
				
			*/
			SELECT floor(random() * (12-1+1) + 1)::int into reportStartMonth;
			
			if reportStartMonth = 1 then
				reportEndMonth = 12;
			else
				reportEndMonth := reportStartMonth -1;
			end if;
			
			if (reportEndMonth = 1) OR (reportEndMonth = 3) OR (reportEndMonth = 5) or (reportEndMonth = 7) or (reportEndMonth = 8) or (reportEndMonth = 10) or (reportEndMonth = 12) THEN
				reportEndDayText = '31';
			else
				if(reportEndMonth = 2) then
					reportEndDayText = '28';
				else
					reportEndDayText = '30';
				end if;
			
			end if;
			
			
			reportStartMonthText = LPAD(CAST (reportStartMonth as TEXT), 2, '0');
			reportEndMonthText = LPAD(CAST (reportEndMonth as TEXT), 2, '0');
			
			
			reportStartDate := CAST(yearCounter -1 as TEXT) || '-' || reportStartMonthText || '-01';
			reportEndDate := CAST(yearCounter as TEXT) || '-' || reportEndMonthText || '-' || reportEndDayText;
			
			
			
			
			SELECT floor(random() * (2-1+1) + 1)::int into reportLoopUpperBound;
			
			FOR reportCounter in 1..reportLoopUpperBound LOOP
			
				reportId := gen_random_uuid();
				select naics_code into naicsCode from pay_transparency.naics_code order by random() limit 1;
				select employee_count_range_id into empCountRangeId from pay_transparency.employee_count_range order by random() limit 1;
				
				--reportStartDate := CAST(yearCounter -1 as TEXT) || '-06-01';
				--reportEndDate := CAST(yearCounter as TEXT) || '-05-31';
				
				if reportCounter = 1 then
					reportStatus := 'Published';
				else
					reportStatus := 'Draft';
				end if;
			
				INSERT INTO pay_transparency.pay_transparency_report (report_id, company_id, user_id, user_comment, employee_count_range_id, naics_code, report_start_date, report_end_date, create_date, update_date, create_user, update_user, report_status, revision, data_constraints, is_unlocked, reporting_year, report_unlock_date, admin_user_id, admin_modified_date, admin_last_access_date) 
				VALUES 
					(reportId, companyId, userID, null, empCountRangeId, naicsCode, CAST(reportStartDate as DATE), CAST(reportEndDate as DATE), NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency', reportStatus, 57, null, true, yearCounter, null, null, null, null);
				
				--create the report rows
				INSERT INTO pay_transparency.pay_transparency_calculated_data (calculated_data_id, report_id, calculation_code_id, value, is_suppressed, create_date, update_date, create_user, update_user) 
				VALUES 
				   (gen_random_uuid(), reportId, percentReceivingOtPayx, '64.93506493506493', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, percentReceivingOtPayu, '60.49382716049383', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, percentReceivingBonusPaym, '10.81081081081081', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, percentReceivingBonusPayw, '8.16326530612245', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, percentReceivingBonusPayx, '8.658008658008658', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, percentReceivingBonusPayu, '6.172839506172839', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, referenceGenderCategoryCode, 'M', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanOtHoursDiffm, '0', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanOtHoursDiffW, '-2.743303571428571', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanOtHoursDiffX, '-2.631875000000001', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanOtHoursDiffU, '-2.8079294217687067', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianOtHoursDiffM, '0', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianOtHoursDiffW, '-3.5', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianOtHoursDiffX, '-3', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianOtHoursDiffU, '-2', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanBonusPayDiffM, '0', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanBonusPayDiffW, '47.09389813946734', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanBonusPayDiffX, '33.490679730449465', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanHourlyPayDiffM, '0', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanHourlyPayDiffW, '5.277351199490772', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanHourlyPayDiffX, '15.108407957571105', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanHourlyPayDiffU, '7.35701830526302', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianHourlyPayDiffM, '0', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianHourlyPayDiffW, '4.951122400430666', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),	
				   (gen_random_uuid(), reportId, medianHourlyPayDiffX, '15.98906983213758', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianHourlyPayDiffU, '7.718551994924967', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanOtPayDiffM, '0', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanOtPayDiffW, '22.935676183809946', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanOtPayDiffX, '29.797410682122017', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanOtPayDiffU, '23.620274017143707', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianOtPayDiffM, '0', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianOtPayDiffW, '29.674639917695462', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianOtPayDiffX, '25.861625514403286', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianOtPayDiffU, '18.454218106995874', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, meanBonusPayDiffU, '21.85162981840699', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianBonusPayDiffM, '0', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianBonusPayDiffW, '59.885976855003406', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianBonusPayDiffX, '48.5857726344452', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, medianBonusPayDiffU, '19.387338325391422', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile1M, '9.387755102040817', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile1W, '20.408163265306122', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile1X, '43.26530612244898', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile1U, '26.93877551020408', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile2M, '25.81967213114754', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile2W, '23.770491803278688', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile2X, '26.229508196721312', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile2U, '24.18032786885246', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile3M, '29.098360655737704', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile3W, '25.81967213114754', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile3X, '18.0327868852459', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile3U, '27.049180327868854', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile4M, '41.63265306122449', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile4W, '30.20408163265306', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile4X, '6.938775510204081', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, hourlyPayPercentQuartile4U, '21.224489795918366', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, percentReceivingOtPayM, '74.13127413127413', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency'),
				   (gen_random_uuid(), reportId, percentReceivingOtPayW, '57.14285714285714', false, NOW(), NOW(), 'fin-pay-transparency', 'fin-pay-transparency');	
			
			END LOOP; -- end report counter loop
		
		END LOOP; -- end company loop
	
	
	END LOOP;  --end year loop
 
	DROP TABLE IF EXISTS temp_names;
	
end
$$