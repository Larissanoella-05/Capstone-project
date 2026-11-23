// Kinyarwanda for every English text shown in the apps. Keep {placeholders} exactly as in the English.
// Edit only the right-hand side: the left-hand side is the key the screens look up.
// A text with no entry here is shown in English, so a missing line is never a blank screen.
// Draft wording: have a native speaker review it before it is shown to customers.
export const RW = {
  // Language switch and shared words
  Language: 'Ururimi',
  Back: 'Subira inyuma',
  'Back to home': 'Subira ahabanza',
  'Landing page': 'Urupapuro rwa mbere',
  'Umuriro, go to the landing page': 'Umuriro, jya ku rupapuro rwa mbere',
  Loading: 'Biraje',
  'Loading fault': 'Turimo gushaka ikibazo',
  'This did not load': 'Ntibyabonetse',
  'Could not load this. Check your connection and try again.':
    'Ntibyashobotse kuboneka. Reba interineti yawe hanyuma ongera ugerageze.',
  'Try again': 'Ongera ugerageze',
  'There is a problem': 'Hari ikibazo',
  'No connection': 'Nta interineti',
  'No connection. Showing the last update.': 'Nta interineti. Turerekana amakuru aheruka.',
  Pilot: 'Ikizamini',
  PILOT: 'IKIZAMINI',
  'Test reports only. Real fault: call 2727':
    "Raporo z'ikizamini gusa. Ikibazo nyacyo: hamagara 2727",
  'Test reports only. Real fault: call 2727.':
    "Raporo z'ikizamini gusa. Ikibazo nyacyo: hamagara 2727.",
  'Hide the pilot notice': "Hisha ubutumwa bw'ikizamini",
  'Privacy policy': "Politiki y'ibanga",

  // Times
  'just now': 'ubu nyine',
  '{minutes} min ago': 'hashize iminota {minutes}',
  '{hours} hour ago': 'hashize isaha {hours}',
  '{hours} hours ago': 'hashize amasaha {hours}',
  '{days} day ago': 'hashize umunsi {days}',
  '{days} days ago': 'hashize iminsi {days}',
  Today: 'Uyu munsi',
  'Checked {time}': 'Byarebwe saa {time}',

  // Roles and sign-in
  Customer: 'Umukiriya',
  Technician: 'Umutekinisiye',
  Coordinator: 'Umuhuzabikorwa',
  'Report a fault and follow the response.': 'Tanga ikibazo ukurikirane igisubizo.',
  'See assigned jobs, navigate and update the status.':
    'Reba imirimo wahawe, ujye aho iri kandi uvugurure uko bimeze.',
  'Sign in': 'Injira',
  Login: 'Kwinjira',
  'Signing in as': 'Winjiye nka',
  'Signing in as {name}': 'Winjiye nka {name}',
  'Email or phone': 'Imeri cyangwa telefoni',
  'Email or 078 123 4567': 'Imeri cyangwa 078 123 4567',
  Password: 'Ijambobanga',
  'Enter your password': 'Andika ijambobanga ryawe',
  'Enter your password.': 'Andika ijambobanga ryawe.',
  'Prototype: every demo account uses the password':
    "Igerageza: konti zose z'igerageza zikoresha ijambobanga",
  'Show password': 'Erekana ijambobanga',
  Show: 'Erekana',
  Hide: 'Hisha',
  'Signing in…': 'Turimo kukwinjiza…',
  'Waking the server, this can take up to a minute…':
    'Turimo gukangura seriveri, bishobora gufata iminota igera kuri umwe…',
  'New customer?': 'Uri umukiriya mushya?',
  'Create an account': 'Fungura konti',
  'Technicians and coordinators: ask your administrator for access.':
    "Abatekinisiye n'abahuzabikorwa: saba umuyobozi wawe uburenganzira.",
  'Back to Umuriro': 'Subira kuri Umuriro',
  'Use your email address or your phone number.':
    'Koresha imeri yawe cyangwa numero ya telefoni yawe.',
  'Assign technicians and keep every fault moving.':
    'Gabanya abatekinisiye kandi ukomeze gukurikirana buri kibazo.',
  'Silhouette of a lineworker in a hard hat and harness climbing a timber frame, with a crane behind':
    "Igicucu cy'umukozi w'amashanyarazi wambaye ingofero n'umukandara azamuka ku nkingi y'ibiti, hari kandi igikoresho cyo guterura inyuma",
  'Enter your email or phone number.': 'Andika imeri yawe cyangwa numero ya telefoni.',
  'Enter a valid email address.': 'Andika imeri nyayo.',
  'Enter a Rwandan mobile number such as 078 123 4567.':
    "Andika numero ya telefoni y'u Rwanda nka 078 123 4567.",

  // Statuses, headlines and the timeline
  Reported: 'Byatanzwe',
  Assigned: 'Yahawe umutekinisiye',
  'On the Way': 'Ari mu nzira',
  Arrived: 'Yageze',
  Working: 'Arimo gukora',
  Resolved: 'Byakemutse',
  Cancelled: 'Byahagaritswe',
  'Waiting for a technician': 'Dutegereje umutekinisiye',
  'Technician assigned': 'Umutekinisiye yabonetse',
  'Technician on the way': 'Umutekinisiye ari mu nzira',
  'Technician has arrived': 'Umutekinisiye yageze',
  'Technician is working': 'Umutekinisiye arimo gukora',
  'Fault resolved': 'Ikibazo cyakemutse',
  'Report cancelled': 'Raporo yahagaritswe',
  'Fault reported': 'Ikibazo cyatanzwe',
  'Technician arrived': 'Umutekinisiye yageze',
  'Work in progress': 'Akazi kari gukorwa',
  'Current stage': 'Intambwe iriho',
  'A coordinator will assign a technician to your report.':
    'Umuhuzabikorwa azaguha umutekinisiye kuri raporo yawe.',
  'The technician will set off soon. You get an alert when they do.':
    'Umutekinisiye agiye guhaguruka vuba. Uzabimenyeshwa ahagurutse.',
  'The technician is travelling to your location. Follow them on the map.':
    'Umutekinisiye ari mu nzira aza aho uri. Mukurikire ku ikarita.',
  'The technician is at your location and will start work.':
    'Umutekinisiye ageze aho uri kandi agiye gutangira akazi.',
  'The technician is working on the fault. You get an alert when it is fixed.':
    'Umutekinisiye arimo gukemura ikibazo. Uzabimenyeshwa cyakemutse.',
  'Nothing more to do. If the power is still off, report it again.':
    'Nta kindi ukeneye gukora. Niba umuriro utaragaruka, ongera utange raporo.',
  'This report was cancelled. If you still have a problem, report it again.':
    "Iyi raporo yahagaritswe. Niba ukiri n'ikibazo, ongera utange raporo.",

  // Fault types, priorities and outcomes
  'Power outage': 'Umuriro wazimye',
  'No electricity at the premises': 'Nta mashanyarazi ahari aho utuye',
  'Low voltage': 'Umuriro uri hasi',
  'Dim lights, appliances not running properly': 'Amatara acanye make, ibikoresho ntibikora neza',
  'Damaged connection': 'Insinga yangiritse',
  'Fallen, sparking or exposed service wire':
    'Insinga yaguye, irakubita ibishashi cyangwa iri hanze',
  'Meter issue': 'Ikibazo cya mubazi',
  'Meter blank, not loading or showing an error':
    'Mubazi ntacyo yerekana, ntiyakira cyangwa yerekana ikosa',
  Other: 'Ikindi',
  'Anything not listed above': 'Ikindi kitavuzwe haruguru',
  Low: 'Gito',
  Medium: 'Hagati',
  High: 'Hejuru',
  Critical: 'Byihutirwa cyane',
  'Supply restored': 'Umuriro wagarutse',
  'Temporary repair made': "Hakozwe gusana by'agateganyo",
  'No fault found': 'Nta kibazo cyabonetse',
  'Referred for further work': 'Byoherejwe ku bandi gukomeza',

  // Report a fault (guest)
  'Report a fault': 'Tanga ikibazo',
  'No account needed. It takes about a minute.': "Nta konti ikenewe. Bifata nk'umunota umwe.",
  'If you can see a fallen, sparking or exposed wire, stay away from it and call':
    'Niba ubona insinga yaguye, irakubita ibishashi cyangwa iri hanze, uyirinde kandi uhamagare',
  'now. This report is for the pilot and is not an emergency line.':
    "ubu. Iyi raporo ni iy'ikizamini kandi si numero y'ubutabazi.",
  'What is the problem?': 'Ikibazo ni iki?',
  'Where is the fault?': 'Ikibazo kiri hehe?',
  'Use my location': 'Koresha aho ndi',
  'Update my location': 'Vugurura aho ndi',
  'Finding your location…': 'Turimo gushaka aho uri…',
  'Location found': 'Aho uri habonetse',
  'If the fault is somewhere else, describe where below.':
    'Niba ikibazo kiri ahandi, sobanura aho kiri hasi.',
  'Map showing the location your phone found': 'Ikarita yerekana aho telefoni yawe yabonye',
  'Where the fault is': 'Aho ikibazo kiri',
  'Describe the place': 'Sobanura aho ari',
  '(optional)': '(si ngombwa)',
  Optional: 'Si ngombwa',
  'Village, cell, a landmark, or the house number.':
    "Umudugudu, akagari, ikimenyetso cyaho cyangwa nimero y'inzu.",
  'For example: near the blue gate, Kibenga cell':
    "Urugero: hafi y'irembo ry'ubururu, akagari ka Kibenga",
  'Your phone number': 'Numero yawe ya telefoni',
  'We use it to text you updates about this fault only, and so the technician can call you.':
    'Tuyikoresha kukwandikira amakuru kuri iki kibazo gusa, kandi kugira ngo umutekinisiye abashe kuguhamagara.',
  'What happened?': 'Byagenze bite?',
  'Describe the problem': 'Sobanura ikibazo',
  'Meter number': 'Numero ya mubazi',
  'Printed on your meter and on your token receipt. It helps us match your report; it is not checked.':
    "Iri kuri mubazi yawe no ku rupapuro rw'umuriro waguze (token). Idufasha guhuza raporo yawe; ntirigenzurwa.",
  Photo: 'Ifoto',
  'Take a photo': 'Fata ifoto',
  'Take photo': 'Fata ifoto',
  'Choose a photo': 'Hitamo ifoto',
  'Choose photo': 'Hitamo ifoto',
  'Remove photo': 'Kuraho ifoto',
  'Selected fault': "Ifoto y'ikibazo wahisemo",
  'Selected fault photo': "Ifoto y'ikibazo wahisemo",
  'Preparing photo…': 'Turimo gutegura ifoto…',
  'Leave this empty': 'Reka iki gisa',
  'Send report': 'Ohereza raporo',
  'Sending…': 'Turimo kohereza…',
  'Your report was not sent. What you typed is still here.':
    'Raporo yawe ntiyoherejwe. Ibyo wanditse biracyahari.',
  'Reports from this phone': 'Raporo zo kuri iyi telefoni',
  Track: 'Kurikirana',
  'Track report {reference}': 'Kurikirana raporo {reference}',

  // Form messages built by the shared helpers
  'Choose the type of fault.': "Hitamo ubwoko bw'ikibazo.",
  'Shorten the place to 300 characters or fewer.':
    "Gabanya ibisobanuro by'aho biri bigere ku nyuguti 300 cyangwa munsi yazo.",
  'Tell us where the fault is: use your location or describe the place.':
    'Tubwire aho ikibazo kiri: koresha aho uri cyangwa usobanure aho ari.',
  'A meter number has 11 or 13 digits. Leave it empty if you do not know it.':
    'Numero ya mubazi igira imibare 11 cyangwa 13. Yireke ubusa niba utayizi.',
  'Shorten the description to 1000 characters or fewer.':
    'Gabanya ibisobanuro bigere ku nyuguti 1000 cyangwa munsi yazo.',
  'Location is blocked for this site. Allow it in your browser settings, or describe the place below.':
    'Aho uri hahagaritswe kuri uru rubuga. Hemerera mu igenamiterere rya mushakisha yawe, cyangwa usobanure aho ari hasi.',
  'Your phone could not find its position. Try again outside, or describe the place below.':
    'Telefoni yawe ntiyabonye aho uri. Ongera ugerageze uri hanze, cyangwa usobanure aho ari hasi.',
  'Finding your location took too long. Try again, or describe the place below.':
    'Gushaka aho uri byatwaye igihe kirekire. Ongera ugerageze, cyangwa usobanure aho ari hasi.',
  'Your location could not be used. Describe the place below.':
    'Aho uri ntihashoboye gukoreshwa. Sobanura aho ari hasi.',
  'Location is off for this app. Allow it in Settings, then try again.':
    'Aho uri hafunzwe kuri iyi porogaramu. Hemerera mu Igenamiterere, hanyuma ongera ugerageze.',
  'Your phone could not find its position. Check that GPS is on and try again.':
    'Telefoni yawe ntiyabonye aho uri. Reba ko GPS ifunguye hanyuma ongera ugerageze.',
  'Accurate to about {metres} m': 'Ihuye na metero {metres} hafi',
  'Roughly {metres} m, check the place below': 'Hafi metero {metres}, reba aho ari hasi',
  'Very rough, about {km} km. Describe the place below':
    'Ntibisobanutse neza, hafi km {km}. Sobanura aho ari hasi',

  // After sending
  'Fault report sent': 'Raporo yoherejwe',
  'Reference #{reference}': 'Nimero ya raporo #{reference}',
  'Reference loading…': 'Turimo gushaka nimero ya raporo…',
  'Your tracking link': 'Umurongo wawe wo gukurikirana',
  'Track this fault': 'Kurikirana iki kibazo',
  'Copy link': 'Koporora umurongo',
  'Link copied': 'Umurongo wakoporowe',
  'Save this link or take a screenshot. Anyone with the link can see this report, so share it only with people you trust. If you lose it, call':
    "Bika uyu murongo cyangwa ufate ifoto y'ekrani. Umuntu wese ufite uyu murongo ashobora kubona iyi raporo, bityo uwuhe gusa abantu wizeye. Nuwubura, hamagara",
  'We are texting this link and updates to the phone number you gave.':
    "Turimo kukwoherereza uyu murongo n'amakuru kuri numero ya telefoni watanze.",
  'Text message (simulated)': "Ubutumwa bugufi (bw'ikigereranyo)",
  'No text message gateway is connected in this pilot, so nothing was sent. This is what the text would say.':
    'Muri iki kizamini nta sisitemu yohereza ubutumwa bugufi ihari, bityo nta butumwa bwoherejwe. Ibi ni byo ubutumwa bwari kuvuga.',
  'A service coordinator will now assign a technician. Keep your phone nearby: the technician may call to confirm where you are.':
    'Umuhuzabikorwa agiye guha umutekinisiye iki kibazo. Tegereza telefoni yawe hafi: umutekinisiye ashobora kuguhamagara kugira ngo yemeze aho uri.',
  'Follow this fault in the app: it stays under Reports from this phone. A service coordinator will now assign a technician. Keep your phone nearby: the technician may call to confirm where you are.':
    'Kurikirana iki kibazo muri porogaramu: kizaguma muri Raporo zo kuri iyi telefoni. Umuhuzabikorwa agiye guha umutekinisiye iki kibazo. Tegereza telefoni yawe hafi: umutekinisiye ashobora kuguhamagara kugira ngo yemeze aho uri.',
  'Report another fault': 'Tanga ikindi kibazo',

  // Tracking
  'This tracking link is not valid': 'Uyu murongo wo gukurikirana si wo',
  'The link may be mistyped, or the report was closed more than 7 days ago. If a fault is still not fixed, report it again or call 2727.':
    'Umurongo ushobora kuba waranditswe nabi, cyangwa raporo yarafunzwe hashize iminsi irenga 7. Niba ikibazo kitarakemuka, ongera utange raporo cyangwa uhamagare 2727.',
  'The report may have been closed more than 7 days ago. If a fault is still not fixed, report it again or call 2727.':
    'Raporo ishobora kuba yarafunzwe hashize iminsi irenga 7. Niba ikibazo kitarakemuka, ongera utange raporo cyangwa uhamagare 2727.',
  'Fault #{reference}': 'Ikibazo #{reference}',
  'Last updated {when}': 'Byavuguruwe {when}',
  'Last updated': 'Byavuguruwe',
  Status: 'Uko bimeze',
  Distance: 'Intera',
  'Not assigned yet': 'Ntaragenerwa',
  'On site': 'Ari aho',
  'Call {name}': 'Hamagara {name}',
  'This phone cannot make calls.': 'Iyi telefoni ntishobora guhamagara.',
  'Map showing your service location, the technician and the link between them':
    "Ikarita yerekana aho utuye, umutekinisiye n'umurongo ubahuza",
  'Your location': 'Aho uri',
  'Response timeline': 'Uko igisubizo cyagenze',
  Resolution: 'Igisubizo',
  'Completed {when}': 'Byarangiye {when}',
  'Your report': 'Raporo yawe',
  'Service location': 'Aho serivisi itangirwa',
  'Meter {number}': 'Mubazi {number}',
  Description: 'Ibisobanuro',
  'No description given.': 'Nta bisobanuro byatanzwe.',
  'Photo attached to the report': 'Ifoto yometse kuri raporo',

  // Landing page, navigation and customer screens
  About: 'Abo turi bo',
  'About Us': 'Abo turi bo',
  'About Umuriro': 'Ibyerekeye Umuriro',
  'How it works': 'Uko bikora',
  Dashboards: 'Imbonerahamwe',
  FAQ: 'Ibibazo',
  Contact: 'Twandikire',
  Home: 'Ahabanza',
  Main: 'Ibyingenzi',
  'Customer · Report a fault': 'Umukiriya · Tanga ikibazo',
  'Coordinator · Assign & monitor': 'Umuhuzabikorwa · Gabanya no gukurikirana',
  'Technician · My jobs': 'Umutekinisiye · Imirimo yanjye',
  'Power out? Report it, and watch it get fixed.':
    'Umuriro wazimye? Tanga ikibazo, urebe uko gikemuka.',
  'Report a fault. Get a technician. Track it until the lights are back.':
    'Tanga ikibazo. Wohererezwe umutekinisiye. Kurikirana kugeza umuriro ugarutse.',
  'Real fault? Call 2727': 'Ikibazo nyacyo? Hamagara 2727',
  'Real fault? Call {hotline}': 'Ikibazo nyacyo? Hamagara {hotline}',
  'Call {hotline}': 'Hamagara {hotline}',
  'Call 2727': 'Hamagara 2727',
  'Open coordinator view': "Fungura urupapuro rw'umuhuzabikorwa",
  'Open customer view': "Fungura urupapuro rw'umukiriya",
  'Open technician view': "Fungura urupapuro rw'umutekinisiye",
  restores: 'wongera',
  power: 'kuboneka',
  'Open my app': 'Fungura porogaramu yanjye',
  'Report the fault in under a minute': 'Tanga ikibazo mu munota utarenze umwe',
  'Coordinator assigns the nearest technician': 'Umuhuzabikorwa agenera umutekinisiye uri hafi',
  'Track every step with live status': 'Kurikirana buri ntambwe uko iri kugenda',
  'Closed with a record of the repair': "Birafungwa hasigaye inyandiko y'isanwa",
  'One app, three views': 'Porogaramu imwe, impande eshatu',
  'Built around the people who restore power': 'Yubakiwe abagarura umuriro',
  'Service coordinator': 'Umuhuzabikorwa wa serivisi',
  'Report and track a fault': 'Tanga ukurikirane ikibazo',
  'Assign technicians and monitor': 'Gabanya abatekinisiye kandi ukurikirane',
  'See jobs and update status': 'Reba imirimo kandi uvugurure uko bimeze',
  'On the web dashboard': 'Ku rubuga gusa',
  'Umuriro FAQ': 'Ibibazo bya Umuriro',
  'Frequently asked questions': 'Ibibazo bikunze kubazwa',
  'How do I report a fault?': 'Natanga nte ikibazo?',
  'Open the report page, pick the type of fault, confirm your location and send. No account is needed. You get a reference and a link you can use to follow progress.':
    "Fungura urupapuro rwo gutanga ikibazo, uhitemo ubwoko bw'ikibazo, wemeze aho uri hanyuma wohereze. Nta konti ikenewe. Uhabwa nimero ya raporo n'umurongo ukurikiraho uko bigenda.",
  'Open the report page, pick the type of fault, share your location or describe the place, add your phone number and send. You get a reference and a link to follow progress.':
    "Fungura urupapuro rwo gutanga ikibazo, uhitemo ubwoko bw'ikibazo, usangize aho uri cyangwa usobanure aho ari, wongeremo numero yawe ya telefoni hanyuma wohereze. Uhabwa nimero ya raporo n'umurongo wo gukurikirana.",
  'Who gets my report?': 'Ni nde ubona raporo yanjye?',
  'Service coordinators see new reports and assign the most suitable technician.':
    'Abahuzabikorwa babona raporo nshya bakagenera umutekinisiye ubikwiriye cyane.',
  'Can I see where my technician is?': 'Nshobora kubona aho umutekinisiye wanjye ari?',
  'Yes. Your report has a status timeline (reported, assigned, on the way, arrived, working, resolved) and a map of the fault site and the assigned technician. In this pilot the technician position on the web map is simulated.':
    "Yego. Raporo yawe igaragaza uko igenda (yatanzwe, yahawe umutekinisiye, ari mu nzira, yageze, arimo gukora, byakemutse) n'ikarita yerekana aho ikibazo kiri n'umutekinisiye wagenewe. Muri iki kizamini aho umutekinisiye ari ku ikarita yo ku rubuga ni ikigereranyo.",
  'What if the fault is dangerous?': 'Ikibazo nigiteza akaga se?',
  'For fallen lines, sparks or fire, keep away and call 2727 first, then report it here so it is prioritised.':
    'Ku nsinga zaguye, ibishashi cyangwa inkongi, ubyirinde uhamagare 2727 mbere, hanyuma ubitangire hano kugira ngo bihabwe ibyihutirwa.',
  'How do technicians get jobs?': 'Abatekinisiye babona bate imirimo?',
  'Assigned jobs appear in the technician’s list with the location and fault details. They update the status as they work.':
    "Imirimo bahawe igaragara ku rutonde rw'umutekinisiye hamwe n'aho biri n'ibisobanuro by'ikibazo. Bavugurura uko bimeze uko bakora.",
  'Does it work on my phone?': 'Ikora kuri telefoni yanjye?',
  'Yes. Customers and technicians can use the web app or the Android app; coordinators use the web dashboard.':
    "Yego. Abakiriya n'abatekinisiye bashobora gukoresha urubuga cyangwa porogaramu ya Android; abahuzabikorwa bakoresha urubuga rw'imbonerahamwe.",
  'Do I need an account?': 'Nkeneye konti?',
  'No. You can report a fault and follow it without one. Sign in only if you have an account and want your reports kept in one list.':
    'Oya. Ushobora gutanga ikibazo ukagikurikirana nta konti. Injira gusa niba ufite konti kandi ushaka ko raporo zawe ziba ku rutonde rumwe.',
  'No. You can report a fault and follow it with the link you are given. Sign in only if you have an account and want your reports kept in one list.':
    'Oya. Ushobora gutanga ikibazo ukagikurikirana ukoresheje umurongo uhawe. Injira gusa niba ufite konti kandi ushaka ko raporo zawe ziba ku rutonde rumwe.',
  'How do I know it is fixed?': 'Menya nte ko cyakemutse?',
  'The technician marks the job resolved and you get a notification in the app. The report stays in your list of reports.':
    'Umutekinisiye yemeza ko akazi karangiye ukabimenyeshwa muri porogaramu. Raporo ikomeza kuba ku rutonde rwa raporo zawe.',
  'Your tracking page changes to resolved and shows what the technician did. Customers with an account also get a notification in the app.':
    'Urupapuro rwo gukurikirana ruhinduka "byakemutse" kandi rukerekana ibyakozwe n\'umutekinisiye. Abakiriya bafite konti bamenyeshwa no muri porogaramu.',
  'Secure reliable power for': 'Wizere umuriro uhamye',
  'your home and business!': 'mu rugo rwawe no mu bucuruzi bwawe!',
  'No more guessing when the lights will return. Report a fault and follow the repair until power is back.':
    'Ntukomeze kwibaza igihe umuriro uzagarukira. Tanga ikibazo ukurikirane isanwa kugeza umuriro ugarutse.',
  'No more guessing when the lights will return. Sign in to report a fault and follow the repair until power is back.':
    'Ntukomeze kwibaza igihe umuriro uzagarukira. Injira utange ikibazo ukurikirane isanwa kugeza umuriro ugarutse.',
  'Sign in to report': 'Injira utange ikibazo',
  'Smart fault reporting': 'Gutanga ibibazo mu buryo bwa kijyambere',
  'for a reliable grid': "ku muyoboro w'amashanyarazi wizewe",
  'Umuriro connects the three people who restore power: the customer who reports an outage, the coordinator who assigns the right technician, and the technician who fixes it. Every step is visible to everyone who needs to see it.':
    "Umuriro ihuza abantu batatu bagarura umuriro: umukiriya utanga ikibazo, umuhuzabikorwa ugenera umutekinisiye ukwiye, n'umutekinisiye ugikemura. Buri ntambwe igaragara kuri buri wese ukeneye kuyibona.",
  'Location-based': 'Hashingiwe ku hantu',
  'Faults are pinned to a place so coordinators see what is closest to a technician.':
    "Ibibazo bishyirwa ku ikarita kugira ngo abahuzabikorwa babone ibiri hafi y'umutekinisiye.",
  'One shared status': 'Uko bimeze kumwe kuri bose',
  'Reported, assigned, on the way, arrived, working, resolved: the same for all roles.':
    'Byatanzwe, byahawe umutekinisiye, ari mu nzira, yageze, arimo gukora, byakemutse: ni kimwe ku bantu bose.',
  'Give us a call': 'Duhamagare',
  'Built for Rwanda': 'Yubakiwe u Rwanda',
  'Technician testing a distribution board': 'Umutekinisiye apima ikibaho gikwirakwiza umuriro',
  'Power poles and lines over a street': "Inkingi n'insinga z'amashanyarazi hejuru y'umuhanda",
  'Lineman looking up at a pole': "Umukozi w'insinga arebye hejuru ku nkingi",
  'Our services': 'Serivisi zacu',
  'Fault services tailored for you': "Serivisi z'ibibazo zagenewe wowe",
  'No power outage': 'Nta muriro',
  'A whole street or a single home without electricity.':
    'Umuhanda wose cyangwa urugo rumwe rutagira amashanyarazi.',
  'Flickering and low voltage': "Umuriro uzimagiza n'uri hasi",
  'Unstable supply that can damage your appliances.':
    'Umuriro utaboneka neza ushobora kwangiza ibikoresho byawe.',
  'Fallen or damaged lines': 'Insinga zaguye cyangwa zangiritse',
  'Wires down, leaning poles and damaged insulators.':
    "Insinga zaguye, inkingi zihengamye n'ibibuza umuriro kwangirika byangiritse.",
  'Meter and breaker problems': "Ibibazo bya mubazi n'ibikata umuriro",
  'Tripping breakers, faulty meters and board issues.':
    "Ibikata umuriro bikomeza guhita, mubazi zidakora n'ibibazo by'ikibaho.",
  'Updates and guides': "Amakuru n'inama",
  'Staying safe and informed': 'Kurinda umutekano no kumenya amakuru',
  'What to do during a power outage': 'Icyo gukora umuriro wazimye',
  'Switch off and unplug sensitive appliances, keep the fridge closed, use a torch instead of candles, then report the fault.':
    'Zimya kandi ukure mu muriro ibikoresho byoroshye, ukomeze firigo ifunze, ukoreshe itoroshi aho gukoresha buji, hanyuma utange ikibazo.',
  'Keep away from fallen lines': 'Irinde insinga zaguye',
  'Treat every fallen or sagging wire as live. Stay well back, keep others away and call 2727 before anything else.':
    "Fata buri nsinga yaguye cyangwa imanitse nk'iriho umuriro. Hagarara kure, wirinde ko abandi bahegera kandi uhamagare 2727 mbere ya byose.",
  'What to tell the technician': 'Icyo wabwira umutekinisiye',
  'Give the exact place, what you saw or heard, and whether neighbours are also without power. It helps the repair go faster.':
    "Vuga aho ari neza, icyo wabonye cyangwa wumvise, n'niba abaturanyi na bo batagira umuriro. Bifasha isanwa kwihuta.",
  'We believe in a world powered by safe, reliable electricity. Umuriro is dedicated to getting faults reported, assigned and fixed faster.':
    'Twizera isi ikoresha amashanyarazi atekanye kandi yizewe. Umuriro yiyemeje gutuma ibibazo bitangwa, bigenerwa abatekinisiye kandi bigakemurwa vuba.',
  'Electricity provider (REG)': 'Utanga amashanyarazi (REG)',
  'Toll free: 2727': 'Ni ubuntu: 2727',
  '© 2026 Umuriro. All Rights Reserved.': '© 2026 Umuriro. Uburenganzira bwose burabitswe.',
  'Privacy Policy | Terms of Service': "Politiki y'ibanga | Amabwiriza yo gukoresha",
  'Quick Links': 'Ihuza ryihuse',
  Services: 'Serivisi',
  'Fault coordination': 'Guhuza ibibazo',
  'Technician jobs': "Imirimo y'abatekinisiye",
  'Safety guidance': "Inama z'umutekano",
  'This phone cannot open that link.': 'Iyi telefoni ntishobora gufungura uyu murongo.',
  Alerts: 'Imenyesha',
  Notifications: 'Imenyesha',
  'Notifications, {count} unread': 'Imenyesha, {count} ritarasomwa',
  '{count} unread': '{count} bitarasomwa',
  Report: 'Tanga',
  Reports: 'Raporo',
  Jobs: 'Imirimo',
  'Signed in as': 'Winjiye nka',
  'Sign out': 'Sohoka',
  Priority: 'Icyihutirwa',
  Available: 'Ahari',
  'On a job': 'Ari ku kazi',
  'Off duty': 'Ntari mu kazi',
  Unassigned: 'Ntarahabwa umutekinisiye',
  'Good morning': 'Mwaramutse',
  'Good afternoon': 'Mwiriwe',
  'Good evening': 'Mwiriwe',
  All: 'Byose',
  Open: 'Bifunguye',
  'Loading your faults': 'Turimo gushaka ibibazo byawe',
  'Loading your reports': 'Turimo gushaka raporo zawe',
  'Loading your report': 'Turimo gushaka raporo yawe',
  'Loading notifications': 'Turimo gushaka imenyesha',
  '{count} report': 'Raporo {count}',
  '{count} reports': 'Raporo {count}',
  History: 'Amateka',
  'My reports': 'Raporo zanjye',
  'Report ID': 'Nimero ya raporo',
  Category: 'Ubwoko',
  Location: 'Aho biri',
  Type: 'Ubwoko',
  'Contact phone': 'Telefoni yo kuvugana',
  Details: 'Amakuru arambuye',
  Review: 'Gusuzuma',
  'Your fault is being handled': 'Ikibazo cyawe kiri gukurikiranwa',
  'Is your electricity not working?': 'Amashanyarazi yawe ntakora?',
  'No open fault': 'Nta kibazo gifunguye',
  'Nothing in progress. If your power is out or something is wrong at the meter, report it and we will send a technician.':
    'Nta kibazo kiri gukorwaho. Niba umuriro wawe wazimye cyangwa hari ikibazo kuri mubazi, gitange tukohereze umutekinisiye.',
  'Real emergency?': 'Ni ubutabazi nyabwo?',
  'Recent reports': 'Raporo za vuba',
  'View all': 'Reba zose',
  'No reports yet.': 'Nta raporo ziraboneka.',
  'No reports yet': 'Nta raporo ziraboneka',
  'Current status · Fault #{reference}': 'Uko bimeze ubu · Ikibazo #{reference}',
  'Track live': 'Kurikirana uko bimeze',
  'Filter reports': 'Yungurura raporo',
  'Nothing in this list': 'Nta kintu kuri uru rutonde',
  'Choose another filter to see your other reports.':
    'Hitamo irindi yungurura urebe izindi raporo zawe.',
  'When you report a fault it is listed here.': 'Iyo utanze ikibazo kigaragara hano.',
  'Fault report submitted': "Raporo y'ikibazo yoherejwe",
  'A service coordinator will now assign a technician. The technician is sent to your registered service location, so you do not need to call to give directions.':
    'Umuhuzabikorwa agiye kugenera umutekinisiye iki kibazo. Umutekinisiye yoherezwa aho wiyandikishije, bityo ntukeneye guhamagara ngo utange ibyerekezo.',
  'What happens next': 'Ibikurikiraho',
  'All notifications marked as read.': 'Imenyesha ryose ryasomwe.',
  'Mark all as read': 'Byose byasomwe',
  'No notifications yet': 'Nta menyesha riraboneka',
  'Updates about your faults will appear here.': 'Amakuru ku bibazo byawe azagaragara hano.',
  'Updates about your faults appear here.': 'Amakuru ku bibazo byawe agaragara hano.',
  'Load more ({count} older)': 'Erekana ibindi ({count} bishaje)',
  'Add a photo': 'Ongeraho ifoto',
  Auto: 'Byikora',
  'Back to the previous step': 'Subira ku ntambwe ibanza',
  Continue: 'Komeza',
  'Loading your service location…': 'Turimo gushaka aho utuye…',
  'Registered location · Meter {number}': 'Aho wiyandikishije · Mubazi {number}',
  'Your registered service location is added to this report automatically.':
    'Aho wiyandikishije haongerwa kuri iyi raporo byikora.',
  'No registered service location was found for your account.':
    'Nta hantu hiyandikishije habonetse kuri konti yawe.',
  'Step {step} of {total}': 'Intambwe ya {step} muri {total}',
  'Stage {step} of {total}': 'Icyiciro cya {step} muri {total}',
  'Create your account': 'Fungura konti yawe',
  'One account to report faults and follow them. It takes about two minutes.':
    "Konti imwe yo gutanga ibibazo no kubikurikirana. Bifata iminota nk'ibiri.",
  'Full name': 'Amazina yombi',
  'Phone number': 'Numero ya telefoni',
  'You can sign in with it, and it is where we text updates.':
    'Wayikoresha winjira, kandi ni ho tukoherereza amakuru.',
  Email: 'Imeri',
  'At least 8 characters.': 'Nibura inyuguti 8.',
  'Your meter': 'Mubazi yawe',
  "Printed on your meter and on your token receipt. Shared meter? Enter your landlord's meter number.":
    "Iri kuri mubazi yawe no ku rupapuro rw'umuriro waguze. Musangira mubazi? Andika numero ya mubazi ya nyirinzu.",
  Cell: 'Akagari',
  Village: 'Umudugudu',
  Landmark: 'Ikimenyetso cyaho',
  'For example: near the blue gate': "Urugero: hafi y'irembo ry'ubururu",
  'Create account': 'Fungura konti',
  'Creating your account…': 'Turimo gufungura konti yawe…',
  'Already registered?': 'Usanzwe ufite konti?',
  'Your home': 'Iwawe',
  'Enter your full name.': 'Andika amazina yawe yombi.',
  'Use at least 8 characters for your password.': 'Koresha nibura inyuguti 8 mu ijambobanga ryawe.',
  'A meter number has 11 or 13 digits.': 'Numero ya mubazi igira imibare 11 cyangwa 13.',
  'Enter your cell.': 'Andika akagari kawe.',
  'Press "Use my location" so we can find your home on the map.':
    'Kanda "Koresha aho ndi" kugira ngo tubone iwawe ku ikarita.',
  'Enter a phone number such as +250 788 300 114.':
    'Andika numero ya telefoni nka +250 788 300 114.',
  'Your registered service location has not loaded yet.': 'Aho wiyandikishije ntiharaboneka.',
  'Current fault {reference}': 'Ikibazo gikiri gukurikiranwa {reference}',
  'Real emergency? Call 2727': 'Ni ubutabazi nyabwo? Hamagara 2727',
  'For example: electricity went off suddenly, the neighbours still have power.':
    'Urugero: umuriro wazimye ako kanya, abaturanyi bo baracyafite umuriro.',
  '078 123 4567': '078 123 4567',
  'Hide password': 'Hisha ijambobanga',
  'Fault category': "Ubwoko bw'ikibazo",
  optional: 'si ngombwa',
  Unread: 'Ritarasomwa',
  'Umuriro, go to your home screen': 'Umuriro, jya ku rupapuro rwawe rwa mbere',

  // Technician screens
  "Today's assignments": "Imirimo y'uyu munsi",
  Pending: 'Itegereje',
  'Completed today': 'Yarangiye uyu munsi',
  'Next job': 'Akazi gakurikira',
  'Assigned {when}': 'Yahawe {when}',
  'Open job': 'Fungura akazi',
  'No active job': 'Nta kazi gakorwa',
  'New jobs assigned by the service coordinator appear here automatically.':
    "Imirimo mishya itangwa n'umuhuzabikorwa igaragara hano yikoresha.",
  Waiting: 'Itegereje',
  '{count} jobs in total': 'Imirimo {count} yose hamwe',
  'My jobs': 'Imirimo yanjye',
  'Filter jobs': 'Yungurura imirimo',
  Done: 'Yarangiye',
  'No completed jobs yet': 'Nta mirimo irarangira',
  'No jobs here': 'Nta mirimo hano',
  'Jobs you resolve are kept here.': 'Imirimo urangije ibikwa hano.',
  'Reported {when}': 'Byatanzwe {when}',
  'Closed {when}': 'Byafunzwe {when}',
  'Loading your jobs': 'Turimo gushaka imirimo yawe',
  'Loading job': 'Turimo gushaka akazi',
  'Job closed': 'Akazi karafunzwe',
  'Fault marked as resolved. The customer has been notified.':
    'Ikibazo cyemejwe ko cyakemutse. Umukiriya yamenyeshejwe.',
  'Fault ID': "Nimero y'ikibazo",
  Outcome: 'Ibyavuyemo',
  Completed: 'Byarangiye',
  Arrival: 'Igihe yageze',
  now: 'ubu',
  'Back to my jobs': 'Subira ku mirimo yanjye',
  'Job details': "Ibisobanuro by'akazi",
  'Close job': 'Funga akazi',
  'Describe how the fault was resolved.': 'Sobanura uko ikibazo cyakemutse.',
  'List the work that was completed.': 'Andika imirimo yakozwe.',
  'Resolution description': "Ibisobanuro by'igisubizo",
  'What was wrong and how it was fixed.': "Icyari kibi n'uko cyakosowe.",
  'An outcome note is required before a fault can be resolved.':
    "Ibisobanuro by'ibyavuyemo birakenewe mbere yo kwemeza ko ikibazo cyakemutse.",
  'Work completed': 'Imirimo yakozwe',
  'For example: replaced service fuse, tightened terminals, tested supply at the meter.':
    "Urugero: nasimbuye fuse y'umuriro, nkomeza ibyuma bifata insinga, nipimye umuriro kuri mubazi.",
  'Clarification contacts': "Inshuro wavuganye n'umukiriya",
  'One fewer': 'Kimwe munsi',
  'One more': 'Kimwe kirenga',
  '{count} contacts': 'Inshuro {count}',
  'How many times you had to call or message the customer to find the location.':
    'Inshuro wabanje guhamagara cyangwa kwandikira umukiriya ngo ubone aho ari.',
  'The customer will be notified and the fault closed. Status times cannot be edited afterwards.':
    "Umukiriya azamenyeshwa kandi ikibazo gifungwe. Amasaha y'uko bimeze ntashobora guhindurwa nyuma.",
  'Mark as resolved': 'Emeza ko cyakemutse',
  'Saving…': 'Turimo kubika…',
  'Updating…': 'Turimo kuvugurura…',
  'Record resolution': 'Andika igisubizo',
  'Start: on my way': 'Tangira: ndi mu nzira',
  'I have arrived': 'Nageze',
  'Start work': 'Tangira akazi',
  'Status updated: On the Way.': 'Uko bimeze byavuguruwe: Ari mu nzira.',
  'Status updated: Arrived.': 'Uko bimeze byavuguruwe: Yageze.',
  'Status updated: Working.': 'Uko bimeze byavuguruwe: Arimo gukora.',
  Navigate: 'Erekeza',
  'Call customer': 'Hamagara umukiriya',
  Call: 'Hamagara',
  'No app can open directions.': 'Nta porogaramu ishobora gufungura inzira.',
  'Guest reporter': 'Utanze ikibazo nta konti',
  '{village} village': 'Umudugudu wa {village}',
  '{distance} away': '{distance} uvuye hano',
  'Response status': 'Uko igisubizo gihagaze',
  Now: 'Ubu',
  'My location': 'Aho ndi',
  Prototype: 'Igerageza',
  recorded: 'cyanditswe',
  'Last position: {label} at {time}. The customer and the coordinator see it on their maps.':
    "Aho wari uri: {label} saa {time}. Umukiriya n'umuhuzabikorwa barabibona ku makarita yabo.",
  'No position recorded yet.': 'Nta hantu haranditswe.',
  'Move closer': 'Sumbira hafi',
  'Moving…': 'Turimo kwegera…',
  'Use device location': 'Koresha aho telefoni iri',
  'Locating…': 'Turimo gushaka aho uri…',
  'Location updated.': 'Aho uri hamaze kuvugururwa.',
  'Location updated from this device.': 'Aho uri hamaze kuvugururwa hakoreshejwe iyi telefoni.',
  'On the way to {cell}': 'Ari mu nzira ajya mu kagari ka {cell}',
  'Device location': 'Aho telefoni iri',
  'This device does not share its location.': 'Iki gikoresho ntigisangiza aho kiri.',
  'Location permission was refused. Use “Move closer” to simulate movement instead.':
    'Uburenganzira bwo gukoresha aho uri bwanzwe. Koresha “Sumbira hafi” kugira ngo wigane urugendo.',
  'Map showing the service location for fault {reference} and your position':
    "Ikarita yerekana aho ikibazo {reference} kiri n'aho uri",
  'Resolution recorded': 'Igisubizo cyanditswe',
  'The customer did not add a description.': 'Umukiriya ntiyongeyeho ibisobanuro.',
  'Photo attached by the customer': "Ifoto yometswe n'umukiriya",
  'Starting location sharing…': 'Turimo gutangira gusangiza aho uri…',
  'Sharing your location with the customer while this app is open.':
    'Turasangiza umukiriya aho uri mu gihe iyi porogaramu ifunguye.',
  'Location is off, so the customer cannot see you. Allow location for Umuriro in Settings.':
    'Aho uri hafunzwe, bityo umukiriya ntakubona. Emerera Umuriro gukoresha aho uri mu Igenamiterere.',
  'Could not read your location. Check that GPS is on.':
    'Ntibyashobotse kubona aho uri. Reba ko GPS ifunguye.',
  'Location sharing is paused. Keep this app open to share your position.':
    'Gusangiza aho uri byahagaze. Reka iyi porogaramu ifunguye kugira ngo usangize aho uri.',

  // Alerts page intros
  'Updates about your fault reports as they move through each stage.':
    'Amakuru ku raporo zawe uko zigenda zinyura mu byiciro byose.',
  'New jobs assigned to you by the service coordinator.': "Imirimo mishya wahawe n'umuhuzabikorwa.",
  'Updates about your fault reports.': 'Amakuru ku raporo zawe.',
  'New jobs and updates about the faults assigned to you.':
    "Imirimo mishya n'amakuru ku bibazo wahawe.",
};
