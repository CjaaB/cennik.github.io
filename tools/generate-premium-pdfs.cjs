const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GOLD = [0.831, 0.686, 0.216];
const DARK = [0.035, 0.035, 0.035];
const INK = [0.105, 0.095, 0.075];
const MUTED = [0.36, 0.34, 0.3];
const SOFT = [0.965, 0.945, 0.895];
const LINE = [0.82, 0.74, 0.56];
const BOTTOM_LIMIT = 82;

async function loadUmd(url, globalName) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load ${url}`);
    const code = await response.text();
    const exported = Function(`${code};return this.${globalName};`).call(globalThis);
    if (!exported) throw new Error(`Could not initialize ${globalName}`);
    return exported;
}

function color(pdfLib, value) {
    return pdfLib.rgb(value[0], value[1], value[2]);
}

function pageSize() {
    return [595.28, 841.89];
}

function wrapText(text, font, size, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) <= maxWidth) {
            line = test;
            return;
        }
        if (line) lines.push(line);
        line = word;
    });
    if (line) lines.push(line);
    return lines;
}

function drawTextBlock(page, pdfLib, text, x, y, options) {
    const {
        font,
        size = 10,
        maxWidth = 500,
        lineHeight = size * 1.35,
        fill = INK
    } = options;
    wrapText(text, font, size, maxWidth).forEach((line) => {
        page.drawText(line, { x, y, size, font, color: color(pdfLib, fill) });
        y -= lineHeight;
    });
    return y;
}

function drawHeader(page, pdfLib, assets, title, subtitle) {
    const { width, height } = page.getSize();
    page.drawRectangle({ x: 0, y: height - 126, width, height: 126, color: color(pdfLib, DARK) });
    page.drawRectangle({ x: 0, y: height - 129, width, height: 3, color: color(pdfLib, GOLD) });
    page.drawImage(assets.logo, { x: 38, y: height - 112, width: 82, height: 82 });
    page.drawText("CAR ALL DETAILING", {
        x: 138,
        y: height - 66,
        size: 21,
        font: assets.bold,
        color: color(pdfLib, [1, 1, 1])
    });
    page.drawText("by Karol Zagórski", {
        x: 139,
        y: height - 85,
        size: 10,
        font: assets.font,
        color: color(pdfLib, GOLD)
    });
    page.drawText(subtitle.toUpperCase(), {
        x: 138,
        y: height - 104,
        size: 7.5,
        font: assets.bold,
        color: color(pdfLib, [0.74, 0.72, 0.66])
    });
    page.drawText(title, {
        x: 38,
        y: height - 158,
        size: 18,
        font: assets.bold,
        color: color(pdfLib, INK)
    });
    page.drawRectangle({ x: 38, y: height - 169, width: 128, height: 2, color: color(pdfLib, GOLD) });
    return height - 194;
}

function drawFooter(page, pdfLib, assets, pageNumber) {
    page.drawRectangle({ x: 38, y: 42, width: 519, height: 1, color: color(pdfLib, LINE) });
    page.drawText("Car All Detailing | Karol Zagórski | Maarssen, NL", {
        x: 38,
        y: 24,
        size: 8,
        font: assets.font,
        color: color(pdfLib, MUTED)
    });
    page.drawText(String(pageNumber), {
        x: 548,
        y: 24,
        size: 8,
        font: assets.font,
        color: color(pdfLib, MUTED)
    });
}

function drawSectionTitle(page, pdfLib, assets, title, x, y) {
    page.drawText(title, { x, y, size: 12, font: assets.bold, color: color(pdfLib, INK) });
    page.drawRectangle({ x, y: y - 7, width: 42, height: 1.5, color: color(pdfLib, GOLD) });
    return y - 24;
}

function drawInfoCard(page, pdfLib, assets, text, x, y, width) {
    const size = 9.4;
    const lineHeight = 13.2;
    const paddingTop = 6;
    const paddingBottom = 8;
    const gapAfter = 34;
    const lines = wrapText(text, assets.font, size, width - 34);
    const height = paddingTop + paddingBottom + lines.length * lineHeight;

    page.drawRectangle({ x, y: y - height, width: 3, height, color: color(pdfLib, GOLD) });
    drawTextBlock(page, pdfLib, text, x + 17, y - paddingTop, {
        font: assets.font,
        size,
        maxWidth: width - 34,
        lineHeight,
        fill: MUTED
    });
    return y - height - gapAfter;
}

function drawLineRow(page, pdfLib, assets, label, x, y, width) {
    page.drawText(label, { x, y, size: 9.2, font: assets.font, color: color(pdfLib, INK) });
    page.drawRectangle({ x: x + 160, y: y - 2, width: width - 160, height: 0.7, color: color(pdfLib, LINE) });
    return y - 20;
}

function drawCheckItem(page, pdfLib, assets, label, x, y) {
    page.drawRectangle({ x, y: y - 3, width: 10, height: 10, borderColor: color(pdfLib, GOLD), borderWidth: 0.8 });
    page.drawText(label, { x: x + 17, y: y - 1, size: 9.3, font: assets.font, color: color(pdfLib, INK) });
}

function drawCheckParagraph(page, pdfLib, assets, label, x, y, maxWidth, size = 8.9) {
    page.drawRectangle({ x, y: y - 3, width: 10, height: 10, borderColor: color(pdfLib, GOLD), borderWidth: 0.8 });
    return drawTextBlock(page, pdfLib, label, x + 17, y - 1, {
        font: assets.font,
        size,
        maxWidth: maxWidth - 17,
        lineHeight: size * 1.35,
        fill: INK
    }) - 7;
}

function addPage(doc, pdfLib, assets, title, subtitle, pageNumber) {
    const page = doc.addPage(pageSize());
    const y = drawHeader(page, pdfLib, assets, title, subtitle);
    drawFooter(page, pdfLib, assets, pageNumber);
    return { page, y };
}

async function createAssets(pdfLib, doc) {
    const fontBytes = Uint8Array.from(fs.readFileSync("C:\\Windows\\Fonts\\segoeui.ttf")).buffer;
    const boldBytes = Uint8Array.from(fs.readFileSync("C:\\Windows\\Fonts\\segoeuib.ttf")).buffer;
    const logoBytes = Uint8Array.from(fs.readFileSync(path.join(ROOT, "logo1.png"))).buffer;
    return {
        font: await doc.embedFont(fontBytes, { subset: true }),
        bold: await doc.embedFont(boldBytes, { subset: true }),
        logo: await doc.embedPng(logoBytes)
    };
}

async function buildProtocol(pdfLib, fontkit) {
    const { PDFDocument } = pdfLib;
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const assets = await createAssets(pdfLib, doc);
    let pageNumber = 1;
    let { page } = addPage(doc, pdfLib, assets, "PROTOKÓŁ PRZYJĘCIA POJAZDU", "Wzór dokumentu inspekcyjnego", pageNumber);
    let y = 640;
    const x = 42;
    const w = 511;

    const nextPage = () => {
        pageNumber += 1;
        ({ page, y } = addPage(doc, pdfLib, assets, "PROTOKÓŁ PRZYJĘCIA POJAZDU", "Wzór dokumentu inspekcyjnego", pageNumber));
    };
    const ensureSpace = (needed) => {
        if (y - needed < BOTTOM_LIMIT) nextPage();
    };

    y = drawInfoCard(page, pdfLib, assets, "Dokument opisuje stan auta przed rozpoczęciem pracy, zakres usługi, rzeczy pozostawione w pojeździe, warunki wykonania usługi oraz najważniejsze ustalenia z klientem. Ma ograniczyć nieporozumienia przy odbiorze pojazdu.", x, y, w);

    y = drawSectionTitle(page, pdfLib, assets, "1. Dane klienta i pojazdu", x, y);
    ["Imię i nazwisko / firma:", "Telefon:", "E-mail:", "Marka i model:", "Nr rejestracyjny:", "VIN:", "Przebieg (km):", "Kolor lakieru:", "Data i godzina przyjęcia:", "Planowany termin odbioru:"].forEach((row) => {
        y = drawLineRow(page, pdfLib, assets, row, x, y, w);
    });

    y -= 6;
    ensureSpace(190);
    y = drawSectionTitle(page, pdfLib, assets, "2. Zakres zamówionych usług", x, y);
    [
        "Mycie / detailing zewnętrzny",
        "Czyszczenie wnętrza",
        "Pranie tapicerki materiałowej",
        "Wosk / zabezpieczenie lakieru",
        "Czyszczenie skóry / kierownicy",
        "Dekontaminacja / oczyszczanie lakieru",
        "Usuwanie sierści / mocnych zabrudzeń",
        "Inne ustalenia"
    ].forEach((item) => {
        drawCheckItem(page, pdfLib, assets, item, x, y);
        y -= 18;
    });
    y -= 10;

    ensureSpace(150);
    y = drawSectionTitle(page, pdfLib, assets, "3. Stan pojazdu przed usługą", x, y);
    ["Lakier i elementy zewnętrzne:", "Zderzaki / progi / listwy:", "Felgi / opony:", "Szyby / lampy:", "Wnętrze / tapicerka:", "Skóra / plastiki / piano black:", "Elementy wrażliwe, luźne lub wcześniej naprawiane:", "Widoczne rysy, odpryski, wgniecenia, plamy lub zapachy:"].forEach((row) => {
        y = drawLineRow(page, pdfLib, assets, row, x, y, w);
    });

    ensureSpace(112);
    y = drawSectionTitle(page, pdfLib, assets, "4. Rzeczy klienta i wyposażenie", x, y);
    [
        "Klient zabrał dokumenty, pieniądze i wartościowe rzeczy",
        "W aucie pozostają rzeczy wskazane wykonawcy",
        "Foteliki / akcesoria / bagaż wymagają wyjęcia przed usługą",
        "Uwagi dotyczące wyposażenia"
    ].forEach((item) => {
        drawCheckItem(page, pdfLib, assets, item, x, y);
        y -= 19;
    });
    y -= 8;

    ensureSpace(140);
    y = drawSectionTitle(page, pdfLib, assets, "5. Warunki wykonania i zgody", x, y);
    const conditions = [
        "Klient przyjmuje do wiadomości, że część usług, szczególnie mycie zewnętrzne, może być wykonywana na zewnątrz, a pogoda może wymagać zmiany godziny lub terminu.",
        "Klient został poinformowany, że cena z kalkulatora jest orientacyjna, a ostateczna wycena zależy od faktycznego stanu pojazdu.",
        "Klient rozumie, że nie każda plama, rysa, zapach lub ślad wcześniejszego zużycia może zostać usunięty w 100%.",
        "Klient wyraża zgodę na wykonanie zdjęć dokumentacyjnych pojazdu przed i po usłudze w celu potwierdzenia stanu auta oraz zakresu prac."
    ];
    conditions.forEach((item) => {
        const lines = wrapText(item, assets.font, 8.9, w - 17);
        ensureSpace(lines.length * 13 + 15);
        y = drawCheckParagraph(page, pdfLib, assets, item, x, y, w, 8.9);
    });

    nextPage();
    y = drawSectionTitle(page, pdfLib, assets, "6. Uwagi dodatkowe", x, y);
    page.drawRectangle({ x, y: y - 76, width: w, height: 76, borderColor: color(pdfLib, LINE), borderWidth: 0.7 });
    y -= 104;

    ensureSpace(58);
    page.drawText("Podpis klienta", { x, y, size: 9, font: assets.font, color: color(pdfLib, MUTED) });
    page.drawRectangle({ x: x + 88, y: y + 2, width: 150, height: 0.8, color: color(pdfLib, LINE) });
    page.drawText("Podpis wykonawcy", { x: x + 282, y, size: 9, font: assets.font, color: color(pdfLib, MUTED) });
    page.drawRectangle({ x: x + 382, y: y + 2, width: 130, height: 0.8, color: color(pdfLib, LINE) });

    return doc.save();
}

async function buildTerms(pdfLib, fontkit) {
    const { PDFDocument } = pdfLib;
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const assets = await createAssets(pdfLib, doc);
    let pageNumber = 1;
    let { page, y } = addPage(doc, pdfLib, assets, "REGULAMIN ŚWIADCZENIA USŁUG", "Car All Detailing — Karol Zagórski", pageNumber);
    const x = 42;
    const maxWidth = 511;

    y = drawInfoCard(page, pdfLib, assets, "Regulamin informuje klienta o zasadach współpracy, wyceny, przyjęcia auta, ograniczeniach efektu, odpowiedzialności, pogodzie oraz reklamacjach. Dokument ma jasno opisać warunki usługi przed rozpoczęciem pracy.", x, y, maxWidth);

    const sections = [
        ["§1. Zakres usług", "Wykonawca świadczy usługi pielęgnacji, mycia i detailingu pojazdów zgodnie z cennikiem, wybraną usługą, stanem pojazdu oraz indywidualnymi ustaleniami z Klientem. Zakres usługi obejmuje wyłącznie czynności ustalone przed rozpoczęciem pracy albo zaakceptowane przez Klienta w trakcie realizacji."],
        ["§2. Wycena i płatność", "Ceny widoczne na stronie internetowej, w kalkulatorze lub w wiadomości mają charakter orientacyjny. Ostateczna cena może ulec zmianie po oględzinach pojazdu, zwłaszcza przy mocnych zabrudzeniach, sierści, plamach, zapachach, nietypowych materiałach, dużych gabarytach auta lub konieczności wykonania dodatkowych etapów. Płatność następuje po wykonaniu usługi, chyba że strony ustalą inaczej."],
        ["§3. Przyjęcie pojazdu i protokół", "Przed rozpoczęciem prac może zostać sporządzony protokół przyjęcia pojazdu dokumentujący stan auta, zakres usługi i ważne uwagi. Klient zobowiązany jest poinformować o znanych uszkodzeniach, wcześniejszych naprawach, foliach PPF/wrap, lakierowaniu, elementach luźnych, niefabrycznych, wrażliwych lub podatnych na uszkodzenia."],
        ["§4. Stan pojazdu i ukryte wady", "Wykonawca nie odpowiada za uszkodzenia istniejące przed przyjęciem pojazdu, ukryte wady, naturalne zużycie materiałów, słabe wcześniejsze naprawy, odklejające się elementy, łuszczący lakier, sparciałe uszczelki, kruche plastiki, uszkodzone przyciski, wadliwe podsufitki, przetarte skóry lub inne defekty, które mogą ujawnić się podczas standardowej pracy detailingowej."],
        ["§5. Efekt usługi", "Efekt końcowy zależy od wieku i rodzaju zabrudzeń, stanu lakieru, stanu tapicerki, jakości wcześniejszej pielęgnacji oraz materiałów użytych w pojeździe. Nie każda plama, rysa, przebarwienie, zapach, osad lub ślad zużycia może zostać usunięty w 100%. Wykonawca może odmówić działań, które mogłyby nadmiernie ryzykować uszkodzenie powierzchni."],
        ["§6. Praca na zewnątrz i warunki pogodowe", "Część usług, w szczególności mycie zewnętrzne, może być wykonywana na zewnątrz. Deszcz, silny wiatr, mróz, upał, bezpośrednie słońce lub wysoka wilgotność mogą wpływać na jakość, bezpieczeństwo i czas realizacji usługi. W takich sytuacjach Wykonawca może zaproponować zmianę godziny, terminu, zakresu usługi albo wykonanie w pierwszej kolejności prac wewnętrznych."],
        ["§7. Rzeczy osobiste i wyposażenie", "Klient powinien usunąć z pojazdu dokumenty, gotówkę, karty, elektronikę, rzeczy wartościowe, foteliki, bagaż i przedmioty prywatne. Wykonawca nie odpowiada za rzeczy pozostawione w pojeździe, jeśli nie zostały wyraźnie wskazane i opisane przed usługą. Elementy utrudniające pracę mogą zostać pominięte lub wymagać dodatkowego czasu."],
        ["§8. Zdjęcia dokumentacyjne", "Wykonawca może wykonać zdjęcia pojazdu przed i po usłudze w celu dokumentacji stanu auta, zakresu pracy, efektu oraz ewentualnych reklamacji. Publikacja zdjęć w celach marketingowych wymaga braku widocznych danych osobowych lub indywidualnego uzgodnienia z Klientem."],
        ["§9. Czas realizacji i odbiór", "Czas realizacji jest orientacyjny i może się zmienić w zależności od stanu auta, pogody, zakresu usługi lub dodatkowych ustaleń. Klient powinien odebrać pojazd w uzgodnionym terminie. Ewentualne opóźnienia niezależne od Wykonawcy, w tym warunki pogodowe, brak dostępu do pojazdu lub zmiana zakresu prac, nie stanowią podstawy do automatycznego obniżenia ceny."],
        ["§10. Reklamacje", "Uwagi do wykonanej usługi należy zgłosić możliwie szybko po odbiorze pojazdu, najlepiej od razu podczas odbioru lub w krótkim czasie po nim wraz ze zdjęciami. Reklamacja jest rozpatrywana indywidualnie z uwzględnieniem ustalonego zakresu usługi, protokołu przyjęcia, stanu pojazdu przed rozpoczęciem prac oraz realnych możliwości usunięcia danego zabrudzenia lub defektu."],
        ["§11. Ograniczenie odpowiedzialności", "Wykonawca odpowiada za szkody powstałe z jego winy przy zachowaniu zasad odpowiedzialności wynikających z obowiązujących przepisów. Wykonawca nie odpowiada za skutki nieujawnionych wad, wcześniejszych napraw, zużycia, uszkodzeń ukrytych, błędnego montażu elementów, nieprawidłowego działania elektroniki ani oczekiwań wykraczających poza ustalony zakres usługi."],
        ["§12. Akceptacja regulaminu", "Umówienie terminu, przekazanie pojazdu do realizacji usługi lub skorzystanie z usług Car All Detailing oznacza akceptację niniejszego regulaminu, cennika, indywidualnych ustaleń oraz informacji przekazanych przed rozpoczęciem pracy."]
    ];

    for (const [heading, body] of sections) {
        const bodyLines = wrapText(body, assets.font, 9.4, maxWidth);
        const sectionHeight = 24 + bodyLines.length * 13.4 + 16;
        if (y - sectionHeight < BOTTOM_LIMIT) {
            pageNumber += 1;
            ({ page, y } = addPage(doc, pdfLib, assets, "REGULAMIN ŚWIADCZENIA USŁUG", "Car All Detailing — Karol Zagórski", pageNumber));
        }
        y = drawSectionTitle(page, pdfLib, assets, heading, x, y);
        y = drawTextBlock(page, pdfLib, body, x, y, {
            font: assets.font,
            size: 9.4,
            maxWidth,
            lineHeight: 13.4,
            fill: INK
        }) - 16;
    }

    return doc.save();
}

(async () => {
    const pdfLib = await loadUmd("https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js", "PDFLib");
    const fontkit = await loadUmd("https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js", "fontkit");
    fs.writeFileSync(path.join(ROOT, "protokol-wzor.pdf"), await buildProtocol(pdfLib, fontkit));
    fs.writeFileSync(path.join(ROOT, "regulamin.pdf"), await buildTerms(pdfLib, fontkit));
    console.log("Generated premium PDF files: protokol-wzor.pdf, regulamin.pdf");
})();
