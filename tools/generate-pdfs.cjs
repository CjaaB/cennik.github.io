const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
function loadUmd(fileName) {
    const code = fs.readFileSync(path.join(__dirname, fileName), "utf8");
    const mod = { exports: {} };
    // eslint-disable-next-line no-new-func
    new Function("module", "exports", code)(mod, mod.exports);
    return mod.exports;
}

const { PDFDocument, rgb, StandardFonts } = loadUmd("pdf-lib.min.js");
const fontkit = loadUmd("fontkit.umd.min.js");

const GOLD = rgb(0.831, 0.686, 0.216);
const BLACK = rgb(0.08, 0.08, 0.08);
const GRAY = rgb(0.35, 0.35, 0.35);
const LIGHT = rgb(0.96, 0.96, 0.96);

const MARGIN = 50;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

function wrapText(text, font, size, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) <= maxWidth) {
            line = test;
        } else {
            if (line) lines.push(line);
            line = word;
        }
    }
    if (line) lines.push(line);
    return lines;
}

async function loadFonts(pdfDoc) {
    pdfDoc.registerFontkit(fontkit);
    const arialPath = path.join(process.env.WINDIR || "C:\\Windows", "Fonts", "arial.ttf");
    const arialBoldPath = path.join(process.env.WINDIR || "C:\\Windows", "Fonts", "arialbd.ttf");
    if (fs.existsSync(arialPath)) {
        const subset = { subset: true };
        const regular = await pdfDoc.embedFont(fs.readFileSync(arialPath), subset);
        const bold = fs.existsSync(arialBoldPath)
            ? await pdfDoc.embedFont(fs.readFileSync(arialBoldPath), subset)
            : regular;
        return { regular, bold };
    }
    return {
        regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    };
}

function drawHeader(page, fonts, logoImage, title, subtitle) {
    const { height } = page.getSize();
    let y = height - MARGIN;

    let headerBlockH = 64;
    if (logoImage && logoImage.width > 0 && logoImage.height > 0) {
        const logoW = 72;
        const logoH = Math.min(56, (logoImage.height / logoImage.width) * logoW);
        page.drawImage(logoImage, {
            x: MARGIN,
            y: y - logoH,
            width: logoW,
            height: logoH
        });
        headerBlockH = 88;
    }

    const textX = logoImage ? MARGIN + 84 : MARGIN;
    page.drawText("CAR ALL DETAILING", {
        x: textX,
        y: y - 22,
        size: 16,
        font: fonts.bold,
        color: BLACK
    });
    page.drawText("by Karol Zagórski", {
        x: textX,
        y: y - 38,
        size: 10,
        font: fonts.regular,
        color: GRAY
    });
    if (subtitle) {
        page.drawText(subtitle, {
            x: textX,
            y: y - 52,
            size: 9,
            font: fonts.regular,
            color: GOLD
        });
    }

    y -= headerBlockH;

    page.drawLine({
        start: { x: MARGIN, y },
        end: { x: PAGE_W - MARGIN, y },
        thickness: 2,
        color: GOLD
    });

    page.drawText(title, {
        x: MARGIN,
        y: y - 28,
        size: 18,
        font: fonts.bold,
        color: BLACK
    });

    return y - 48;
}

function drawFooter(page, fonts, pageNum, totalPages) {
    const footerY = 36;
    page.drawLine({
        start: { x: MARGIN, y: footerY + 14 },
        end: { x: PAGE_W - MARGIN, y: footerY + 14 },
        thickness: 0.5,
        color: GOLD
    });
    page.drawText("Car All Detailing | Karol Zagórski | Maarssen (NL)", {
        x: MARGIN,
        y: footerY,
        size: 8,
        font: fonts.regular,
        color: GRAY
    });
    page.drawText(`Strona ${pageNum} / ${totalPages}`, {
        x: PAGE_W - MARGIN - 50,
        y: footerY,
        size: 8,
        font: fonts.regular,
        color: GRAY
    });
}

class PdfBuilder {
    constructor(logoBytes) {
        this.logoBytes = logoBytes;
        this.fonts = null;
        this.logoImage = null;
        this.pdfDoc = null;
        this.page = null;
        this.y = 0;
        this.pages = [];
        this.docTitle = "";
        this.docSubtitle = "";
    }

    async init(title, subtitle) {
        this.pdfDoc = await PDFDocument.create();
        this.fonts = await loadFonts(this.pdfDoc);
        if (this.logoBytes) {
            this.logoImage = await this.pdfDoc.embedPng(this.logoBytes);
        }
        this.docTitle = title;
        this.docSubtitle = subtitle;
        this.newPage(true);
    }

    newPage(isFirst = false) {
        this.page = this.pdfDoc.addPage([PAGE_W, PAGE_H]);
        this.pages.push(this.page);
        if (isFirst) {
            this.y = drawHeader(this.page, this.fonts, this.logoImage, this.docTitle, this.docSubtitle);
        } else {
            this.y = PAGE_H - MARGIN - 20;
            this.page.drawText(this.docTitle, {
                x: MARGIN,
                y: this.y,
                size: 11,
                font: this.fonts.bold,
                color: GRAY
            });
            this.y -= 24;
        }
    }

    ensureSpace(needed) {
        if (this.y - needed < 70) {
            this.newPage();
        }
    }

    heading(text, size = 12) {
        this.ensureSpace(28);
        this.y -= 10;
        this.page.drawText(text, {
            x: MARGIN,
            y: this.y,
            size,
            font: this.fonts.bold,
            color: BLACK
        });
        this.y -= size + 8;
    }

    paragraph(text, size = 10) {
        const lines = wrapText(text, this.fonts.regular, size, CONTENT_W);
        for (const line of lines) {
            this.ensureSpace(size + 6);
            this.page.drawText(line, {
                x: MARGIN,
                y: this.y,
                size,
                font: this.fonts.regular,
                color: GRAY
            });
            this.y -= size + 5;
        }
        this.y -= 4;
    }

    bullet(text, size = 10) {
        const lines = wrapText(text, this.fonts.regular, size, CONTENT_W - 16);
        this.ensureSpace((size + 5) * lines.length + 4);
        this.page.drawText("•", {
            x: MARGIN + 2,
            y: this.y,
            size,
            font: this.fonts.bold,
            color: GOLD
        });
        let first = true;
        for (const line of lines) {
            this.page.drawText(line, {
                x: MARGIN + 14,
                y: this.y,
                size,
                font: this.fonts.regular,
                color: GRAY
            });
            this.y -= size + 5;
            if (first) first = false;
        }
    }

    fieldRow(label, placeholder = "........................................") {
        this.ensureSpace(22);
        this.page.drawText(label, {
            x: MARGIN,
            y: this.y,
            size: 10,
            font: this.fonts.bold,
            color: BLACK
        });
        this.page.drawText(placeholder, {
            x: MARGIN + 180,
            y: this.y,
            size: 10,
            font: this.fonts.regular,
            color: GRAY
        });
        this.y -= 20;
    }

  checkboxRow(label) {
        this.ensureSpace(18);
        this.page.drawRectangle({
            x: MARGIN,
            y: this.y - 2,
            width: 10,
            height: 10,
            borderColor: GOLD,
            borderWidth: 1
        });
        this.page.drawText(label, {
            x: MARGIN + 16,
            y: this.y,
            size: 9,
            font: this.fonts.regular,
            color: GRAY
        });
        this.y -= 16;
    }

    tableHeader(cols) {
        this.ensureSpace(24);
        const colW = CONTENT_W / cols.length;
        let x = MARGIN;
        this.page.drawRectangle({
            x: MARGIN,
            y: this.y - 14,
            width: CONTENT_W,
            height: 18,
            color: LIGHT
        });
        for (const col of cols) {
            this.page.drawText(col, {
                x: x + 4,
                y: this.y - 10,
                size: 9,
                font: this.fonts.bold,
                color: BLACK
            });
            x += colW;
        }
        this.y -= 22;
    }

    tableRow(cells) {
        this.ensureSpace(20);
        const colW = CONTENT_W / cells.length;
        let x = MARGIN;
        for (const cell of cells) {
            this.page.drawText(cell, {
                x: x + 4,
                y: this.y,
                size: 9,
                font: this.fonts.regular,
                color: GRAY
            });
            x += colW;
        }
        this.page.drawLine({
            start: { x: MARGIN, y: this.y - 6 },
            end: { x: PAGE_W - MARGIN, y: this.y - 6 },
            thickness: 0.3,
            color: rgb(0.85, 0.85, 0.85)
        });
        this.y -= 18;
    }

    signatureBlock() {
        this.ensureSpace(80);
        this.y -= 16;
        this.page.drawText("Data: ....................          Miejscowość: ....................", {
            x: MARGIN,
            y: this.y,
            size: 10,
            font: this.fonts.regular,
            color: GRAY
        });
        this.y -= 36;
        this.page.drawLine({
            start: { x: MARGIN, y: this.y },
            end: { x: MARGIN + 200, y: this.y },
            thickness: 0.5,
            color: GRAY
        });
        this.page.drawText("Podpis klienta", {
            x: MARGIN,
            y: this.y - 14,
            size: 9,
            font: this.fonts.regular,
            color: GRAY
        });
        this.page.drawLine({
            start: { x: PAGE_W - MARGIN - 200, y: this.y + 36 },
            end: { x: PAGE_W - MARGIN, y: this.y + 36 },
            thickness: 0.5,
            color: GRAY
        });
        this.page.drawText("Podpis wykonawcy (Car All Detailing)", {
            x: PAGE_W - MARGIN - 200,
            y: this.y + 22,
            size: 9,
            font: this.fonts.regular,
            color: GRAY
        });
    }

    async save(filePath) {
        const total = this.pdfDoc.getPageCount();
        for (let i = 0; i < total; i++) {
            drawFooter(this.pdfDoc.getPage(i), this.fonts, i + 1, total);
        }
        const bytes = await this.pdfDoc.save();
        fs.writeFileSync(filePath, bytes);
    }
}

async function buildProtokol(logoBytes) {
    const b = new PdfBuilder(logoBytes);
    await b.init("PROTOKÓŁ PRZYJĘCIA POJAZDU", "Wzór dokumentu inspekcyjnego");

    b.paragraph(
        "Niniejszy protokół dokumentuje stan pojazdu w momencie przekazania go do realizacji usług detailingowych. " +
            "Protokół sporządzany jest w obecności klienta (lub jego pełnomocnika) i stanowi podstawę rozliczenia oraz ewentualnych ustaleń dotyczących uszkodzeń istniejących przed rozpoczęciem prac."
    );

    b.heading("1. Dane klienta i pojazdu");
    b.fieldRow("Imię i nazwisko / firma:");
    b.fieldRow("Telefon:");
    b.fieldRow("E-mail:");
    b.fieldRow("Marka i model:");
    b.fieldRow("Nr rejestracyjny:");
    b.fieldRow("VIN:");
    b.fieldRow("Przebieg (km):");
    b.fieldRow("Kolor lakieru:");

    b.heading("2. Zakres zamówionych usług");
    b.paragraph("Zaznacz lub wpisz planowane usługi:");
    b.checkboxRow("Mycie / detailing zewnętrzny");
    b.checkboxRow("Czyszczenie wnętrza");
    b.checkboxRow("Pakiet COMBO (wnętrze + zewnątrz)");
    b.checkboxRow("Pranie tapicerki / deep clean");
    b.checkboxRow("Pakiet Showroom");
    b.checkboxRow("Inne: ..............................................................");

    b.heading("3. Stan karoserii i elementów zewnętrznych");
    b.tableHeader(["Obszar", "Stan (OK / Uwagi)", "Zdjęcie"]);
    const areas = [
        "Przód (zderzak, maska, reflektory)",
        "Bok lewy",
        "Bok prawy",
        "Tył (zderzak, klapa)",
        "Dach",
        "Felgi i opony"
    ];
    for (const area of areas) {
        b.tableRow([area, "", "tak / nie"]);
    }

    b.heading("4. Wnętrze pojazdu");
    b.tableHeader(["Element", "Stan (OK / Uwagi)", "Zdjęcie"]);
    ["Fotele / tapicerka", "Dywany / podłoga", "Kokpit i plastiki", "Szyby wewnętrzne", "Bagażnik"].forEach((el) => {
        b.tableRow([el, "", "tak / nie"]);
    });

    b.heading("5. Wartości powierzone / pozostawione w pojeździe");
    b.paragraph(
        "Klient oświadcza, że w pojeździe nie pozostawiono przedmiotów wartościowych, chyba że zaznaczono poniżej. " +
            "Wykonawca nie ponosi odpowiedzialności za przedmioty pozostawione w pojeździe, o których nie poinformowano na piśmie."
    );
    b.fieldRow("Opis pozostawionych przedmiotów:", "brak / ................................");

    b.heading("6. Oświadczenia stron");
    b.bullet(
        "Klient potwierdza, że pojazd jest sprawny technicznie w zakresie niezbędnym do bezpiecznego wykonania usługi (hamulce, hamulec postojowy, brak wycieków paliwa itp.)."
    );
    b.bullet(
        "Wykonawca poinformował klienta, że niektóre zabrudzenia (np. głębokie rysy, przebarwienia, plamy starsze niż 12 mies.) mogą nie zostać w całości usunięte jednym zabiegiem."
    );
    b.bullet("Klient wyraża zgodę na dokumentację fotograficzną pojazdu na potrzeby protokołu i marketingu (opcjonalnie — zaznacz):");
    b.checkboxRow("TAK — zgoda na zdjęcia do publikacji (anonimowo, bez danych rejestracyjnych)");
    b.checkboxRow("NIE");

    b.signatureBlock();
    return b;
}

async function buildRegulamin(logoBytes) {
    const b = new PdfBuilder(logoBytes);
    await b.init("REGULAMIN ŚWIADCZENIA USŁUG", "Car All Detailing — Karol Zagórski");

    b.paragraph(
        "Regulamin określa zasady świadczenia usług detailingowych przez Car All Detailing (Karol Zagórski), " +
            "zwanego dalej „Wykonawcą”, na rzecz klientów, zwanych dalej „Klientami”. Korzystanie z usług oznacza akceptację postanowień niniejszego regulaminu."
    );

    const sections = [
        [
            "§1. Zakres usług",
            "Wykonawca świadczy usługi pielęgnacji, mycia i detailingu pojazdów zgodnie z cennikiem i ustaleniami indywidualnymi. " +
                "Szczegółowy zakres prac wynika z wybranej usługi, protokołu przyjęcia pojazdu oraz ustaleń z Klientem."
        ],
        [
            "§2. Wycena i płatność",
            "Ceny podane na stronie internetowej lub w kalkulatorze mają charakter orientacyjny. Ostateczna wycena następuje po oględzinach pojazdu. " +
                "Płatność realizowana jest zgodnie z ustaleniami (gotówka, przelew lub inna forma uzgodniona przed rozpoczęciem prac), chyba że strony ustalą inaczej."
        ],
        [
            "§3. Przyjęcie pojazdu",
            "Przed rozpoczęciem prac sporządzany jest protokół przyjęcia pojazdu dokumentujący stan zewnętrzny i wewnętrzny. " +
                "Klient zobowiązany jest do podania prawdziwych danych oraz poinformowania o istniejących uszkodzeniach, modyfikacjach lakieru (np. folia PPF, wrap) i wrażliwych elementach."
        ],
        [
            "§4. Odpowiedzialność Wykonawcy",
            "Wykonawca dokłada należytej staranności i stosuje profesjonalną chemię oraz sprzęt. " +
                "Odpowiedzialność Wykonawcy ograniczona jest do rzeczywistych szkód wynikłych z winy umyślnej lub rażącego niedbalstwa, do wysokości ustalonej wyceny danej usługi, z zastrzeżeniem bezwzględnie obowiązujących przepisów prawa."
        ],
        [
            "§5. Ograniczenia odpowiedzialności",
            "Wykonawca nie ponosi odpowiedzialności za: uszkodzenia istniejące przed przyjęciem pojazdu; naturalne zużycie materiałów; " +
                "skutki ukrytych wad pojazdu; uszkodzenia elementów nietrwałych lub źle zamontowanych; opóźnienia wynikające z siły wyższej."
        ],
        [
            "§6. Odbiór pojazdu",
            "Klient zobowiązany jest do odbioru pojazdu w uzgodnionym terminie. Po upływie 7 dni od zakończenia prac i powiadomienia Klienta, " +
                "Wykonawca może naliczyć opłatę za postój pojazdu według uzgodnionej stawki dziennej, o ile przepisy prawa nie stanowią inaczej."
        ],
        [
            "§7. Reklamacje",
            "Reklamacje należy zgłosić niezwłocznie, nie później niż w terminie 48 godzin od odbioru pojazdu, w formie umożliwiającej dokumentację (np. e-mail, wiadomość WhatsApp) " +
                "wraz ze zdjęciami. Wykonawca rozpatruje reklamację w terminie do 14 dni roboczych."
        ],
        [
            "§8. Anulowanie i zmiana terminu",
            "Zmiana lub odwołanie terminu jest możliwa najpóźniej 24 godziny przed planowaną realizacją. " +
                "Późniejsze odwołanie może skutkować opłatą rezerwacyjną do 30% wartości zamówienia."
        ],
        [
            "§9. Dane osobowe",
            "Dane Klienta przetwarzane są wyłącznie w celu realizacji usługi, kontaktu i rozliczeń, zgodnie z obowiązującymi przepisami o ochronie danych osobowych (RODO)."
        ],
        [
            "§10. Postanowienia końcowe",
            "W sprawach nieuregulowanych zastosowanie mają przepisy prawa holenderskiego oraz — w stosunku do konsumentów — bezwzględnie obowiązujące przepisy prawa kraju zamieszkania konsumenta, jeśli dają mu one szerszą ochronę. " +
                "Regulamin wchodzi w życie z dniem publikacji na stronie internetowej Wykonawcy."
        ]
    ];

    for (const [title, body] of sections) {
        b.heading(title);
        b.paragraph(body);
    }

    b.heading("Kontakt");
    b.paragraph("Car All Detailing | Karol Zagórski | Maarssen (NL)");
    b.paragraph("Instagram: @cjaab99 | WhatsApp: +48 731 693 089");
    b.paragraph(`Data ostatniej aktualizacji: ${new Date().toLocaleDateString("pl-PL")}`);

    return b;
}

async function main() {
    const logoPdf = path.join(__dirname, "logo-pdf.png");
    const logoPath = fs.existsSync(logoPdf) ? logoPdf : path.join(root, "logo1.png");
    const logoBytes = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;

    const protokol = await buildProtokol(logoBytes);
    const regulamin = await buildRegulamin(logoBytes);

    await protokol.save(path.join(root, "protokol-wzor.pdf"));
    await regulamin.save(path.join(root, "regulamin.pdf"));

    console.log("Wygenerowano: protokol-wzor.pdf, regulamin.pdf");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
