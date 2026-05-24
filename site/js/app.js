(function () {
    const cfg = window.CAD_CONFIG;
    if (!cfg) return;

    const I18N = {
        pl: {
            payLabel: "DO ZAP\u0141ATY:",
            cookieText: "U\u017cywamy localStorage oraz (po podaniu ID) Google Analytics. Klikaj\u0105c \u201eAkceptuj\u0119\u201d, zgadzasz si\u0119 na niezb\u0119dne dane techniczne.",
            cookieAccept: "Akceptuj\u0119",
            cookieDecline: "Tylko niezb\u0119dne",
            greetingMorning: "Dzie\u0144 dobry! Poranna kawa i detailing?",
            greetingAfternoon: "Siemanko! Czas na popo\u0142udniowe od\u015bwie\u017cenie auta?",
            greetingEvening: "Dobry wiecz\u00f3r!",
            greetingNight: "Witaj nocny marku",
            promoFirstVisit: "<strong>Witamy pierwszy raz!</strong> Odbierz -10% kodem <strong>START10</strong> na pierwsz\u0105 us\u0142ug\u0119.",
            promoReturn: "<strong>Wracasz do nas? Super!</strong> Pole\u0107 us\u0142ug\u0119 znajomemu i odbierz bonus przy kolejnej wizycie.",
            servicePreparing: "Us\u0142uga w przygotowaniu",
            servicePreview: "Podgl\u0105d us\u0142ugi",
            selectedServiceFallback: "Wybrana us\u0142uga",
            serviceDescriptionFallback: "Kr\u00f3tki opis us\u0142ugi pojawi si\u0119 tutaj.",
            effectLabel: "Efekt",
            fitLabel: "Dla kogo",
            noteLabel: "Uwaga",
            weatherForecastUnavailable: "Prognoza chwilowo niedost\u0119pna",
            weatherFallbackStatus: "Nie uda\u0142o si\u0119 pobra\u0107 prognozy. Termin us\u0142ug zewn\u0119trznych najlepiej potwierdzi\u0107 w wiadomo\u015bci.",
            forecast: "Prognoza",
            temporarilyUnavailable: "Chwilowo niedost\u0119pna",
            weatherFallbackNote: "Ustalimy warunki przed us\u0142ug\u0105",
            rainLabel: "Deszcz",
            windLabel: "wiatr",
            weatherAdviceBadExterior: "Masz zaznaczon\u0105 us\u0142ug\u0119 zewn\u0119trzn\u0105. Przy takiej pogodzie najlepiej potwierdzi\u0107 godzin\u0119 albo przesun\u0105\u0107 mycie na lepsze warunki.",
            weatherAdviceCautionExterior: "Pogoda jest zmienna. Us\u0142ugi zewn\u0119trzne da si\u0119 cz\u0119sto wykona\u0107, ale godzin\u0119 warto dogada\u0107 bli\u017cej terminu.",
            weatherAdviceInterior: "Dobry wyb\u00f3r na s\u0142absz\u0105 pogod\u0119: us\u0142ugi wn\u0119trza s\u0105 mniej zale\u017cne od deszczu i wiatru.",
            weatherAdviceDefault: "Je\u015bli pogoda b\u0119dzie s\u0142aba, rozwa\u017c najpierw czyszczenie wn\u0119trza, sk\u00f3ry albo tapicerki.",
            weatherBadLabel: "Lepiej dogada\u0107 godzin\u0119",
            weatherCautionLabel: "Mo\u017ce by\u0107 lepszy dzie\u0144 na wn\u0119trze",
            weatherGoodLabel: "Dobre warunki na zewn\u0119trze",
            weatherGoodSummary: "{location}: najbli\u017csze dni wygl\u0105daj\u0105 dobrze pod mycie zewn\u0119trzne.",
            weatherBadSummary: "{location}: dzi\u015b warunki mog\u0105 utrudnia\u0107 mycie zewn\u0119trzne, warto dogada\u0107 termin.",
            weatherCautionSummary: "{location}: pogoda jest zmienna, wi\u0119c us\u0142ugi zewn\u0119trzne mog\u0105 wymaga\u0107 ustalenia godziny.",
            today: "Dzi\u015b",
            tomorrow: "Jutro",
            upsellCombo: "Tip: w pakiecie <strong>COMBO</strong> mo\u017cesz zaoszcz\u0119dzi\u0107 ok. <strong>{diff} \u20ac</strong>.",
            upsellShowroom: "Tip: rozwa\u017c <strong>Pakiet Showroom</strong> (oszcz\u0119dno\u015b\u0107 ok. <strong>{diff} \u20ac</strong> i pe\u0142niejszy efekt).",
            selectedCar: "Wybrane auto: {model}",
            noCarSelected: "Model auta nie zosta\u0142 jeszcze wybrany.",
            themeLightTarget: "jasny motyw",
            themeDarkTarget: "ciemny motyw",
            pdfChooseServices: "Najpierw wybierz us\u0142ugi, aby wygenerowa\u0107 ofert\u0119!",
            pdfTitle: "Oferta Car All Detailing",
            pdfSubtitle: "Wst\u0119pna wycena us\u0142ug",
            pdfDocumentTitle: "Oferta dla klienta",
            pdfDate: "Data",
            pdfVehicleSize: "Wielko\u015b\u0107 pojazdu",
            pdfCarModel: "Model auta",
            pdfCarModelMissing: "do uzupe\u0142nienia",
            pdfStatus: "Status",
            pdfStatusValue: "wycena orientacyjna",
            pdfService: "Wybrana us\u0142uga",
            pdfEstimatedPrice: "Cena szacunkowa",
            pdfTotal: "Suma ca\u0142kowita (brutto):",
            pdfNote: "Ostateczna cena i zakres mog\u0105 zosta\u0107 potwierdzone dopiero po ogl\u0119dzinach auta. Na cen\u0119 wp\u0142ywaj\u0105 m.in. mocne zabrudzenia, sier\u015b\u0107, plamy, zapachy, stan lakieru, gabaryt pojazdu oraz dodatkowe ustalenia. Efekt ko\u0144cowy zale\u017cy od faktycznego stanu powierzchni i nie ka\u017cda plama, rysa lub zapach mo\u017ce zosta\u0107 usuni\u0119ty w 100%.",
            pdfFooter1: "Przedstawiona wycena ma charakter informacyjny i nie stanowi oferty handlowej w rozumieniu przepis\u00f3w prawa.",
            pdfFooter2: "Ostateczny koszt us\u0142ugi jest ustalany po inspekcji stanu pojazdu na miejscu.",
            quoteServiceFallback: "Us\u0142uga"
        },
        nl: {
            payLabel: "TE BETALEN:",
            cookieText: "We gebruiken localStorage en (met ID) Google Analytics. Met \u201eAccepteren\u201d ga je akkoord met noodzakelijke technische gegevens.",
            cookieAccept: "Accepteren",
            cookieDecline: "Alleen noodzakelijk",
            greetingMorning: "Goedemorgen! Koffie en detailing?",
            greetingAfternoon: "Hoi! Tijd voor een frisse auto?",
            greetingEvening: "Goedenavond!",
            greetingNight: "Welkom, nachtbraker",
            promoFirstVisit: "<strong>Eerste bezoek?</strong> Ontvang -10% met code <strong>START10</strong> op je eerste service.",
            promoReturn: "<strong>Welkom terug!</strong> Tip iemand en ontvang een bonus bij je volgende afspraak.",
            servicePreparing: "Service in voorbereiding",
            servicePreview: "Service preview",
            selectedServiceFallback: "Gekozen service",
            serviceDescriptionFallback: "Korte beschrijving van de service verschijnt hier.",
            effectLabel: "Effect",
            fitLabel: "Voor wie",
            noteLabel: "Let op",
            weatherForecastUnavailable: "Weersverwachting tijdelijk niet beschikbaar",
            weatherFallbackStatus: "Weersverwachting kon niet worden opgehaald. Bevestig buitendiensten bij voorkeur via bericht.",
            forecast: "Verwachting",
            temporarilyUnavailable: "Tijdelijk niet beschikbaar",
            weatherFallbackNote: "We stemmen de omstandigheden af v\u00f3\u00f3r de service",
            rainLabel: "Regen",
            windLabel: "wind",
            weatherAdviceBadExterior: "Je hebt een buitendienst geselecteerd. Bij dit weer is het beter om de tijd te bevestigen of het wassen naar betere omstandigheden te verplaatsen.",
            weatherAdviceCautionExterior: "Het weer is wisselvallig. Buitendiensten kunnen vaak nog, maar de tijd stemmen we beter dichter bij de afspraak af.",
            weatherAdviceInterior: "Goede keuze bij minder weer: interieurdiensten zijn minder afhankelijk van regen en wind.",
            weatherAdviceDefault: "Als het weer slecht is, overweeg dan eerst interieur-, leder- of bekledingsreiniging.",
            weatherBadLabel: "Tijd beter afstemmen",
            weatherCautionLabel: "Misschien beter voor interieur",
            weatherGoodLabel: "Goede omstandigheden voor buitenzijde",
            weatherGoodSummary: "{location}: de komende dagen zien er goed uit voor buiten wassen.",
            weatherBadSummary: "{location}: vandaag kunnen de omstandigheden buiten wassen lastiger maken, stem de afspraak even af.",
            weatherCautionSummary: "{location}: het weer is wisselvallig, buitendiensten kunnen een tijdafspraak nodig hebben.",
            today: "Vandaag",
            tomorrow: "Morgen",
            upsellCombo: "Tip: met het <strong>COMBO</strong> pakket kun je ongeveer <strong>{diff} \u20ac</strong> besparen.",
            upsellShowroom: "Tip: overweeg het <strong>Showroom pakket</strong> (ongeveer <strong>{diff} \u20ac</strong> voordeel en een completer resultaat).",
            selectedCar: "Gekozen auto: {model}",
            noCarSelected: "Er is nog geen automodel gekozen.",
            themeLightTarget: "licht thema",
            themeDarkTarget: "donker thema",
            pdfChooseServices: "Kies eerst diensten om een offerte te genereren!",
            pdfTitle: "Offerte Car All Detailing",
            pdfSubtitle: "Voorlopige prijsindicatie",
            pdfDocumentTitle: "Offerte voor de klant",
            pdfDate: "Datum",
            pdfVehicleSize: "Voertuiggrootte",
            pdfCarModel: "Automodel",
            pdfCarModelMissing: "nog in te vullen",
            pdfStatus: "Status",
            pdfStatusValue: "indicatieve prijs",
            pdfService: "Gekozen service",
            pdfEstimatedPrice: "Geschatte prijs",
            pdfTotal: "Totaal (bruto):",
            pdfNote: "De definitieve prijs en omvang kunnen pas na inspectie van de auto worden bevestigd. Sterke vervuiling, dierenharen, vlekken, geuren, lakconditie, voertuigformaat en extra afspraken kunnen invloed hebben op de prijs. Het eindresultaat hangt af van de werkelijke staat van de oppervlakken en niet elke vlek, kras of geur kan voor 100% worden verwijderd.",
            pdfFooter1: "Deze prijsindicatie is informatief en vormt geen bindend commercieel aanbod.",
            pdfFooter2: "De definitieve kosten worden na inspectie van de auto ter plaatse vastgesteld.",
            quoteServiceFallback: "Service"
        },
        en: {
            payLabel: "TOTAL:",
            cookieText: "We use localStorage and (with ID) Google Analytics. By accepting, you agree to necessary technical data.",
            cookieAccept: "Accept",
            cookieDecline: "Essential only",
            quoteServiceFallback: "Service"
        }
    };

    const STATIC_TEXT_EN = {
        "Klasa pojazdu": "Vehicle class",
        "Wybierz rozmiar auta, a potem doprecyzuj model z listy.": "Choose car size, then pick a model from the list.",
        "Pakiety Główne": "Main packages",
        "Mycie auta z zewnątrz": "Exterior wash",
        "Czyszczenie wnętrza auta": "Interior cleaning",
        "PAKIET COMBO": "COMBO PACKAGE",
        "Pakiet Showroom": "Showroom package",
        "Wkrótce": "Coming soon",
        "Kalkulator": "Calculator",
        "Wstępna wycena": "Price estimate",
        "DO ZAPŁATY:": "TOTAL:",
        "Kwota orientacyjna przed oględzinami auta.": "Indicative amount before vehicle inspection.",
        "Dodaj do kontaktów": "Add to contacts",
        "Pobierz Ofertę (PDF)": "Download quote (PDF)",
        "Zarezerwuj Termin Online": "Book online",
        "EKSKLUZYWNA PIELĘGNACJA SAMOCHODOWA": "EXCLUSIVE CAR CARE",
        "Siemanko!": "Hi!",
        "Małe (np. Fiat 500)": "Small (e.g. Fiat 500)",
        "Średnie (np. Golf, Audi A3)": "Medium (e.g. Golf, Audi A3)",
        "Duże (np. Audi A6, BMW 5)": "Large (e.g. Audi A6, BMW 5)",
        "SUV (np. BMW X5, Q7)": "SUV (e.g. BMW X5, Q7)",
        "VAN / BUS (np. Sprinter)": "VAN / BUS (e.g. Sprinter)",
        "Model auta nie został jeszcze wybrany.": "No car model selected yet.",
        "Pielęgnacja Skóry": "Leather care",
        "Dodatki Premium": "Premium extras",
        "Sprawdź pogodę przed terminem": "Check weather before your appointment",
        "Dziś": "Today",
        "Jutro": "Tomorrow",
        "Pojutrze": "Day after tomorrow",
        "Ładowanie": "Loading"
    };

    const STATIC_TEXT_NL = {
        "Car All Detailing - Ekskluzywna pielęgnacja samochodowa Karola Zagórskiego. Kalkulator usług detailingowych online.": "Car All Detailing - Exclusieve autoverzorging door Karol Zagórski. Online calculator voor detailingdiensten.",
        "Ekskluzywna pielęgnacja samochodowa. Kalkulator cen detailingowych online – Maarssen (NL) i wkrótce Polska.": "Exclusieve autoverzorging. Online prijsindicatie voor detailing in Maarssen (NL).",
        "Kalkulator usług detailingowych – sprawdź wycenę i umów termin.": "Detailing calculator - bekijk je prijsindicatie en maak een afspraak.",
        "Ekskluzywna pielęgnacja samochodowa – kalkulator cen online.": "Exclusieve autoverzorging - online prijsindicatie.",
        "Oferta specjalna:": "Speciale actie:",
        "−10% na pierwszą wizytę z kodem": "-10% op je eerste afspraak met code",
        "— podaj go przy rezerwacji (WhatsApp / Calendly).": "- vermeld deze bij je reservering (WhatsApp / Calendly).",
        "Zamknij pasek promocji": "Promobalk sluiten",
        "Siemanko!": "Hoi!",
        "Tu Karol! Dbam o auta w Holandii (Maarssen), a już niedługo także w Polsce. Twój samochód służy Ci codziennie - zasługuje na chwilę profesjonalnego odświeżenia. Sprawdź cennik i do zobaczenia! :D": "Ik ben Karol. Ik verzorg auto's in Maarssen en help je graag om je auto weer fris, schoon en verzorgd te maken. Bekijk de prijzen en tot snel!",
        "EKSKLUZYWNA PIELĘGNACJA SAMOCHODOWA": "EXCLUSIEVE AUTOVERZORGING",
        "Klasa pojazdu": "Voertuigklasse",
        "Wybierz rozmiar auta, a potem doprecyzuj model z listy.": "Kies de grootte van je auto en selecteer daarna eventueel een model uit de lijst.",
        "Małe (np. Fiat 500)": "Klein (bijv. Fiat 500)",
        "Średnie (np. Golf, Audi A3)": "Middelgroot (bijv. Golf, Audi A3)",
        "Duże (np. Audi A6, BMW 5)": "Groot (bijv. Audi A6, BMW 5)",
        "SUV (np. BMW X5, Q7)": "SUV (bijv. BMW X5, Q7)",
        "VAN / BUS (np. Sprinter)": "VAN / BUS (bijv. Sprinter)",
        "Przykładowe auta w tej klasie": "Voorbeelden in deze klasse",
        "Wybierz model albo wpisz swój": "Kies een model of vul je eigen model in",
        "Przykładowe modele aut": "Voorbeeldmodellen",
        "Inny model:": "Ander model:",
        "np. Audi A4 Avant": "bijv. Audi A4 Avant",
        "Model auta nie został jeszcze wybrany.": "Er is nog geen automodel gekozen.",
        "Pakiety Główne": "Hoofdpakketten",
        "Mycie auta z zewnątrz": "Auto buitenzijde wassen",
        "Czyszczenie wnętrza auta": "Interieur reinigen",
        "PAKIET COMBO": "COMBO PAKKET",
        "Pranie tapicerki materiałowej": "Textielbekleding reinigen",
        "Wkrótce": "Binnenkort",
        "Pakiet Showroom": "Showroom pakket",
        "Premium": "Premium",
        "Pielęgnacja Skóry": "Lederverzorging",
        "Czyszczenie i pielęgnacja skóry": "Leder reinigen en verzorgen",
        "Czyszczenie kierownicy": "Stuur reinigen",
        "Tapicerka Materiałowa": "Stoffen bekleding",
        "Odświeżenie foteli materiałowych": "Stoffen stoelen opfrissen",
        "Odświeżenie materiałów we wnętrzu": "Stoffen delen in het interieur opfrissen",
        "Dodatki Premium": "Premium extra's",
        "Dogłębne oczyszczenie lakieru": "Diepe lakreiniging",
        "Wosk premium na lakier": "Premium wax voor de lak",
        "Szybki wosk po myciu": "Snelle wax na het wassen",
        "Usuwanie zapachów z wnętrza": "Geuren uit het interieur verwijderen",
        "Czyszczenie pod maską": "Motorruimte reinigen",
        "Usuwanie sierści z wnętrza": "Dierenharen uit het interieur verwijderen",
        "od €50": "vanaf €50",
        "od €75": "vanaf €75",
        "od €115": "vanaf €115",
        "od €125": "vanaf €125",
        "od €220": "vanaf €220",
        "od €70": "vanaf €70",
        "od €55": "vanaf €55",
        "od €35": "vanaf €35",
        "Dokładne mycie auta z zewnątrz: karoseria, felgi i opony. Dobre, gdy auto jest po prostu brudne i chcesz je odświeżyć.": "Grondige wasbeurt van de buitenzijde: carrosserie, velgen en banden. Goed wanneer de auto gewoon vuil is en opgefrist moet worden.",
        "Porządne sprzątanie środka auta: odkurzanie, bagażnik, plastiki i szyby. Dobre, gdy wnętrze wymaga świeżości, ale bez głębokiego prania.": "Nette interieurreiniging: stofzuigen, kofferbak, kunststof en ramen. Goed als het interieur fris moet worden zonder diepe bekledingsreiniging.",
        "Najprostszy wybór, jeśli chcesz odświeżyć całe auto: mycie z zewnątrz plus czyszczenie wnętrza w jednej usłudze.": "De eenvoudigste keuze als je de hele auto wilt opfrissen: buiten wassen en interieur reinigen in één service.",
        "Głębsze pranie materiałowych foteli i wykładzin. Pomaga przy plamach, zapachu i mocno zabrudzonej tapicerce.": "Diepere reiniging van stoffen stoelen en vloermatten. Helpt bij vlekken, geur en sterk vervuilde bekleding.",
        "Najbardziej kompletny pakiet dla auta, które ma wyglądać możliwie najlepiej: dokładne wnętrze, zewnętrze i zabezpieczenie lakieru woskiem.": "Het meest complete pakket voor een auto die er zo goed mogelijk uit moet zien: interieur, buitenzijde en lakbescherming met wax.",
        "Czyszczenie skórzanych elementów i nałożenie preparatu, który pomaga utrzymać skórę miękką oraz mniej podatną na pękanie.": "Lederen delen reinigen en verzorgen met een product dat het leder zachter houdt en uitdroging helpt beperken.",
        "Dokładne czyszczenie kierownicy z tłuszczu, potu i zabrudzeń po dłoniach. Dobry dodatek, bo to najczęściej dotykane miejsce w aucie.": "Grondige reiniging van het stuur van vet, zweet en vuil van handen. Een goede extra omdat dit een veel aangeraakt onderdeel is.",
        "Lekkie odświeżenie materiałowych foteli i boczków drzwi. Dobre przy normalnym użytkowaniu, gdy nie potrzeba pełnego prania.": "Lichte opfrissing van stoffen stoelen en deurpanelen. Goed bij normaal gebruik wanneer volledige reiniging niet nodig is.",
        "Szersze odświeżenie materiałów we wnętrzu: fotele, boczki drzwi i delikatne czyszczenie podsufitki.": "Breder opfrissen van stoffen delen: stoelen, deurpanelen en voorzichtige reiniging van de hemelbekleding.",
        "Usunięcie drobinek brudu, metalu i osadów, których zwykłe mycie nie zabiera. Po tym lakier jest gładszy w dotyku.": "Verwijderen van vuildeeltjes, metaalresten en aanslag die een normale wasbeurt niet wegneemt. Daarna voelt de lak gladder aan.",
        "Lepsza ochrona lakieru i mocniejszy połysk. Wosk sprawia, że woda szybciej spływa, a auto dłużej wygląda świeżo.": "Betere lakbescherming en meer glans. Wax laat water sneller aflopen en houdt de auto langer fris.",
        "Szybkie nabłyszczenie i lekka ochrona lakieru. Dobre jako dodatek po myciu, gdy chcesz lepszy wygląd bez pełnego woskowania.": "Snelle glans en lichte lakbescherming. Goede extra na het wassen als je meer uitstraling wilt zonder volledige waxbeurt.",
        "Odświeżenie zapachu we wnętrzu, np. po papierosach, zwierzętach albo wilgoci. Usługa będzie dostępna później.": "Interieurgeuren opfrissen, bijvoorbeeld na rook, huisdieren of vocht. Deze service komt later beschikbaar.",
        "Ostrożne czyszczenie widocznych elementów pod maską oraz odświeżenie plastików. Dobre przed sprzedażą auta lub po długim czasie bez czyszczenia.": "Voorzichtige reiniging van zichtbare delen onder de motorkap en opfrissen van kunststof. Goed vóór verkoop of na lange tijd zonder reiniging.",
        "Dodatkowy czas na wyciąganie sierści z foteli, dywaników i wykładzin. Warto dodać, jeśli w aucie często jeździ pies lub kot.": "Extra tijd om dierenharen uit stoelen, matten en vloerbekleding te verwijderen. Handig als er vaak een hond of kat meerijdt.",
        "Świeższy wygląd z zewnątrz": "Frissere buitenzijde",
        "Auto po codziennym użytkowaniu": "Auto na dagelijks gebruik",
        "Najlepsze przy dobrej pogodzie lub dostępie do osłoniętego miejsca": "Het beste bij goed weer of een beschutte plek",
        "Czystsze i przyjemniejsze wnętrze": "Schoner en prettiger interieur",
        "Kierowcy, rodziny, auta do codziennej jazdy": "Bestuurders, gezinnen en dagelijkse auto's",
        "Nie obejmuje głębokiego prania materiałów": "Omvat geen diepe bekledingsreiniging",
        "Kompletne odświeżenie auta": "Complete opfrissing van de auto",
        "Gdy chcesz ogarnąć środek i zewnętrze naraz": "Wanneer je interieur en buitenzijde tegelijk wilt aanpakken",
        "Najprostszy wybór przy normalnym zabrudzeniu": "Eenvoudige keuze bij normale vervuiling",
        "Głębsze czyszczenie materiałów": "Diepere reiniging van stoffen",
        "Plamy, zapachy i mocniej zabrudzone wnętrze": "Vlekken, geuren en sterker vervuild interieur",
        "Usługa zależna od stanu tapicerki": "Afhankelijk van de staat van de bekleding",
        "Najmocniejszy efekt wizualny": "Sterkste visuele effect",
        "Przed sprzedażą, wydarzeniem albo po zakupie auta": "Voor verkoop, een gelegenheid of na aankoop",
        "Pakiet premium z większym zakresem pracy": "Premium pakket met grotere scope",
        "Czystsza i mniej przesuszona skóra": "Schoner en minder uitgedroogd leder",
        "Skórzane fotele, boczki, podłokietniki": "Lederen stoelen, panelen en armsteunen",
        "Regularna pielęgnacja ogranicza pękanie i połysk od tłuszczu": "Regelmatig onderhoud beperkt barsten en vettige glans",
        "Lepszy chwyt i świeżość": "Betere grip en frisheid",
        "Najczęściej dotykany element auta": "Meest aangeraakte onderdeel van de auto",
        "Dobry mały dodatek do czyszczenia wnętrza": "Goede kleine extra bij interieurreiniging",
        "Lekkie odświeżenie materiału": "Lichte opfrissing van stof",
        "Fotele bez ciężkich plam": "Stoelen zonder zware vlekken",
        "Szybsza alternatywa dla pełnego prania": "Sneller alternatief voor volledige reiniging",
        "Odświeżenie większej części wnętrza": "Opfrissing van een groter deel van het interieur",
        "Materiały, boczki i delikatne elementy": "Stoffen delen, panelen en gevoelige elementen",
        "Zakres zależy od rodzaju materiału": "Omvang hangt af van het materiaal",
        "Gładszy lakier w dotyku": "Gladdere lak",
        "Osady metaliczne, smoła, brud drogowy": "Metaaldeeltjes, teer en wegvuil",
        "Dobry etap przed woskiem": "Goede stap vóór wax",
        "Połysk i łatwiejsze mycie": "Glans en makkelijker wassen",
        "Auto po myciu lub oczyszczaniu lakieru": "Auto na wasbeurt of lakreiniging",
        "Trwałość zależy od pogody i pielęgnacji": "Duurzaamheid hangt af van weer en onderhoud",
        "Szybki połysk po myciu": "Snelle glans na het wassen",
        "Gdy chcesz lekki efekt bez pełnego zabezpieczenia": "Wanneer je een licht effect wilt zonder volledige bescherming",
        "Dobry jako szybki dodatek": "Goed als snelle extra",
        "Czystsza komora silnika": "Schonere motorruimte",
        "Przed sprzedażą lub po długim czasie bez czyszczenia": "Voor verkoop of na lange tijd zonder reiniging",
        "Pracuję ostrożnie przy elektronice i wrażliwych elementach": "Ik werk voorzichtig rond elektronica en gevoelige delen",
        "Mniej sierści w tapicerce i dywanikach": "Minder haren in bekleding en matten",
        "Auta po psie lub kocie": "Auto's met hond of kat",
        "Czas zależy od ilości sierści i rodzaju materiału": "Tijd hangt af van hoeveelheid haar en soort materiaal",
        "Lepszy wygląd i świeżość auta": "Betere uitstraling en frisheid",
        "Gdy ta usługa pasuje do stanu pojazdu": "Wanneer deze service past bij de staat van de auto",
        "Zakres potwierdzam po obejrzeniu auta": "Omvang bevestig ik na inspectie",
        "Kalkulator": "Calculator",
        "Wstępna wycena": "Prijsindicatie",
        "Kwota orientacyjna przed oględzinami auta.": "Indicatief bedrag vóór inspectie van de auto.",
        "Pogoda a detailing": "Weer en detailing",
        "Sprawdź pogodę przed terminem": "Check het weer voor je afspraak",
        "pracuję na zewnątrz przy myciu aut": "wassen gebeurt buiten",
        "Warunki na najbliższe dni": "Omstandigheden voor de komende dagen",
        "Sprawdzam prognozę dla Maarssen...": "Weersverwachting voor Maarssen laden...",
        "Dziś": "Vandaag",
        "Jutro": "Morgen",
        "Pojutrze": "Overmorgen",
        "Ładowanie": "Laden",
        "Dlaczego pogoda ma znaczenie?": "Waarom is het weer belangrijk?",
        "Pracuję na zewnątrz przy myciu aut, dlatego deszcz, silny wiatr albo niska temperatura mogą utrudnić usługę zewnętrzną. W takich warunkach często lepiej zaplanować wnętrze lub ustalić godzinę indywidualnie.": "Omdat het wassen buiten gebeurt, kunnen regen, harde wind of lage temperatuur het werk aan de buitenzijde lastiger maken. In zulke omstandigheden is interieurreiniging vaak een betere keuze of spreken we de tijd apart af.",
        "• Ostateczna cena po oględzinach stanu pojazdu": "• Definitieve prijs na inspectie van de auto",
        "Dodaj do kontaktów": "Toevoegen aan contacten",
        "Pobierz Ofertę (PDF)": "Offerte downloaden (PDF)",
        "Zarezerwuj Termin Online": "Online afspraak maken",
        "Dokumentacja i bezpieczeństwo": "Documentatie en zekerheid",
        "Auto trafia w moje ręce na jasnych zasadach": "Je auto is bij mij op duidelijke voorwaarden",
        "Przed rozpoczęciem pracy wykonuję oględziny auta i zapisuję najważniejsze informacje w protokole. Dzięki temu wiesz, jaki był stan pojazdu przy przyjęciu, co obejmuje usługa i jakie zasady obowiązują podczas realizacji.": "Voor de start bekijk ik de auto en noteer ik de belangrijkste informatie in een protocol. Zo weet je wat de staat van de auto was, wat de service omvat en welke afspraken gelden.",
        "stan lakieru": "staat van de lak",
        "wnętrze i tapicerka": "interieur en bekleding",
        "zakres prac": "werkzaamheden",
        "Inspekcja auta": "Auto-inspectie",
        "Protokół": "Protocol",
        "Jasne zasady": "Duidelijke afspraken",
        "Wzór protokołu": "Voorbeeldprotocol",
        "Regulamin": "Voorwaarden",
        "Protokół przyjęcia": "Innameprotocol",
        "Stan pojazdu": "Staat van het voertuig",
        "Zakres usługi": "Omvang van de service",
        "Potwierdzenie zasad": "Bevestiging van afspraken",
        "Pracuję na profesjonalnych produktach": "Ik werk met professionele producten",
        "Marki, które dobrze znam i które trzymają profesjonalny poziom w detailingu.": "Merken die ik goed ken en die een professioneel niveau in detailing bieden.",
        "Polska marka • od 2014": "Pools merk • sinds 2014",
        "Polska marka • zabezpieczenia": "Pools merk • bescherming",
        "Polska marka • nowoczesne formuły": "Pools merk • moderne formules",
        "Polska marka • zapach i styl": "Pools merk • geur en stijl",
        "Polska marka • od 2015": "Pools merk • sinds 2015",
        "Polska marka • laboratorium": "Pools merk • laboratorium",
        "Polska marka • społeczność": "Pools merk • community",
        "Polska marka • akcesoria": "Pools merk • accessoires",
        "Polska marka • mikrofibry": "Pools merk • microvezels",
        "Polski producent chemii i akcesoriów detailingowych. Marka znana z praktycznych produktów do mycia, felg i wnętrza, popularna wśród pasjonatów oraz profesjonalistów.": "Poolse producent van detailingchemie en accessoires. Bekend om praktische producten voor wassen, velgen en interieur.",
        "Marka skupiona na ochronie lakieru, powłokach i preparatach do zabezpieczania powierzchni. Dobrze kojarzy się z połyskiem, trwałością i nowoczesnym podejściem do ochrony auta.": "Merk gericht op lakbescherming, coatings en producten voor oppervlaktebescherming, met focus op glans en duurzaamheid.",
        "Polski producent chemii samochodowej stawiający na skuteczność i bezpieczne składy. Marka mocno obecna przy myciu, dekontaminacji i produktach do codziennej pielęgnacji.": "Poolse producent van autochemie met focus op effectiviteit en veilige formules voor wassen, decontaminatie en dagelijks onderhoud.",
        "Polska marka kojarzona z eleganckimi zapachami samochodowymi i estetycznym wykończeniem wnętrza. To detal, który klient zauważa od razu po otwarciu drzwi.": "Pools merk dat bekendstaat om elegante autogeuren en een mooie afwerking van het interieur.",
        "Marka tworzona z myślą o prostym i skutecznym detailingu. Jej produkty są lubiane za to, że dobrze sprawdzają się zarówno u amatorów, jak i w regularnej pracy z autem.": "Merk gemaakt voor eenvoudige en effectieve detailing, geschikt voor zowel liefhebbers als regelmatig gebruik.",
        "Polski producent rozwijający własne receptury i testujący produkty w praktyce. Marka nastawiona na powtarzalność efektu, ochronę i świadome podejście do chemii.": "Poolse producent die eigen formules ontwikkelt en producten in de praktijk test, gericht op herhaalbaar resultaat en bescherming.",
        "Marka wyrosła wokół edukacji i społeczności detailingowej. Łączy praktyczne produkty z podejściem dla osób, które chcą rozumieć proces pielęgnacji auta.": "Merk ontstaan rond educatie en de detailingcommunity, met praktische producten en aandacht voor het proces.",
        "Polska marka akcesoriów: pędzli, rękawic, mikrofibr i narzędzi do precyzyjnej pracy. Dobre akcesoria pomagają czyścić dokładnie, bez niepotrzebnego ryzyka dla powierzchni.": "Pools accessoiremerk met kwasten, handschoenen, microvezels en tools voor precies en veilig werk.",
        "Marka kojarzona przede wszystkim z miękkimi mikrofibrami, ręcznikami i akcesoriami. Takie produkty są ważne przy osuszaniu, docieraniu i pracy z delikatnym lakierem.": "Merk dat vooral bekendstaat om zachte microvezels, doeken en accessoires voor veilig drogen en afwerken.",
        "Jak pracuję": "Hoe ik werk",
        "Od przyjęcia auta do odbioru bez niedomówień": "Van inname tot ophalen, zonder misverstanden",
        "INSPEKCJA": "INSPECTIE",
        "Twój samochód": "Jouw auto",
        "Najpierw patrzę na realny stan auta, a nie tylko na nazwę pakietu.": "Ik kijk eerst naar de echte staat van de auto, niet alleen naar de naam van het pakket.",
        "Moja wiedza": "Mijn kennis",
        "Dobieram chemię i metodę pracy do powierzchni, zabrudzeń i celu usługi.": "Ik kies producten en methode op basis van oppervlak, vervuiling en doel van de service.",
        "Sprawdzone metody": "Bewezen methodes",
        "Pracuję etapami: bez pośpiechu, z kontrolą efektu i ostrożnością przy detalach.": "Ik werk stap voor stap: rustig, gecontroleerd en met aandacht voor details.",
        "Gwarancja podejścia": "Zorgvuldige aanpak",
        "Masz jasny zakres usługi, dokumenty i uczciwą informację przed rozpoczęciem pracy.": "Je krijgt een duidelijke scope, documenten en eerlijke informatie vóór de start.",
        "Etapy realizacji": "Stappen van de service",
        "Przyjęcie": "Inname",
        "Inspekcja": "Inspectie",
        "Odbiór": "Ophalen",
        "Dla kogo jest detailing?": "Voor wie is detailing?",
        "Nie tylko dla aut pokazowych": "Niet alleen voor showauto's",
        "Detailing ma sens zawsze wtedy, gdy auto ma wyglądać lepiej, pachnieć świeżej i być łatwiejsze w utrzymaniu.": "Detailing is zinvol wanneer je auto er beter uit moet zien, frisser moet ruiken en makkelijker schoon te houden moet zijn.",
        "Przed sprzedażą auta": "Voor verkoop van de auto",
        "Czyste wnętrze, świeży lakier i zadbane detale pomagają zrobić lepsze pierwsze wrażenie przy oględzinach.": "Een schoon interieur, frisse lak en verzorgde details zorgen voor een betere eerste indruk.",
        "Po zakupie używanego auta": "Na aankoop van een gebruikte auto",
        "Dobry moment, żeby odświeżyć wnętrze po poprzednim właścicielu i zacząć użytkowanie auta od czystej bazy.": "Een goed moment om het interieur op te frissen en met een schone basis te beginnen.",
        "Przy dzieciach i zwierzętach": "Bij kinderen en huisdieren",
        "Okruchy, sierść, piasek i zapachy zbierają się szybko. Regularne czyszczenie pomaga utrzymać auto w ryzach.": "Kruimels, haren, zand en geuren verzamelen zich snel. Regelmatig reinigen houdt de auto netjes.",
        "Po zimie lub wakacjach": "Na winter of vakantie",
        "Sól, błoto, owady i piach potrafią mocno obciążyć auto. Detailing przywraca świeżość i zabezpiecza powierzchnie.": "Zout, modder, insecten en zand belasten de auto. Detailing herstelt frisheid en beschermt oppervlakken.",
        "Najczęstsze pytania przed wizytą": "Veelgestelde vragen vóór de afspraak",
        "Ile trwa detailing auta?": "Hoe lang duurt detailing?",
        "To zależy od zakresu i stanu auta. Proste odświeżenie może zająć kilka godzin, a większy pakiet nawet cały dzień.": "Dat hangt af van de staat van de auto en de gekozen service. Een eenvoudige opfrisbeurt duurt enkele uren, een groter pakket kan een hele dag duren.",
        "Czy cena może się zmienić po obejrzeniu auta?": "Kan de prijs veranderen na het bekijken van de auto?",
        "Tak, jeśli auto jest mocno zabrudzone, ma dużo sierści, plam albo wymaga więcej czasu. Dlatego cena na stronie jest wstępna.": "Ja, als de auto sterk vervuild is, veel haren of vlekken heeft of meer tijd vraagt. De prijs op de site is daarom indicatief.",
        "Czy muszę przygotować auto przed oddaniem?": "Moet ik de auto voorbereiden?",
        "Najlepiej zabrać prywatne rzeczy, dokumenty, foteliki i wartościowe przedmioty. Resztą czyszczenia zajmuję się ja.": "Neem bij voorkeur persoonlijke spullen, documenten, kinderzitjes en waardevolle spullen mee. De rest van het reinigen doe ik.",
        "Czy usuniesz każdą plamę i zapach?": "Kun je elke vlek en geur verwijderen?",
        "Nie zawsze da się obiecać 100% efektu, szczególnie przy starych plamach. Zawsze informuję uczciwie, czego można się spodziewać.": "Niet altijd voor 100%, vooral bij oude vlekken. Ik geef altijd eerlijk aan wat je kunt verwachten.",
        "Czy detailing niszczy lakier albo wnętrze?": "Beschadigt detailing lak of interieur?",
        "Nie, jeśli jest robiony rozsądnie. Używam bezpiecznych metod, miękkich akcesoriów i chemii dobranej do powierzchni.": "Nee, als het zorgvuldig gebeurt. Ik gebruik veilige methodes, zachte accessoires en producten passend bij het oppervlak.",
        "Jak najlepiej umówić termin?": "Hoe maak ik het beste een afspraak?",
        "Najprościej przez WhatsApp. Jeśli użyjesz kalkulatora, wiadomość może zawierać wybraną klasę auta, model i listę usług.": "Het makkelijkst via WhatsApp. Als je de calculator gebruikt, kan het bericht de klasse, het model en de gekozen diensten bevatten.",
        "Twój model przeglądarki nie wspiera wideo.": "Je browser ondersteunt deze video niet.",
        "Aktualne realizacje i kulisy": "Actuele projecten en achter de schermen",
        "Zobacz, jak wygląda praca na żywo": "Bekijk hoe het werk er in de praktijk uitziet",
        "Na Instagramie wrzucam bieżące auta, proces czyszczenia i krótkie relacje z detailingu.": "Op Instagram plaats ik auto's, het reinigingsproces en korte updates uit de detailingpraktijk.",
        "Co znajdziesz na Instagramie": "Wat je op Instagram vindt",
        "Stories": "Stories",
        "Proces pracy": "Werkproces",
        "Realizacje": "Projecten",
        "Obserwuj @cjaab99": "Volg @cjaab99",
        "Motyw": "Thema",
        "jasny / ciemny": "licht / donker",
        "Zmień motyw strony": "Thema wijzigen",
        "Szybkie akcje": "Snelle acties",
        "Car All Detailing Logo": "Car All Detailing logo",
        "Słowniczek": "Woordenlijst",
        "poznaj pojęcia": "begrippen leren",
        "Słownik detailera": "Detailing woordenlijst",
        "Słownik Detailera": "Detailing woordenlijst",
        "Krótko i po ludzku: co oznaczają najważniejsze pojęcia z detailingu.": "Kort en duidelijk: wat de belangrijkste detailingbegrippen betekenen.",
        "Mycie": "Wassen",
        "Lakier": "Lak",
        "Ochrona": "Bescherming",
        "wyślij wycenę": "stuur offerte",
        "Wyślij aktualną wycenę przez WhatsApp": "Stuur actuele prijsindicatie via WhatsApp",
        "Jezyk": "Taal",
        "Waluta": "Valuta",
        "Polski": "Pools",
        "Zloty": "Zloty",
        "🚿 Mycie Detailingowe (Zewnątrz)": "🚿 Detailing wash (buitenzijde)",
        "🧼 Dekontaminacja i Deironizacja": "🧼 Decontaminatie en ijzerverwijdering",
        "🛡️ Wosk Premium (Twardy)": "🛡️ Premium wax",
        "🐂 Pielęgnacja Skóry (Clean & Condition)": "🐂 Lederverzorging (clean & condition)",
        "✨ Jednoetapowe Odświeżenie (One-Step Polish)": "✨ One-step lakopfrissing",
        "💎 Powłoka Ceramiczna / Grafenowa": "💎 Keramische / grafeen coating",
        "🛞 Detailing Kół i Nadkoli": "🛞 Velgen en wielkasten detailen",
        "🕯️ Polerowanie Reflektorów": "🕯️ Koplampen polijsten",
        "🖤 Odświeżenie Plastików Zewnętrznych": "🖤 Kunststof buitenzijde opfrissen",
        "🧼 Czyszczenie Komory Silnika": "🧼 Motorruimte reinigen",
        "💎 Dlaczego Detailing jest droższy od zwykłej myjni?": "💎 Waarom is detailing duurder dan een gewone wasstraat?",
        "To fundament bezpiecznej pielęgnacji. Proces zaczynamy od pianowania (Pre-Wash), by zmiękczyć brud bez dotykania lakieru. Następnie stosujemy metodę \"na dwa wiadra\" z separatorami zanieczyszczeń i pędzelkujemy każdy detal: wnęki, emblematy oraz grill. Całość kończymy osuszaniem sprężonym powietrzem i grubymi ręcznikami, co eliminuje ryzyko powstawania mikrozarysowań typu swirls.": "Dit is de basis van veilige verzorging. We beginnen met pre-wash foam om vuil los te weken zonder de lak aan te raken. Daarna volgt de twee-emmer-methode met vuilscheiders en worden details zoals naden, emblemen en grille zorgvuldig gereinigd. Drogen gebeurt met lucht en zachte doeken om waskrassen te beperken.",
        "Usunięcie tego, czego nie widać na pierwszy rzut oka. Deironizacja chemicznie rozpuszcza wbite w lakier opiłki metalu z klocków hamulcowych (efekt \"krwawiącego lakieru\"). Dodatkowo usuwamy smołę, asfalt oraz soki z drzew. Dopiero po tym etapie lakier odzyskuje swoją naturalną czystość chemiczną, stając się idealną bazą pod woski i powłoki.": "Verwijderen wat je niet meteen ziet. Iron remover lost metaaldeeltjes van remstof chemisch op. Daarnaast worden teer, asfalt en boomhars aangepakt. Pas daarna is de lak echt schoon en klaar voor wax of bescherming.",
        "Ekskluzywne zabezpieczenie na bazie brazylijskiej carnauby lub zaawansowanych polimerów. Tworzy na lakierze grubą, szklistą warstwę ochronną. Zapewnia ekstremalną hydrofobowość (zrzut wody), chroni przed promieniami UV i oksydacją, a przede wszystkim nadaje lakierowi legendarną głębię koloru i efekt \"mokrego lustra\".": "Hoogwaardige bescherming op basis van carnauba of moderne polymeren. Het geeft glans, waterafstoting, bescherming tegen UV en oxidatie en zorgt voor meer diepte in de lak.",
        "Przywracamy skórze jej fabryczny, matowy wygląd i miękkość. Najpierw bezpiecznie usuwamy brud z porów skóry za pomocą dedykowanych pianek i szczoteczek z naturalnego włosia. Następnie impregnujemy ją conditionerym, który zapobiega wysuszaniu, pękaniu i transferowi barwnika z ubrań (np. z jeansów).": "We brengen leder terug naar een matte, frisse uitstraling. Eerst wordt vuil veilig uit de poriën verwijderd, daarna wordt het leder verzorgd zodat het minder uitdroogt en prettiger aanvoelt.",
        "Złoty środek między myciem a pełną korektą. Za pomocą maszyny polerskiej i delikatnej pasty usuwamy do 50-60% drobnych zarysowań (matowienia, rysy po myjniach). Efektem jest drastyczny wzrost połysku, usunięcie utlenionej warstwy lakieru i przygotowanie auta pod sprzedaż lub nałożenie długofalowej ochrony.": "Een tussenstap tussen wassen en volledige lakcorrectie. Met een polijstmachine en milde polish worden lichte krasjes en dofheid verminderd, waardoor de lak zichtbaar meer glans krijgt.",
        "Najtrwalsza forma ochrony dostępna na rynku. Wiąże się na stałe z lakierem, tworząc warstwę o twardości do 9H. Chroni przed chemią, solą drogową i drobnymi zarysowaniami przez okres od 2 do nawet 5 lat. Sprawia, że auto brudzi się znacznie wolniej, a mycie staje się banalnie proste dzięki potężnym właściwościom samooczyszczającym.": "Een van de duurzaamste vormen van lakbescherming. Een coating hecht aan de lak, beschermt tegen vuil, chemie en weersinvloeden en maakt wassen eenvoudiger.",
        "Kompleksowe czyszczenie felg od strony wewnętrznej (po zdjęciu lub na aucie), usuwanie pyłu hamulcowego i zapieczonego asfaltu. Proces wieńczymy dressingiem opon (efekt nowej, satynowej opony) oraz zabezpieczeniem felg dedykowanym woskiem wysokotemperaturowym, który ułatwia późniejsze zmywanie pyłu z klocków.": "Grondige reiniging van velgen, remstof en aangekoekt vuil. Daarna kunnen banden en velgen worden verzorgd zodat ze er frisser uitzien en makkelijker schoon te houden zijn.",
        "Przywracamy przejrzystość zmatowiałym i żółtym lampom. Proces polega na wieloetapowym szlifowaniu zniszczonej warstwy poliwęglanu i mechanicznym polerowaniu na błysk. Na koniec nakładamy filtr UV, który zapobiega ponownemu utlenianiu się plastiku, co znacząco poprawia bezpieczeństwo jazdy w nocy.": "We herstellen doffe of gele koplampen door te schuren en te polijsten. Een beschermlaag helpt opnieuw dof worden te vertragen en verbetert de uitstraling en zichtbaarheid.",
        "Przywracamy głęboką czerń wyblakłym listwom, grillom i elementom podszybia. Używamy dressingów premium lub powłok ceramicznych do plastiku, które nie tylko przywracają kolor, ale tworzą barierę przed promieniami słońca, zapobiegając kruszeniu i ponownemu szarzeniu elementów.": "Vervaagde kunststof delen krijgen weer een diepere kleur. Met dressing of kunststofbescherming blijven ze langer verzorgd en minder grauw.",
        "Bezpieczne usuwanie osadów olejowych i kurzu z serca Twojego auta. Używamy dielektrycznych środków i pary wodnej, aby nie uszkodzić elektroniki. Po czyszczeniu wszystkie elementy gumowe i plastikowe zostają zabezpieczone antystatycznym dressingiem, który chroni przed parbieniem i nadaje fabryczny wygląd.": "Veilige reiniging van zichtbare delen in de motorruimte. Er wordt voorzichtig gewerkt rond gevoelige onderdelen en kunststof/rubber kan daarna worden opgefrist.",
        "Wiele osób myli detailing ze zwykłym myciem, ale różnica tkwi w skali precyzji i bezpieczeństwie:": "Veel mensen verwarren detailing met gewoon wassen, maar het verschil zit in precisie en veiligheid:",
        "1. Czas to jakość: Zwykłe mycie trwa 30 minut. Kompleksowy detailing to od 8 do nawet 40 godzin rzemieślniczej pracy. Detailer poświęca czas na miejsca, których nie widać na pierwszy rzut oka – wnęki, szyny foteli, emblematy czy nadkola.": "1. Tijd is kwaliteit: een gewone wasbeurt duurt kort. Detailing kost veel meer tijd en aandacht voor plekken die je niet meteen ziet.",
        "2. Technologia i bezpieczeństwo: Korzystamy z mierników grubości lakieru, specjalistycznych lamp inspekcyjnych i maszyn polerskich. Używamy chemii o bezpiecznym pH, która nie niszczy uszczelek ani chromów, co jest częstym problemem po agresywnej chemii na myjniach bezdotykowych.": "2. Techniek en veiligheid: er wordt gewerkt met passende producten, zachte materialen en methodes die het oppervlak respecteren.",
        "3. Wiedza i odpowiedzialność: Lakier współczesnych aut jest cieńszy niż ludzki włos. Praca z maszyną polerską wymaga ogromnej wiedzy, by nie doprowadzić do nieodwracalnych uszkodzeń. Płacisz za doświadczenie, które gwarantuje, że auto wróci do Ciebie w lepszym stanie, niż wyjechało z salonu.": "3. Kennis en verantwoordelijkheid: moderne lak is gevoelig. Zorgvuldig werken voorkomt onnodige risico's en geeft een beter resultaat.",
        "4. Inwestycja, nie koszt: Profesjonalny detailing drastycznie podnosi wartość rynkową auta przy odsprzedaży i chroni je przed korozją oraz degradacją materiałów. To konserwacja, która realnie oszczędza Twoje pieniądze w przyszłości.": "4. Investering, geen kostenpost: een verzorgde auto oogt beter, is makkelijker te onderhouden en kan aantrekkelijker zijn bij verkoop."
    };

    const STATIC_TEXT_PL = Object.fromEntries(Object.entries(STATIC_TEXT_NL).map(([pl, nl]) => [nl, pl]));
    const ATTRS_TO_TRANSLATE = ["placeholder", "aria-label", "title", "data-tip", "content", "alt"];
    const GLOSSARY_CONTENT = {
        pl: [
            ["🚿 Mycie Detailingowe (Zewnątrz)", "To bezpieczne mycie auta z pianą aktywną, metodą na dwa wiadra i dokładnym czyszczeniem detali takich jak wnęki, emblematy, felgi oraz grill. Celem jest usunięcie brudu bez niepotrzebnego rysowania lakieru."],
            ["🧼 Dekontaminacja i Deironizacja", "Usuwanie osadów, których zwykłe mycie nie zabiera: opiłków metalu, smoły, asfaltu i nalotów drogowych. Po tym lakier jest czystszy chemicznie i lepiej przygotowany pod wosk lub zabezpieczenie."],
            ["🛡️ Wosk Premium (Twardy)", "Zabezpieczenie lakieru, które wzmacnia połysk, pomaga odpychać wodę i ułatwia późniejsze mycie. Daje autu głębszy kolor i bardziej zadbany wygląd."],
            ["🐂 Pielęgnacja Skóry (Clean & Condition)", "Czyszczenie skóry z brudu i tłuszczu oraz nałożenie preparatu pielęgnującego. Skóra odzyskuje bardziej matowy wygląd, miękkość i jest mniej podatna na przesuszanie."],
            ["✨ Jednoetapowe Odświeżenie (One-Step Polish)", "Lekka korekta lakieru między zwykłym myciem a pełnym polerowaniem. Pomaga zmniejszyć drobne zarysowania, matowienie i ślady po myjniach, a lakier zyskuje większy połysk."],
            ["💎 Powłoka Ceramiczna / Grafenowa", "Trwała ochrona lakieru, która wiąże się z powierzchnią i ułatwia utrzymanie auta w czystości. Może chronić przed chemią, brudem i czynnikami atmosferycznymi."],
            ["🛞 Detailing Kół i Nadkoli", "Dokładne czyszczenie felg, opon i nadkoli z pyłu hamulcowego, asfaltu oraz zabrudzeń drogowych. Na koniec można zabezpieczyć felgi i odświeżyć wygląd opon."],
            ["🕯️ Polerowanie Reflektorów", "Przywracanie przejrzystości zmatowiałym lub pożółkłym lampom przez szlifowanie, polerowanie i zabezpieczenie. Poprawia wygląd auta i widoczność po zmroku."],
            ["🖤 Odświeżenie Plastików Zewnętrznych", "Przywrócenie głębszego koloru wyblakłym listwom, grillom i plastikom zewnętrznym. Dressing lub zabezpieczenie pomaga spowolnić ponowne szarzenie."],
            ["🧼 Czyszczenie Komory Silnika", "Ostrożne czyszczenie widocznych elementów pod maską z kurzu i osadów. Praca odbywa się delikatnie przy elektronice i wrażliwych elementach."],
            ["💎 Dlaczego Detailing jest droższy od zwykłej myjni?", "Detailing wymaga więcej czasu, dokładności, wiedzy i bezpiecznych produktów. Tu liczy się nie tylko umycie auta, ale też ochrona powierzchni, praca w detalach i uczciwa ocena tego, co da się zrobić bez ryzyka."]
        ],
        nl: [
            ["🚿 Detailing wash (buitenzijde)", "Een veilige wasbeurt met pre-wash foam, de twee-emmer-methode en aandacht voor details zoals naden, emblemen, velgen en grille. Het doel is vuil verwijderen zonder onnodige lakkrassen."],
            ["🧼 Decontaminatie en ijzerverwijdering", "Het verwijderen van vervuiling die normaal wassen niet wegneemt: metaaldeeltjes, teer, asfalt en wegvuil. Daarna is de lak schoner en beter klaar voor wax of bescherming."],
            ["🛡️ Premium wax", "Lakbescherming die glans versterkt, water helpt afstoten en wassen makkelijker maakt. De auto krijgt meer diepte in de kleur en een verzorgde uitstraling."],
            ["🐂 Lederverzorging (clean & condition)", "Leder wordt gereinigd van vuil en vet en daarna verzorgd. Het oppervlak wordt matter, frisser en minder gevoelig voor uitdroging."],
            ["✨ One-step lakopfrissing", "Een lichte lakcorrectie tussen wassen en volledig polijsten. Helpt fijne krasjes, dofheid en wasstraatsporen te verminderen en geeft meer glans."],
            ["💎 Keramische / grafeen coating", "Duurzame lakbescherming die zich aan het oppervlak hecht en de auto makkelijker schoon houdt. Kan beschermen tegen vuil, chemie en weersinvloeden."],
            ["🛞 Velgen en wielkasten detailen", "Grondige reiniging van velgen, banden en wielkasten van remstof, asfalt en wegvuil. Velgen kunnen daarna beschermd worden en banden krijgen een frisse look."],
            ["🕯️ Koplampen polijsten", "Doffe of vergeelde koplampen worden geschuurd, gepolijst en beschermd. Dit verbetert de uitstraling van de auto en het zicht in het donker."],
            ["🖤 Kunststof buitenzijde opfrissen", "Vervaagde kunststof delen krijgen weer een diepere kleur. Dressing of bescherming helpt opnieuw vergrijzen te vertragen."],
            ["🧼 Motorruimte reinigen", "Voorzichtige reiniging van zichtbare delen onder de motorkap van stof en aanslag. Er wordt rustig gewerkt rond elektronica en gevoelige onderdelen."],
            ["💎 Waarom is detailing duurder dan een gewone wasstraat?", "Detailing vraagt meer tijd, precisie, kennis en veilige producten. Het gaat niet alleen om wassen, maar ook om bescherming, detailwerk en een eerlijke inschatting van wat veilig haalbaar is."]
        ]
    };

    function translateValue(value, dictionary) {
        if (!value) return value;
        const exact = dictionary[value];
        if (exact) return exact;
        const trimmed = value.trim();
        if (!trimmed || !dictionary[trimmed]) return value;
        return `${value.match(/^\s*/)[0]}${dictionary[trimmed]}${value.match(/\s*$/)[0]}`;
    }

    function applyStaticTranslations(nextLocale) {
        const dictionary = nextLocale === "nl" ? STATIC_TEXT_NL : nextLocale === "en" ? STATIC_TEXT_EN : STATIC_TEXT_PL;

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const parent = node.parentElement;
                if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
        });

        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        textNodes.forEach((node) => {
            node.nodeValue = translateValue(node.nodeValue, dictionary);
        });

        document.querySelectorAll("*").forEach((el) => {
            ATTRS_TO_TRANSLATE.forEach((attr) => {
                if (!el.hasAttribute(attr)) return;
                el.setAttribute(attr, translateValue(el.getAttribute(attr), dictionary));
            });
        });

        document.querySelectorAll(".knowledge-accordion details").forEach((item, index) => {
            const entry = GLOSSARY_CONTENT[nextLocale]?.[index];
            if (!entry) return;
            const titleEl = item.querySelector(".glossary-entry__title") || item.querySelector("summary");
            const paragraph = item.querySelector(".glossary-entry__content p") || item.querySelector("p");
            if (titleEl) titleEl.textContent = entry[0];
            if (paragraph) paragraph.textContent = entry[1];
        });
    }

    function getInitialLocale() {
        const paramLocale = new URLSearchParams(window.location.search).get("lang");
        if (paramLocale === "nl" || paramLocale === "pl" || paramLocale === "en") return paramLocale;
        const savedLocale = localStorage.getItem(cfg.storageKeys.locale);
        if (savedLocale === "nl" || savedLocale === "pl" || savedLocale === "en") return savedLocale;
        return cfg.defaultLocale || "pl";
    }

    let currency = cfg.defaultCurrency || "EUR";
    let locale = getInitialLocale();
    let lastFocusedElement = null;
    let rateMeta = { source: "fallback", date: null, loading: false };

    function t(key) {
        return (I18N[locale] || I18N.pl)[key] || I18N.pl[key];
    }

    function getCurrency() {
        return currency;
    }

    function setCurrency(next) {
        currency = next === "PLN" ? "PLN" : "EUR";
        document.querySelectorAll("[data-currency-btn]").forEach((btn) => {
            btn.classList.toggle("active", btn.getAttribute("data-currency-btn") === currency);
        });
        const sym = document.getElementById("currency-symbol");
        if (sym) sym.textContent = currency === "PLN" ? "z\u0142" : "\u20ac";
        updateRateDisclaimer();
        document.dispatchEvent(new CustomEvent("cad:currency-change"));
    }

    function setLocale(next) {
        locale = next === "nl" ? "nl" : next === "en" ? "en" : "pl";
        localStorage.setItem(cfg.storageKeys.locale, locale);
        document.documentElement.lang = locale;
        applyStaticTranslations(locale);
        const ogLocale = locale === "nl" ? "nl_NL" : locale === "en" ? "en_GB" : "pl_PL";
        document.querySelector('meta[property="og:locale"]')?.setAttribute("content", ogLocale);
        document.querySelectorAll("[data-locale-btn]").forEach((btn) => {
            btn.classList.toggle("active", btn.getAttribute("data-locale-btn") === locale);
        });
        const payLabel = document.getElementById("pay-label");
        if (payLabel) payLabel.textContent = t("payLabel");
        const cookieText = document.getElementById("cookie-consent-text");
        if (cookieText) cookieText.textContent = t("cookieText");
        const cookieDecline = document.getElementById("cookie-decline");
        if (cookieDecline) cookieDecline.textContent = t("cookieDecline");
        const cookieAccept = document.getElementById("cookie-accept");
        if (cookieAccept) cookieAccept.textContent = t("cookieAccept");
        updateRateDisclaimer();
        document.dispatchEvent(new CustomEvent("cad:locale-change"));
    }

    function toDisplayAmount(amountEur) {
        return currency === "PLN" ? Math.round(amountEur * cfg.eurToPln) : Math.round(amountEur);
    }

    function formatMoney(amountEur, options) {
        const value = toDisplayAmount(amountEur);
        const suffix = currency === "PLN" ? " z\u0142" : " \u20ac";
        if (options && options.raw) return { value, suffix, text: `${value}${suffix}` };
        return `${value}${suffix}`;
    }

    function hasAnalyticsConsent() {
        return localStorage.getItem(cfg.storageKeys.consent) === "accepted";
    }

    function getGaId() {
        return (cfg.gaMeasurementId || "").trim();
    }

    function loadGoogleAnalytics() {
        const id = getGaId();
        if (!id || !hasAnalyticsConsent()) return;
        if (window.__cadGaLoaded) return;

        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
            window.dataLayer.push(arguments);
        };
        window.gtag("js", new Date());
        window.gtag("config", id, { anonymize_ip: true });

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
        document.head.appendChild(script);

        window.__cadGaLoaded = true;
        window.gtag("event", "page_view");
    }

    function trackEvent(name, params) {
        if (!hasAnalyticsConsent()) return;
        loadGoogleAnalytics();
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: name, ...(params || {}) });
        if (typeof window.gtag === "function") {
            window.gtag("event", name, params || {});
        }
    }

    function saveRateCache(rate, source, date) {
        try {
            localStorage.setItem(
                cfg.storageKeys.eurPlnCache,
                JSON.stringify({ rate, source, date, ts: Date.now() })
            );
        } catch (error) {
            /* ignore */
        }
    }

    function loadCachedRate() {
        try {
            const raw = localStorage.getItem(cfg.storageKeys.eurPlnCache);
            if (!raw) return false;
            const cached = JSON.parse(raw);
            if (!cached || typeof cached.rate !== "number") return false;
            if (Date.now() - cached.ts > 12 * 60 * 60 * 1000) return false;
            cfg.eurToPln = cached.rate;
            rateMeta = { source: cached.source || "NBP", date: cached.date || null, loading: false };
            return true;
        } catch (error) {
            return false;
        }
    }

    function applyLiveRate(rate, source, date) {
        cfg.eurToPln = rate;
        rateMeta = { source, date, loading: false };
        saveRateCache(rate, source, date);
        updateRateDisclaimer();
        document.dispatchEvent(new CustomEvent("cad:recalculate-display"));
    }

    async function fetchLiveEurPlnRate() {
        rateMeta.loading = true;
        updateRateDisclaimer();

        try {
            const res = await fetch("https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json");
            if (res.ok) {
                const data = await res.json();
                const entry = data.rates && data.rates[0];
                if (entry && typeof entry.mid === "number") {
                    applyLiveRate(entry.mid, "NBP", entry.effectiveDate);
                    return;
                }
            }
        } catch (error) {
            /* fallback below */
        }

        try {
            const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=PLN");
            if (res.ok) {
                const data = await res.json();
                const rate = data.rates && data.rates.PLN;
                if (typeof rate === "number") {
                    applyLiveRate(rate, "ECB", data.date);
                    return;
                }
            }
        } catch (error) {
            /* fallback below */
        }

        cfg.eurToPln = cfg.eurToPlnFallback || 4.32;
        rateMeta = { source: "fallback", date: null, loading: false };
        updateRateDisclaimer();
    }

    function updateRateDisclaimer() {
        const el = document.getElementById("rate-disclaimer");
        if (!el) return;
        if (currency !== "PLN") {
            el.hidden = true;
            return;
        }
        el.hidden = false;

        if (rateMeta.loading) {
            el.textContent = locale === "nl"
                ? "Actuele EUR/PLN koers ophalen..."
                : locale === "en"
                    ? "Fetching live EUR/PLN rate..."
                    : "Pobieram aktualny kurs EUR/PLN...";
            return;
        }

        const rate = Number(cfg.eurToPln).toFixed(4);
        const datePart = rateMeta.date ? `, ${rateMeta.date}` : "";

        if (locale === "nl") {
            el.textContent = `Live koers (${rateMeta.source}${datePart}): 1 \u20ac = ${rate} z\u0142. Indicatieve prijs.`;
        } else if (locale === "en") {
            el.textContent = `Live rate (${rateMeta.source}${datePart}): 1 \u20ac = ${rate} PLN. Indicative price.`;
        } else {
            el.textContent = `Kurs na \u017cywo (${rateMeta.source}${datePart}): 1 \u20ac = ${rate} z\u0142. Wycena orientacyjna.`;
        }
    }

    function getQuoteSummary() {
        const sizeSelect = document.getElementById("car-size");
        const selectedSize = sizeSelect ? sizeSelect.options[sizeSelect.selectedIndex].text : "-";
        const selectedSizeValue = sizeSelect ? sizeSelect.value.toLowerCase() : "s";
        const selectedCarModel = document.getElementById("selected-car-model")?.dataset.model || "";
        const selected = Array.from(document.querySelectorAll(".service:checked"));
        const lines = [];
        let totalEur = 0;

        selected.forEach((s) => {
            const row = s.closest(".service-item");
            const sizePrice = s.getAttribute(`data-${selectedSizeValue}`);
            const staticPrice = s.getAttribute("data-static");
            totalEur += sizePrice ? parseFloat(sizePrice) : (staticPrice ? parseFloat(staticPrice) : 0);
            if (!row) return;
            const name = row.querySelector(".service-name")?.innerText.replace(/\s+/g, " ").trim() || t("quoteServiceFallback");
            lines.push(`- ${name}`);
        });

        return { selectedSize, selectedCarModel, lines, totalEur: Math.round(totalEur), serviceCount: selected.length };
    }

    function buildWhatsAppUrl() {
        const q = getQuoteSummary();
        const totalText = formatMoney(q.totalEur);
        let body;

        if (locale === "nl") {
            const carLine = q.selectedCarModel ? `\nAuto: ${q.selectedCarModel}` : "";
            body = q.serviceCount === 0
                ? `Hoi! Ik heb interesse in detailing.${carLine}\nKan ik een vrije datum vragen?`
                : `Hoi! Offerte uit calculator:\nKlasse: ${q.selectedSize}${carLine}\n${q.lines.join("\n")}\nTotaal: ${totalText}\nMag ik een vrije datum?`;
        } else if (locale === "en") {
            const carLine = q.selectedCarModel ? `\nCar: ${q.selectedCarModel}` : "";
            body = q.serviceCount === 0
                ? `Hi! I'm interested in detailing.${carLine}\nCan I ask about availability?`
                : `Hi! Quote from calculator:\nClass: ${q.selectedSize}${carLine}\n${q.lines.join("\n")}\nTotal: ${totalText}\nI'd like to ask about availability.`;
        } else {
            const carLine = q.selectedCarModel ? `\nAuto: ${q.selectedCarModel}` : "";
            body = q.serviceCount === 0
                ? `Cze\u015b\u0107! Interesuje mnie detailing.${carLine}\nChcia\u0142bym zapyta\u0107 o wolny termin.`
                : `Cze\u015b\u0107! Wycena z kalkulatora:\nKlasa: ${q.selectedSize}${carLine}\n${q.lines.join("\n")}\nSuma: ${totalText}\nChcia\u0142bym zapyta\u0107 o wolny termin.`;
        }

        return `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(body)}`;
    }

    function updateWhatsAppLinks() {
        const url = buildWhatsAppUrl();
        document.querySelectorAll(".whatsapp-float, #whatsapp-quote-btn").forEach((el) => {
            el.href = url;
        });
    }

    function setupWhatsAppFloat() {
        document.querySelectorAll(".whatsapp-float, #whatsapp-quote-btn").forEach((btn) => {
            if (btn.dataset.trackBound) return;
            btn.dataset.trackBound = "1";
            btn.addEventListener("click", () => {
                updateWhatsAppLinks();
                trackEvent("whatsapp_click", { source: "float_quote" });
            });
        });
    }

    function openModal(modal) {
        if (!modal) return;
        lastFocusedElement = document.activeElement;
        modal.style.display = "flex";
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        const closeBtn = modal.querySelector(".close-modal, [data-modal-close]");
        if (closeBtn) closeBtn.focus();
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
        if (!document.querySelector('.modal-overlay[style*="flex"]')) {
            document.body.classList.remove("modal-open");
        }
        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
        }
    }

    function toggleModalById(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        if (modal.style.display === "flex") closeModal(modal);
        else openModal(modal);
    }

    window.toggleInfoModal = function () {
        toggleModalById("infoModal");
    };

    window.closeWelcomeModal = function () {
        closeModal(document.getElementById("welcomeModal"));
    };

    window.toggleCompareModal = function () {
        toggleModalById("compareModal");
    };

    function setupModals() {
        document.querySelectorAll(".modal-overlay").forEach((modal) => {
            modal.setAttribute("aria-hidden", "true");
            modal.setAttribute("role", "dialog");
            modal.setAttribute("aria-modal", "true");
        });

        document.addEventListener("keydown", (e) => {
            if (e.key !== "Escape") return;
            document.querySelectorAll(".modal-overlay").forEach((modal) => {
                if (modal.style.display === "flex") closeModal(modal);
            });
        });

        const infoFloat = document.querySelector(".info-float");
        if (infoFloat) {
            infoFloat.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleInfoModal();
                }
            });
        }

        window.addEventListener("click", (e) => {
            if (e.target.classList && e.target.classList.contains("modal-overlay")) {
                closeModal(e.target);
            }
        });
    }

    function setupCookieBanner() {
        if (localStorage.getItem(cfg.storageKeys.consent)) return;

        const bar = document.createElement("div");
        bar.id = "cookie-consent-bar";
        bar.className = "cookie-consent-bar";
        bar.setAttribute("role", "dialog");
        bar.setAttribute("aria-label", locale === "nl" ? "Cookie toestemming" : "Zgoda na cookies");
        bar.innerHTML = `
            <p id="cookie-consent-text">${t("cookieText")}</p>
            <div class="cookie-consent-actions">
                <button type="button" class="cookie-btn cookie-decline" id="cookie-decline">${t("cookieDecline")}</button>
                <button type="button" class="cookie-btn cookie-accept" id="cookie-accept">${t("cookieAccept")}</button>
            </div>
        `;

        document.body.appendChild(bar);
        document.body.classList.add("cookie-bar-visible");

        const hideCookieBar = () => {
            bar.remove();
            document.body.classList.remove("cookie-bar-visible");
        };

        document.getElementById("cookie-accept")?.addEventListener("click", () => {
            localStorage.setItem(cfg.storageKeys.consent, "accepted");
            hideCookieBar();
            loadGoogleAnalytics();
            trackEvent("cookie_consent", { choice: "accepted" });
            document.dispatchEvent(new CustomEvent("cad:analytics-allowed"));
        });

        document.getElementById("cookie-decline")?.addEventListener("click", () => {
            localStorage.setItem(cfg.storageKeys.consent, "essential");
            hideCookieBar();
        });
    }

    function setupToolbar() {
        const summary = document.querySelector(".summary-card");
        if (!summary || document.querySelector(".prefs-toolbar")) return;

        const toolbar = document.createElement("div");
        toolbar.className = "prefs-toolbar";
        toolbar.innerHTML = `
            <div class="prefs-group" aria-label="Jezyk">
                <button type="button" class="pref-btn" data-locale-btn="pl" title="Polski">PL</button>
                <button type="button" class="pref-btn" data-locale-btn="nl" title="Nederlands">NL</button>
                <button type="button" class="pref-btn" data-locale-btn="en" title="English">EN</button>
            </div>
            <div class="prefs-group" aria-label="Waluta">
                <button type="button" class="pref-btn" data-currency-btn="EUR" title="Euro">\u20ac</button>
                <button type="button" class="pref-btn" data-currency-btn="PLN" title="Zloty">z\u0142</button>
            </div>
        `;

        summary.insertBefore(toolbar, summary.children[1] || summary.firstChild);

        const rateNote = document.createElement("p");
        rateNote.id = "rate-disclaimer";
        rateNote.className = "rate-disclaimer";
        rateNote.hidden = true;
        toolbar.insertAdjacentElement("afterend", rateNote);

        toolbar.querySelectorAll("[data-locale-btn]").forEach((btn) => {
            btn.addEventListener("click", () => setLocale(btn.getAttribute("data-locale-btn")));
        });
        toolbar.querySelectorAll("[data-currency-btn]").forEach((btn) => {
            btn.addEventListener("click", () => setCurrency(btn.getAttribute("data-currency-btn")));
        });

        setLocale(locale);
        setCurrency(cfg.defaultCurrency || "EUR");
    }

    function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return;
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").catch(() => {});
        });
    }

    function initLazyImages() {
        document.querySelectorAll("img:not([loading])").forEach((img) => {
            if (img.closest(".whatsapp-float, .insta-header")) return;
            img.loading = "lazy";
            if (!img.decoding) img.decoding = "async";
        });
    }

    function isAppEmbed() {
        return (
            document.body.classList.contains("cad-app-quote") ||
            new URLSearchParams(window.location.search).get("app") === "1"
        );
    }

    function init() {
        const embedded = isAppEmbed();
        if (embedded) {
            document.body.classList.add("cad-embedded-app");
        }
        window.addEventListener("message", (event) => {
            if (event.data?.type === "cad:set-locale" && ["pl", "nl", "en"].includes(event.data.locale)) {
                setLocale(event.data.locale);
            }
        });

        loadCachedRate();
        fetchLiveEurPlnRate();

        setupModals();
        if (!embedded) {
            setupCookieBanner();
            setupWhatsAppFloat();
            registerServiceWorker();
        }
        setupToolbar();
        updateWhatsAppLinks();
        initLazyImages();

        const urlLang = new URLSearchParams(window.location.search).get("lang");
        if (urlLang && ["pl", "nl", "en"].includes(urlLang)) {
            setLocale(urlLang);
        }

        document.addEventListener("cad:currency-change", () => {
            updateWhatsAppLinks();
            document.dispatchEvent(new CustomEvent("cad:recalculate-display"));
        });
        document.addEventListener("cad:locale-change", updateWhatsAppLinks);

        if (hasAnalyticsConsent()) {
            loadGoogleAnalytics();
            document.dispatchEvent(new CustomEvent("cad:analytics-allowed"));
        }
    }

    window.CAD_Features = {
        init,
        formatMoney,
        toDisplayAmount,
        getQuoteSummary,
        buildWhatsAppUrl,
        updateWhatsAppLinks,
        fetchLiveEurPlnRate,
        trackEvent,
        getCurrency,
        getLocale() {
            return locale;
        },
        t,
        translateStatic(value) {
            const dictionary = locale === "nl" ? STATIC_TEXT_NL : STATIC_TEXT_PL;
            return translateValue(value, dictionary);
        },
        setCurrency,
        setLocale,
        hasAnalyticsConsent,
        validateCalculatorState(parsed, services) {
            if (!parsed || typeof parsed !== "object") return false;
            if (!cfg.validSizes.includes(parsed.size)) return false;
            if (parsed.ts && Date.now() - parsed.ts > cfg.stateMaxAgeMs) return false;
            if (!Array.isArray(parsed.selectedServiceIds)) return true;
            const validIds = new Set(services.filter((el) => el.id).map((el) => el.id));
            return parsed.selectedServiceIds.every((id) => validIds.has(id));
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
