function cadT(key, replacements) {
    const value = window.CAD_Features?.t(key) || key;
    if (!replacements) return value;
    return Object.entries(replacements).reduce((text, [name, replacement]) => {
        return text.replaceAll(`{${name}}`, replacement);
    }, value);
}

function cadTranslate(value) {
    return window.CAD_Features?.translateStatic(value) || value;
}

function setGreeting() {
    const hour = new Date().getHours();
    const greetingElement = document.getElementById("greeting-text");
    if (!greetingElement) return;

    if (hour >= 5 && hour < 12) greetingElement.innerText = cadT("greetingMorning");
    else if (hour >= 12 && hour < 18) greetingElement.innerText = cadT("greetingAfternoon");
    else if (hour >= 18 && hour < 22) greetingElement.innerText = cadT("greetingEvening");
    else greetingElement.innerText = cadT("greetingNight");
}

function generateOfferPDF() {
    const sizeSelect = document.getElementById("car-size");
    const selectedSize = sizeSelect ? sizeSelect.options[sizeSelect.selectedIndex].text : "-";
    const selectedCarModel = document.getElementById("selected-car-model")?.dataset.model || "";
    const selectedServices = document.querySelectorAll(".service:checked");
    const totalNode = document.getElementById("res-gross");
    const totalEur = totalNode ? (totalNode.getAttribute("data-eur-total") || totalNode.innerText) : "0";
    const total = window.CAD_Features
        ? window.CAD_Features.formatMoney(parseInt(totalEur, 10) || 0)
        : `${totalEur} €`;

    if (selectedServices.length === 0) {
        alert(cadT("pdfChooseServices"));
        return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    let rows = "";
    selectedServices.forEach((s) => {
        const row = s.closest(".service-item");
        if (!row) return;
        const name = row.querySelector(".service-name")?.innerText || cadT("quoteServiceFallback");
        const price = row.querySelector(".service-price")?.innerText || "-";
        rows += `
            <tr>
                <td>${name}</td>
                <td class="price-cell">${price}</td>
            </tr>`;
    });

    let content = `
        <html>
        <head>
            <title>${cadT("pdfTitle")}</title>
            <style>
                :root { --gold: #d4af37; --dark: #090909; --ink: #1b1813; --muted: #686052; --soft: #f7f2e6; }
                * { box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; color: var(--ink); line-height: 1.55; background: #fff; }
                .page { max-width: 820px; margin: 0 auto; padding: 0 34px 30px; }
                .header { margin: 0 -34px 30px; padding: 28px 34px 24px; display: flex; align-items: center; gap: 24px; background: radial-gradient(circle at 18% 0%, rgba(212,175,55,.28), transparent 36%), linear-gradient(145deg, #090909, #181818); border-bottom: 4px solid var(--gold); color: #fff; }
                .header img { width: 92px; height: 92px; object-fit: contain; flex-shrink: 0; filter: drop-shadow(0 12px 22px rgba(0,0,0,.45)); }
                .header-text { flex: 1; }
                .logo { font-size: 27px; font-weight: 800; color: #fff; letter-spacing: 2.5px; margin: 0; }
                .signature { color: var(--gold); font-size: 13px; margin: 3px 0 0; }
                .subheader { color: #cfc8b8; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-top: 8px; font-weight: 700; }
                .document-title { margin: 0 0 18px; font-size: 22px; letter-spacing: .5px; }
                .document-title::after { content: ""; display: block; width: 120px; height: 2px; margin-top: 10px; background: var(--gold); }
                .info-box { margin-bottom: 24px; font-size: 13px; color: var(--muted); background: var(--soft); padding: 16px 18px; border: 1px solid #e6dcc3; border-left: 5px solid var(--gold); }
                .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px 18px; }
                .info-grid p { margin: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; border: 1px solid #e6dcc3; }
                th { text-align: left; background: #111; color: #fff; padding: 13px 14px; border-bottom: 3px solid var(--gold); text-transform: uppercase; font-size: 11px; letter-spacing: 1.2px; }
                td { padding: 13px 14px; border-bottom: 1px solid #ece4d2; font-size: 13px; }
                tr:nth-child(even) td { background: #fbf8f0; }
                .price-cell { text-align: right; font-weight: 800; color: #4a3510; white-space: nowrap; }
                .total-section { text-align: right; margin-top: 28px; padding: 20px 24px; background: linear-gradient(135deg, #111, #222); color: #fff; border: 1px solid #3a321f; border-top: 4px solid var(--gold); }
                .total-label { font-size: 12px; color: #cfc8b8; text-transform: uppercase; letter-spacing: 1.6px; }
                .total-amount { font-size: 34px; color: var(--gold); font-weight: 900; display: block; margin-top: 6px; letter-spacing: .5px; }
                .note { margin-top: 18px; padding: 13px 15px; background: #fbf8f0; border: 1px solid #ece4d2; color: var(--muted); font-size: 12px; }
                .footer { margin-top: 34px; font-size: 10.5px; color: #888; text-align: center; border-top: 1px solid #e6dcc3; padding-top: 16px; }
                @media print { .page { padding: 0 28px 24px; } .header { margin-left: -28px; margin-right: -28px; } }
            </style>
        </head>
        <body>
            <div class="page">
            <div class="header">
                <img src="${document.body.classList.contains("cad-app-quote") ? "../logo1.png" : "logo1.png"}" alt="Car All Detailing">
                <div class="header-text">
                    <h1 class="logo">CAR ALL DETAILING</h1>
                    <p class="signature">by Karol Zagórski</p>
                    <div class="subheader">${cadT("pdfSubtitle")}</div>
                </div>
            </div>

            <h2 class="document-title">${cadT("pdfDocumentTitle")}</h2>
            
            <div class="info-box">
                <div class="info-grid">
                    <p><strong>${cadT("pdfDate")}:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>${cadT("pdfVehicleSize")}:</strong> ${selectedSize}</p>
                    ${selectedCarModel ? `<p><strong>${cadT("pdfCarModel")}:</strong> ${selectedCarModel}</p>` : `<p><strong>${cadT("pdfCarModel")}:</strong> ${cadT("pdfCarModelMissing")}</p>`}
                    <p><strong>${cadT("pdfStatus")}:</strong> ${cadT("pdfStatusValue")}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>${cadT("pdfService")}</th>
                        <th style="text-align: right;">${cadT("pdfEstimatedPrice")}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="total-section">
                <span class="total-label">${cadT("pdfTotal")}</span>
                <span class="total-amount">${total}</span>
            </div>

            <div class="note">
                ${cadT("pdfNote")}
            </div>

            <div class="footer">
                <p>${cadT("pdfFooter1")}</p>
                <p>${cadT("pdfFooter2")}</p>
                <p><strong>CAR ALL DETAILING</strong> | www.cjaab.github.io/cennik.github.io</p>
            </div>
            </div>
        </body>
        </html>`;

    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(content);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
    }, 500);
}

document.addEventListener("DOMContentLoaded", () => {
    let currentTotal = 0;

    const sizeSelect = document.getElementById("car-size");
    const services = Array.from(document.querySelectorAll(".service"));
    const logoImg = document.querySelector(".main-logo");
    const logoContainer = document.querySelector(".logo-container");
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const resGrossElement = document.getElementById("res-gross");
    const promoBar = document.getElementById("promo-bar");
    const promoText = document.getElementById("promo-text");
    const promoCloseBtn = document.getElementById("promo-close-btn");
    const upsellEl = document.getElementById("upsell-suggestion");
    const carModelPanel = document.getElementById("car-model-panel");
    const carModelList = document.getElementById("car-model-list");
    const customCarModelInput = document.getElementById("custom-car-model");
    const selectedCarModelEl = document.getElementById("selected-car-model");
    const storageKey = (window.CAD_CONFIG && window.CAD_CONFIG.storageKeys.calculator) || "cad_calculator_state_v2";
    let selectedCarModel = "";
    let currentWeatherAssessment = null;
    const weatherSensitiveServices = new Set(["ext-basic", "full-combo", "showroom", "clay-deiron", "premiumWax", "quickWax", "engine-bay"]);
    const interiorFriendlyServices = new Set(["int-basic", "deep-clean", "leather-clean", "steering-wheel", "boneting-seats", "boneting-full", "pet-hair"]);

    const carModelsBySize = {
        S: [
            "Fiat 500", "Fiat Panda", "Toyota Aygo", "Toyota Yaris", "VW Up!", "VW Polo", "Mini Cooper", "Renault Clio",
            "Opel Corsa", "Peugeot 208", "Hyundai i10", "Hyundai i20", "Kia Picanto", "Kia Rio", "Suzuki Swift",
            "Nissan Micra", "Mazda 2", "Ford Fiesta", "Citroen C1", "Citroen C3", "Seat Ibiza", "Skoda Fabia",
            "Honda Jazz", "Mitsubishi Space Star", "Dacia Sandero", "Smart Fortwo", "Smart Forfour", "Audi A1",
            "Alfa Romeo MiTo", "Lancia Ypsilon", "MG 3", "Abarth 595", "Renault Twingo", "Peugeot 108", "Suzuki Ignis"
        ],
        M: [
            "VW Golf", "VW T-Roc", "Audi A3", "Toyota Corolla", "Toyota C-HR", "Ford Focus", "Skoda Octavia",
            "BMW Seria 1", "BMW Seria 2", "Mercedes Klasa A", "Mercedes CLA", "Kia Ceed", "Kia XCeed",
            "Hyundai i30", "Hyundai Kona", "Seat Leon", "Cupra Leon", "Opel Astra", "Peugeot 308", "Renault Megane",
            "Nissan Qashqai", "Mazda 3", "Honda Civic", "Volvo V40", "Volvo XC40", "Lexus CT", "Dacia Duster",
            "Citroen C4", "Fiat Tipo", "Mini Countryman", "Subaru Impreza", "Mitsubishi ASX", "Suzuki Vitara",
            "MG ZS", "Tesla Model 3", "Polestar 2"
        ],
        L: [
            "Audi A4", "Audi A5", "Audi A6", "BMW Seria 3", "BMW Seria 4", "BMW Seria 5", "Mercedes Klasa C",
            "Mercedes Klasa E", "VW Passat", "VW Arteon", "Skoda Superb", "Toyota Camry", "Toyota Prius",
            "Ford Mondeo", "Opel Insignia", "Peugeot 508", "Renault Talisman", "Mazda 6", "Honda Accord",
            "Volvo S60", "Volvo V60", "Volvo S90", "Volvo V90", "Lexus IS", "Lexus ES", "Lexus GS",
            "Jaguar XE", "Jaguar XF", "Alfa Romeo Giulia", "Kia Stinger", "Hyundai Ioniq 5", "Hyundai Ioniq 6",
            "Tesla Model S", "Porsche Taycan", "Polestar 3"
        ],
        XL: [
            "BMW X3", "BMW X4", "BMW X5", "BMW X6", "Audi Q3", "Audi Q5", "Audi Q7", "Audi Q8",
            "Mercedes GLC", "Mercedes GLE", "Mercedes GLS", "Volvo XC60", "Volvo XC90", "VW Tiguan",
            "VW Touareg", "Toyota RAV4", "Toyota Highlander", "Kia Sportage", "Kia Sorento", "Hyundai Tucson",
            "Hyundai Santa Fe", "Nissan X-Trail", "Mazda CX-5", "Mazda CX-60", "Honda CR-V", "Lexus NX",
            "Lexus RX", "Range Rover Evoque", "Range Rover Sport", "Land Rover Discovery Sport", "Porsche Macan",
            "Porsche Cayenne", "Tesla Model Y", "Tesla Model X", "Skoda Kodiaq", "Seat Tarraco", "Ford Kuga",
            "Jeep Grand Cherokee", "Peugeot 5008", "Renault Espace"
        ],
        XXL: [
            "Mercedes Sprinter", "Mercedes Vito", "Mercedes V-Klasse", "VW Transporter", "VW Multivan", "VW Crafter",
            "Ford Transit", "Ford Tourneo Custom", "Renault Trafic", "Renault Master", "Opel Vivaro", "Opel Movano",
            "Peugeot Boxer", "Peugeot Expert", "Peugeot Traveller", "Citroen Jumper", "Citroen Jumpy", "Citroen SpaceTourer",
            "Fiat Ducato", "Fiat Talento", "Nissan NV300", "Nissan NV400", "Toyota Proace", "Toyota Proace Verso",
            "Iveco Daily", "MAN TGE", "Hyundai H1", "Hyundai Staria", "Dacia Jogger", "VW Caddy Maxi",
            "Ford Galaxy", "Ford S-Max", "Seat Alhambra", "VW Sharan", "Chrysler Pacifica", "Renault Grand Scenic",
            "Mercedes Citan Tourer", "Citroen Berlingo XL", "Peugeot Rifter Long", "Opel Combo Life XL"
        ]
    };

    const extBasic = document.getElementById("ext-basic");
    const intBasic = document.getElementById("int-basic");
    const fullCombo = document.getElementById("full-combo");
    const deepClean = document.getElementById("deep-clean");
    const showroom = document.getElementById("showroom");
    const leatherClean = document.getElementById("leather-clean");
    const bonetingSeats = document.getElementById("boneting-seats");
    const bonetingFull = document.getElementById("boneting-full");
    const premiumWax = document.getElementById("premiumWax");
    const quickWax = document.getElementById("quickWax");
    setGreeting();
    setupPromoBar();
    applyLightMobileMode();
    setupWeatherWidget();
    setupFAQAccordion();
    setupServiceDetailPanel();
    restoreCalculatorState();
    setupHeroParallax();
    setupThemeToggle();

    function setupPromoBar() {
        if (!promoBar || !promoText) return;

        const now = new Date();
        const promoStart = new Date("2026-05-01T00:00:00");
        const promoEnd = new Date("2026-05-31T23:59:59");
        const isPromoActive = now >= promoStart && now <= promoEnd;
        if (!isPromoActive) {
            promoBar.style.display = "none";
            return;
        }

        const promoDismissed = localStorage.getItem("cad_promo_dismissed") === "1";
        if (promoDismissed) {
            promoBar.style.display = "none";
            return;
        }

        const hasVisited = localStorage.getItem("cad_has_visited") === "1";
        if (!hasVisited) {
            promoText.innerHTML = cadT("promoFirstVisit");
            localStorage.setItem("cad_has_visited", "1");
        } else {
            promoText.innerHTML = cadT("promoReturn");
        }

        promoCloseBtn?.addEventListener("click", () => {
            promoBar.style.display = "none";
            localStorage.setItem("cad_promo_dismissed", "1");
        });
    }

    function applyLightMobileMode() {
        const isSmallScreen = window.matchMedia("(max-width: 900px)").matches;
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const isSaveData = navigator.connection && navigator.connection.saveData;
        const shouldUseLightMode = isSmallScreen || prefersReducedMotion || isSaveData;

        document.querySelectorAll("video").forEach((videoEl) => {
            if (shouldUseLightMode) {
                videoEl.pause();
                videoEl.querySelectorAll("source").forEach((source) => source.removeAttribute("src"));
                videoEl.load();
                return;
            }

            videoEl.querySelectorAll("source[data-src]").forEach((source) => {
                if (!source.getAttribute("src")) source.setAttribute("src", source.dataset.src);
            });
            videoEl.load();
            videoEl.play().catch(() => {});
        });

        if (shouldUseLightMode) document.body.classList.add("light-mobile-mode");
    }

    function setupFAQAccordion() {
        const faqItems = Array.from(document.querySelectorAll(".faq-grid details"));
        faqItems.forEach((item) => {
            item.addEventListener("toggle", () => {
                if (!item.open) return;
                faqItems.forEach((otherItem) => {
                    if (otherItem !== item) otherItem.open = false;
                });
            });
        });
    }

    function setupServiceDetailPanel() {
        const serviceProfiles = {
            "ext-basic": ["Świeższy wygląd z zewnątrz", "Auto po codziennym użytkowaniu", "Najlepsze przy dobrej pogodzie lub dostępie do osłoniętego miejsca"],
            "int-basic": ["Czystsze i przyjemniejsze wnętrze", "Kierowcy, rodziny, auta do codziennej jazdy", "Nie obejmuje głębokiego prania materiałów"],
            "full-combo": ["Kompletne odświeżenie auta", "Gdy chcesz ogarnąć środek i zewnętrze naraz", "Najprostszy wybór przy normalnym zabrudzeniu"],
            "deep-clean": ["Głębsze czyszczenie materiałów", "Plamy, zapachy i mocniej zabrudzone wnętrze", "Usługa zależna od stanu tapicerki"],
            "showroom": ["Najmocniejszy efekt wizualny", "Przed sprzedażą, wydarzeniem albo po zakupie auta", "Pakiet premium z większym zakresem pracy"],
            "leather-clean": ["Czystsza i mniej przesuszona skóra", "Skórzane fotele, boczki, podłokietniki", "Regularna pielęgnacja ogranicza pękanie i połysk od tłuszczu"],
            "steering-wheel": ["Lepszy chwyt i świeżość", "Najczęściej dotykany element auta", "Dobry mały dodatek do czyszczenia wnętrza"],
            "boneting-seats": ["Lekkie odświeżenie materiału", "Fotele bez ciężkich plam", "Szybsza alternatywa dla pełnego prania"],
            "boneting-full": ["Odświeżenie większej części wnętrza", "Materiały, boczki i delikatne elementy", "Zakres zależy od rodzaju materiału"],
            "clay-deiron": ["Gładszy lakier w dotyku", "Osady metaliczne, smoła, brud drogowy", "Dobry etap przed woskiem"],
            "premiumWax": ["Połysk i łatwiejsze mycie", "Auto po myciu lub oczyszczaniu lakieru", "Trwałość zależy od pogody i pielęgnacji"],
            "quickWax": ["Szybki połysk po myciu", "Gdy chcesz lekki efekt bez pełnego zabezpieczenia", "Dobry jako szybki dodatek"],
            "engine-bay": ["Czystsza komora silnika", "Przed sprzedażą lub po długim czasie bez czyszczenia", "Pracuję ostrożnie przy elektronice i wrażliwych elementach"],
            "pet-hair": ["Mniej sierści w tapicerce i dywanikach", "Auta po psie lub kocie", "Czas zależy od ilości sierści i rodzaju materiału"]
        };

        const closePreview = (card) => {
            const preview = card.querySelector(".service-hover-preview");
            if (preview) preview.remove();
            card.classList.remove("service-preview-open");
        };

        const closeOtherPreviews = (activeCard) => {
            document.querySelectorAll(".service-item.service-preview-open").forEach((card) => {
                if (card !== activeCard) closePreview(card);
            });
        };

        const renderPanel = (card) => {
            const input = card.querySelector(".service");
            const name = card.querySelector(".service-name")?.innerText.trim() || cadT("selectedServiceFallback");
            const price = card.querySelector(".service-price")?.innerText.trim() || "";
            const description = card.dataset.tip || cadT("serviceDescriptionFallback");
            const profile = serviceProfiles[input?.id] || ["Lepszy wygląd i świeżość auta", "Gdy ta usługa pasuje do stanu pojazdu", "Zakres potwierdzam po obejrzeniu auta"];
            const isDisabled = input?.disabled;

            closeOtherPreviews(card);
            let preview = card.querySelector(".service-hover-preview");
            if (!preview) {
                preview = document.createElement("div");
                preview.className = "service-hover-preview";
                card.appendChild(preview);
            }

            preview.innerHTML = `
                <div class="service-detail-panel__icon" aria-hidden="true"><i class="${getServiceIcon(input?.id)}"></i></div>
                <div class="service-detail-panel__content">
                    <span>${isDisabled ? cadT("servicePreparing") : cadT("servicePreview")}${price ? ` • ${price}` : ""}</span>
                    <strong>${name}</strong>
                    <p>${description}</p>
                    <div class="service-detail-panel__chips">
                        <small>${cadT("effectLabel")}: ${cadTranslate(profile[0])}</small>
                        <small>${cadT("fitLabel")}: ${cadTranslate(profile[1])}</small>
                        <small>${cadT("noteLabel")}: ${cadTranslate(profile[2])}</small>
                    </div>
                </div>
            `;
            card.classList.add("service-preview-open");
        };

        document.querySelectorAll(".service-item").forEach((card) => {
            card.addEventListener("mouseenter", () => {
                if (!window.matchMedia("(pointer: coarse)").matches) renderPanel(card);
            });
            card.addEventListener("focusin", () => renderPanel(card));
            card.addEventListener("click", () => renderPanel(card));
            card.addEventListener("mouseleave", () => {
                if (!window.matchMedia("(pointer: coarse)").matches) closePreview(card);
            });
        });

        document.addEventListener("click", (event) => {
            if (event.target.closest(".service-item")) return;
            closeOtherPreviews(null);
        });
    }

    function getServiceIcon(id) {
        if (id === "int-basic" || id === "boneting-seats" || id === "boneting-full" || id === "pet-hair") return "fas fa-couch";
        if (id === "leather-clean" || id === "steering-wheel") return "fas fa-hand-sparkles";
        if (id === "premiumWax" || id === "quickWax" || id === "clay-deiron") return "fas fa-star";
        if (id === "engine-bay") return "fas fa-gears";
        if (id === "showroom") return "fas fa-gem";
        return "fas fa-spray-can";
    }

    async function setupWeatherWidget() {
        const widget = document.getElementById("weather-widget");
        const daysContainer = document.getElementById("weather-days");
        const statusEl = document.getElementById("weather-status");
        const mainIcon = document.getElementById("weather-main-icon");
        const weatherConfig = window.CAD_CONFIG && window.CAD_CONFIG.weather;
        if (!widget || !daysContainer || !statusEl || !weatherConfig) return;
        if (weatherConfig.enabled === false) {
            widget.style.display = "none";
            return;
        }
        setupWeatherToggle(widget);

        const latitude = Number(weatherConfig.latitude);
        const longitude = Number(weatherConfig.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 7000);
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
            timezone: "auto",
            forecast_days: "3"
        });

        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
                signal: controller.signal
            });
            if (!response.ok) throw new Error("Weather request failed");
            const data = await response.json();
            const forecast = normalizeWeatherForecast(data);
            if (!forecast.length) throw new Error("Weather data unavailable");

            renderWeatherForecast(forecast, daysContainer, statusEl, mainIcon, weatherConfig.locationName || "Maarssen");
        } catch (error) {
            renderWeatherFallback(daysContainer, statusEl, mainIcon);
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    function setupWeatherToggle(widget) {
        const toggleBtn = document.getElementById("weather-toggle");
        if (!toggleBtn) return;
        if (toggleBtn.dataset.weatherToggleBound) return;
        toggleBtn.dataset.weatherToggleBound = "1";

        const setOpen = (isOpen) => {
            widget.classList.toggle("weather-widget--collapsed", !isOpen);
            toggleBtn.setAttribute("aria-expanded", String(isOpen));
        };

        toggleBtn.addEventListener("click", () => {
            setOpen(widget.classList.contains("weather-widget--collapsed"));
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") setOpen(false);
        });

        document.addEventListener("click", (event) => {
            if (widget.contains(event.target)) return;
            setOpen(false);
        });
    }

    function normalizeWeatherForecast(data) {
        const daily = data && data.daily;
        if (!daily || !Array.isArray(daily.time)) return [];

        return daily.time.slice(0, 3).map((date, index) => ({
            date,
            index,
            code: Number(daily.weather_code?.[index] ?? 0),
            tempMax: Math.round(Number(daily.temperature_2m_max?.[index] ?? 0)),
            tempMin: Math.round(Number(daily.temperature_2m_min?.[index] ?? 0)),
            rainChance: Math.round(Number(daily.precipitation_probability_max?.[index] ?? 0)),
            wind: Math.round(Number(daily.wind_speed_10m_max?.[index] ?? 0))
        }));
    }

    function renderWeatherForecast(forecast, daysContainer, statusEl, mainIcon, locationName) {
        const assessed = forecast.map((day) => ({ ...day, ...assessDetailingWeather(day) }));
        const mainDay = assessed[0];
        const cautionDays = assessed.filter((day) => day.tone !== "good").length;
        currentWeatherAssessment = mainDay;

        statusEl.textContent = buildWeatherSummary(mainDay, cautionDays, locationName);
        if (mainIcon) mainIcon.innerHTML = `<i class="${getWeatherIcon(mainDay.code)}" aria-hidden="true"></i>`;

        daysContainer.innerHTML = assessed.map((day) => `
            <article class="weather-day weather-day--${day.tone}">
                <span>${formatWeatherDay(day.date, day.index)}</span>
                <strong>${day.tempMin}° / ${day.tempMax}°</strong>
                <small>${day.label}</small>
                <em>${cadT("rainLabel")} ${day.rainChance}% • ${cadT("windLabel")} ${day.wind} km/h</em>
            </article>
        `).join("");
        updateWeatherServiceAdvice();
    }

    function renderWeatherFallback(daysContainer, statusEl, mainIcon) {
        currentWeatherAssessment = { tone: "caution", label: cadT("weatherForecastUnavailable") };
        statusEl.textContent = cadT("weatherFallbackStatus");
        if (mainIcon) mainIcon.innerHTML = '<i class="fas fa-cloud" aria-hidden="true"></i>';
        daysContainer.innerHTML = `
            <article class="weather-day weather-day--caution">
                <span>${cadT("forecast")}</span>
                <strong>--°</strong>
                <small>${cadT("temporarilyUnavailable")}</small>
                <em>${cadT("weatherFallbackNote")}</em>
            </article>
        `;
        updateWeatherServiceAdvice();
    }

    function updateWeatherServiceAdvice() {
        const adviceEl = document.getElementById("weather-service-advice");
        if (!adviceEl) return;

        if (!currentWeatherAssessment || currentWeatherAssessment.tone === "good") {
            adviceEl.className = "weather-service-advice";
            adviceEl.innerHTML = "";
            return;
        }

        const selected = services.filter((service) => service.checked);
        const hasWeatherSensitiveService = selected.some((service) => weatherSensitiveServices.has(service.id));
        const hasInteriorService = selected.some((service) => interiorFriendlyServices.has(service.id));
        const isBadWeather = currentWeatherAssessment.tone === "bad";
        const icon = isBadWeather ? "fa-triangle-exclamation" : "fa-cloud-sun-rain";
        let message;

        if (hasWeatherSensitiveService) {
            message = isBadWeather
                ? cadT("weatherAdviceBadExterior")
                : cadT("weatherAdviceCautionExterior");
        } else if (hasInteriorService) {
            message = cadT("weatherAdviceInterior");
        } else {
            message = cadT("weatherAdviceDefault");
        }

        adviceEl.className = `weather-service-advice show weather-service-advice--${currentWeatherAssessment.tone}`;
        adviceEl.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i><span>${message}</span>`;
    }

    function assessDetailingWeather(day) {
        const rainyCode = day.code >= 51 && day.code <= 82;
        const stormOrSnow = day.code >= 85 || day.code === 95 || day.code === 96 || day.code === 99;
        if (stormOrSnow || day.rainChance >= 70 || day.wind >= 42 || day.tempMax <= 4) {
            return {
                tone: "bad",
                label: cadT("weatherBadLabel")
            };
        }
        if (rainyCode || day.rainChance >= 40 || day.wind >= 30 || day.tempMax <= 8) {
            return {
                tone: "caution",
                label: cadT("weatherCautionLabel")
            };
        }
        return {
            tone: "good",
            label: cadT("weatherGoodLabel")
        };
    }

    function buildWeatherSummary(day, cautionDays, locationName) {
        if (day.tone === "good" && cautionDays === 0) {
            return cadT("weatherGoodSummary", { location: locationName });
        }
        if (day.tone === "bad") {
            return cadT("weatherBadSummary", { location: locationName });
        }
        return cadT("weatherCautionSummary", { location: locationName });
    }

    function formatWeatherDay(dateString, index) {
        const locale = window.CAD_Features?.getLocale() === "nl" ? "nl-NL" : "pl-PL";
        if (index === 0) return cadT("today");
        if (index === 1) return cadT("tomorrow");
        return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(dateString));
    }

    function getWeatherIcon(code) {
        if (code === 0) return "fas fa-sun";
        if (code <= 3) return "fas fa-cloud-sun";
        if (code === 45 || code === 48) return "fas fa-smog";
        if (code >= 51 && code <= 82) return "fas fa-cloud-rain";
        if (code >= 85 && code <= 86) return "fas fa-snowflake";
        if (code >= 95) return "fas fa-bolt";
        return "fas fa-cloud";
    }

    function renderUpsellSuggestion(currentTotal, sizeValue) {
        if (!upsellEl) return;
        if (fullCombo?.checked || showroom?.checked) {
            upsellEl.classList.remove("show");
            upsellEl.innerHTML = "";
            return;
        }
        const comboPriceRaw = fullCombo?.getAttribute(`data-${sizeValue.toLowerCase()}`);
        const showroomPriceRaw = showroom?.getAttribute(`data-${sizeValue.toLowerCase()}`);
        const comboPrice = comboPriceRaw ? parseFloat(comboPriceRaw) : null;
        const showroomPrice = showroomPriceRaw ? parseFloat(showroomPriceRaw) : null;

        if (comboPrice && !fullCombo?.checked && currentTotal > comboPrice) {
            const diff = Math.round(currentTotal - comboPrice);
            upsellEl.innerHTML = cadT("upsellCombo", { diff });
            upsellEl.classList.add("show");
            return;
        }

        if (showroomPrice && !showroom?.checked && currentTotal > showroomPrice) {
            const diff = Math.round(currentTotal - showroomPrice);
            upsellEl.innerHTML = cadT("upsellShowroom", { diff });
            upsellEl.classList.add("show");
            return;
        }

        upsellEl.classList.remove("show");
        upsellEl.innerHTML = "";
    }

    function persistCalculatorState() {
        if (!sizeSelect) return;
        const selectedServiceIds = services.filter((el) => el.checked && el.id).map((el) => el.id);
        const state = {
            size: sizeSelect.value,
            carModel: selectedCarModel,
            selectedServiceIds,
            totalEur: parseInt(document.getElementById("res-gross")?.getAttribute("data-eur-total") || "0", 10) || 0,
            ts: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(state));
        try {
            if (window.parent !== window) {
                window.parent.postMessage({ type: "cad:quote-updated" }, "*");
            }
        } catch (e) {
            /* ignore */
        }
    }

    function updateSelectedCarModel(model) {
        selectedCarModel = (model || "").trim();
        if (!selectedCarModelEl) return;

        selectedCarModelEl.dataset.model = selectedCarModel;
        selectedCarModelEl.classList.toggle("has-model", !!selectedCarModel);
        selectedCarModelEl.textContent = selectedCarModel
            ? cadT("selectedCar", { model: selectedCarModel })
            : cadT("noCarSelected");
    }

    function notifyQuoteChanged() {
        persistCalculatorState();
        if (window.CAD_Features) {
            window.CAD_Features.updateWhatsAppLinks();
        }
    }

    function showCarModelPanel() {
        carModelPanel?.classList.add("is-visible");
    }

    function hideCarModelPanel() {
        carModelPanel?.classList.remove("is-visible");
    }

    function renderCarModelList(sizeValue, modelToKeep = selectedCarModel) {
        if (!carModelList) return;
        const models = carModelsBySize[sizeValue] || [];
        carModelList.innerHTML = "";

        models.forEach((model) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "car-model-option";
            button.textContent = model;
            button.dataset.model = model;
            if (model === modelToKeep) button.classList.add("active");

            button.addEventListener("click", () => {
                carModelList.querySelectorAll(".car-model-option").forEach((el) => el.classList.remove("active"));
                button.classList.add("active");
                if (customCarModelInput) customCarModelInput.value = "";
                updateSelectedCarModel(model);
                notifyQuoteChanged();
            });

            carModelList.appendChild(button);
        });

        const modelStillFits = models.includes(modelToKeep);
        if (!modelStillFits && customCarModelInput && customCarModelInput.value.trim() !== modelToKeep) {
            updateSelectedCarModel("");
        } else {
            updateSelectedCarModel(modelToKeep);
        }
    }

    function restoreCalculatorState() {
        if (!sizeSelect) return;
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.size) return;
            if (window.CAD_Features && !window.CAD_Features.validateCalculatorState(parsed, services)) {
                localStorage.removeItem(storageKey);
                return;
            }

            sizeSelect.value = parsed.size;
            selectedCarModel = typeof parsed.carModel === "string" ? parsed.carModel : "";
            document.querySelectorAll(".size-option").forEach((opt) => {
                const isActive = opt.getAttribute("data-value") === parsed.size;
                opt.classList.toggle("active", isActive);
            });
            hideCarModelPanel();

            services.forEach((checkbox) => {
                if (!checkbox.id) return;
                const shouldCheck = Array.isArray(parsed.selectedServiceIds) && parsed.selectedServiceIds.includes(checkbox.id);
                checkbox.checked = !!shouldCheck;
            });
        } catch (error) {
            localStorage.removeItem(storageKey);
        }
    }

    function setupHeroParallax() {
        const header = document.querySelector(".main-header");
        const headerContent = document.querySelector(".header-content");
        const headerVideo = document.querySelector(".header-bg-video");
        if (!header || !headerContent || !headerVideo) return;
        if (window.matchMedia("(pointer: coarse)").matches) return;

        const applyParallax = () => {
            const rect = header.getBoundingClientRect();
            if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
            const progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1);
            headerContent.style.transform = `translateY(${progress * 22}px)`;
            headerVideo.style.transform = `translate(-50%, calc(-50% + ${progress * 30}px)) scale(1.04)`;
        };

        window.addEventListener("scroll", () => window.requestAnimationFrame(applyParallax), { passive: true });
        applyParallax();
    }

    function syncServiceVisualState() {
        services.forEach((checkbox) => {
            const item = checkbox.closest(".service-item");
            if (!item) return;
            const isChecked = checkbox.checked;
            item.classList.toggle("service-active", isChecked);

            if (isChecked) {
                item.classList.remove("service-pop");
                void item.offsetWidth;
                item.classList.add("service-pop");
            } else {
                item.classList.remove("service-pop");
            }
        });
    }

    function triggerServiceCheckEffect(checkbox) {
        const item = checkbox.closest(".service-item");
        if (!item || !checkbox.checked) return;
        item.classList.remove("service-check-burst");
        void item.offsetWidth;
        item.classList.add("service-check-burst");
        window.setTimeout(() => item.classList.remove("service-check-burst"), 480);
    }


    function getDisplayValue(eurValue) {
        if (window.CAD_Features) return window.CAD_Features.toDisplayAmount(eurValue);
        return Math.round(eurValue);
    }

    function animatePrice(endValue) {
        if (!resGrossElement) return;
        const startValue = getDisplayValue(currentTotal);
        const endDisplay = getDisplayValue(endValue);
        const duration = 650;
        let startTimestamp = null;
        resGrossElement.classList.add("price-flip");

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const calculatedVal = Math.floor(progress * (endDisplay - startValue) + startValue);
            resGrossElement.innerText = calculatedVal;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                resGrossElement.innerText = endDisplay;
                resGrossElement.setAttribute("data-eur-total", String(Math.round(endValue)));
                currentTotal = endValue;
                setTimeout(() => resGrossElement.classList.remove("price-flip"), 180);
            }
        };
        window.requestAnimationFrame(step);
    }

    function calculate() {
        if (!sizeSelect) return;
        const currentSize = sizeSelect.value;
        let total = 0;

        services.forEach((checkbox) => {
            if (checkbox.checked) {
                const sizePrice = checkbox.getAttribute(`data-${currentSize.toLowerCase()}`);
                const staticPrice = checkbox.getAttribute("data-static");
                total += sizePrice ? parseFloat(sizePrice) : (staticPrice ? parseFloat(staticPrice) : 0);
            }
        });

        animatePrice(Math.round(total));
        renderUpsellSuggestion(total, currentSize);
        updateWeatherServiceAdvice();
        persistCalculatorState();
        syncServiceVisualState();
        if (window.CAD_Features) {
            window.CAD_Features.updateWhatsAppLinks();
            window.CAD_Features.trackEvent("calculator_update", { total: Math.round(total), size: currentSize });
        }
    }

    function handleExclusions(e) {
        const target = e.target;
        if (!target || !target.checked) {
            calculate();
            return;
        }

        const uncheck = (elements) => {
            elements.forEach((el) => {
                if (el && el !== target) el.checked = false;
            });
        };

        // Showroom = najwyższy pakiet, wyklucza wszystkie główne i wnętrzowe alternatywy.
        if (target === showroom) {
            uncheck([extBasic, intBasic, fullCombo, deepClean, leatherClean, bonetingSeats, bonetingFull, premiumWax, quickWax]);
        }

        // COMBO to pakiet wnętrze+zewnątrz, więc wyklucza alternatywy wnętrza i pełny showroom.
        if (target === fullCombo) {
            uncheck([extBasic, intBasic, deepClean, bonetingSeats, bonetingFull, showroom]);
        }

        // Czyszczenie skóry to alternatywa dla prania/bonetowania materiałowej tapicerki.
        if (target === leatherClean) {
            uncheck([deepClean, bonetingSeats, bonetingFull, showroom, fullCombo]);
        }

        // Pranie ekstrakcyjne wyklucza bonetowanie i pakiety zawierające wnętrze.
        if (target === deepClean) {
            uncheck([intBasic, fullCombo, showroom, bonetingSeats, bonetingFull, leatherClean]);
        }

        // Bonetowanie full i seats to warianty tej samej usługi + kolizja z pakietami wnętrza.
        if (target === bonetingFull) {
            uncheck([bonetingSeats, deepClean, intBasic, fullCombo, showroom, leatherClean]);
        }
        if (target === bonetingSeats) {
            uncheck([bonetingFull, deepClean, intBasic, fullCombo, showroom, leatherClean]);
        }

        // Woski są alternatywne między sobą i niepotrzebne przy showroom.
        if (target === premiumWax) uncheck([quickWax, showroom]);
        if (target === quickWax) uncheck([premiumWax, showroom]);
        
        // Podstawowe mycia nie łączą się z gotowymi pakietami.
        if (target === extBasic || target === intBasic) {
            uncheck([fullCombo, showroom]);
        }

        calculate();
    }

    function setupThemeToggle() {
        const themeKey = "cad_theme_preference";
        const savedTheme = localStorage.getItem(themeKey);
        const initialTheme = savedTheme === "light" ? "light" : "dark";

        function applyTheme(theme) {
            const isLight = theme === "light";
            document.documentElement.classList.toggle("theme-light", isLight);
            document.body.classList.toggle("theme-light", isLight);
            if (themeToggleBtn) {
                themeToggleBtn.setAttribute("aria-pressed", String(isLight));
                const label = themeToggleBtn.querySelector(".float-action-copy small");
                const icon = themeToggleBtn.querySelector(".theme-toggle-icon i");
                if (label) label.textContent = isLight ? cadT("themeDarkTarget") : cadT("themeLightTarget");
                if (icon) icon.className = isLight ? "fas fa-moon" : "fas fa-sun";
            }
        }

        applyTheme(initialTheme);
        if (themeToggleBtn?.dataset.themeToggleBound) return;
        if (themeToggleBtn) themeToggleBtn.dataset.themeToggleBound = "1";

        themeToggleBtn?.addEventListener("click", () => {
            const nextTheme = document.body.classList.contains("theme-light") ? "dark" : "light";
            localStorage.setItem(themeKey, nextTheme);
            applyTheme(nextTheme);
            if (navigator.vibrate) navigator.vibrate(8);
        });
    }

    if (logoContainer && logoImg) {
        let logoEnergyTimer;

        logoContainer.addEventListener("mousemove", (e) => {
            if (window.matchMedia("(pointer: coarse)").matches) return;
            const rect = logoContainer.getBoundingClientRect();
            const relativeX = (e.clientX - rect.left) / rect.width;
            const relativeY = (e.clientY - rect.top) / rect.height;
            const x = (relativeX - 0.5) * 18;
            const y = (relativeY - 0.5) * -14;
            logoContainer.style.setProperty("--logo-glow-x", `${Math.round(relativeX * 100)}%`);
            logoContainer.style.setProperty("--logo-glow-y", `${Math.round(relativeY * 100)}%`);
            logoImg.style.transform = `rotateX(${y}deg) rotateY(${x}deg) scale(1.04)`;
        });

        logoContainer.addEventListener("mouseenter", () => {
            logoContainer.classList.remove("logo-energy");
            void logoContainer.offsetWidth;
            logoContainer.classList.add("logo-energy");
            clearTimeout(logoEnergyTimer);
            logoEnergyTimer = setTimeout(() => logoContainer.classList.remove("logo-energy"), 1300);
        });

        logoContainer.addEventListener("mouseleave", () => {
            logoContainer.style.setProperty("--logo-glow-x", "50%");
            logoContainer.style.setProperty("--logo-glow-y", "38%");
            logoImg.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
        });
    }

    services.forEach((s) => {
        s.addEventListener("change", handleExclusions);
        s.addEventListener("change", () => triggerServiceCheckEffect(s));
    });

    document.querySelectorAll(".size-option").forEach((opt) => {
        opt.addEventListener("click", function () {
            const val = this.getAttribute("data-value");
            const isSameSize = sizeSelect && sizeSelect.value === val && this.classList.contains("active");
            const isPanelVisible = carModelPanel?.classList.contains("is-visible");

            if (sizeSelect) {
                if (isSameSize) {
                    if (isPanelVisible) {
                        hideCarModelPanel();
                    } else {
                        showCarModelPanel();
                        renderCarModelList(val, selectedCarModel);
                    }
                    if (navigator.vibrate) navigator.vibrate(6);
                    return;
                }

                document.querySelectorAll(".size-option").forEach((o) => o.classList.remove("active"));
                this.classList.add("active");
                sizeSelect.value = val;
                showCarModelPanel();
                if (customCarModelInput) customCarModelInput.value = "";
                selectedCarModel = "";
                renderCarModelList(val, "");
                calculate();
                if (navigator.vibrate) navigator.vibrate(10);
            }
        });
    });

    if (sizeSelect) {
        sizeSelect.addEventListener("change", () => {
            showCarModelPanel();
            if (customCarModelInput) customCarModelInput.value = "";
            selectedCarModel = "";
            renderCarModelList(sizeSelect.value, "");
            calculate();
        });
    }

    customCarModelInput?.addEventListener("input", () => {
        carModelList?.querySelectorAll(".car-model-option").forEach((el) => el.classList.remove("active"));
        updateSelectedCarModel(customCarModelInput.value);
        notifyQuoteChanged();
    });

    document.querySelectorAll(".service-item").forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            if (window.matchMedia("(pointer: coarse)").matches) return;
            const rect = card.getBoundingClientRect();
            card.style.transform = `perspective(1000px) rotateX(${(e.clientY - rect.top - rect.height / 2) / 35}deg) rotateY(${(rect.width / 2 - (e.clientX - rect.left)) / 35}deg)`;
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
        });
    });

    const tagline = document.querySelector(".tagline");
    if (tagline) {
        const words = ["Premium Car Care", "Showroom Excellence", "Passion for Perfection"];
        let wordIdx = 0;
        let charIdx = 0;
        let isDeleting = false;
        function typeEffect() {
            const currentWord = words[wordIdx];
            const visible = currentWord.substring(0, charIdx);
            tagline.innerHTML = `${visible}<span style="opacity: 0">${currentWord.substring(charIdx)}</span>`;
            if (!isDeleting && charIdx < currentWord.length) charIdx++;
            else if (isDeleting && charIdx > 0) charIdx--;
            else if (!isDeleting && charIdx === currentWord.length) { isDeleting = true; setTimeout(typeEffect, 2000); return; }
            else { isDeleting = false; wordIdx = (wordIdx + 1) % words.length; }
            setTimeout(typeEffect, isDeleting ? 50 : 100);
        }
        typeEffect();
    }

    document.querySelectorAll(".knowledge-accordion details").forEach((item) => {
        item.querySelector("summary")?.addEventListener("click", () => {
            if (!item.hasAttribute("open") && navigator.vibrate) navigator.vibrate(5);
        });
    });

    document.addEventListener("cad:recalculate-display", calculate);
    document.addEventListener("cad:locale-change", () => {
        setGreeting();
        updateSelectedCarModel(selectedCarModel);
        renderUpsellSuggestion(currentTotal, sizeSelect?.value || "M");
        updateWeatherServiceAdvice();
        setupWeatherWidget();
        setupThemeToggle();
        window.CAD_Features?.updateWhatsAppLinks();
    });

    document.getElementById("download-offer-btn")?.addEventListener("click", () => {
        window.CAD_Features?.trackEvent("pdf_download_click");
    });

    document.querySelector(".book-btn")?.addEventListener("click", () => {
        window.CAD_Features?.trackEvent("calendly_book_click");
    });

    setupConnectAppInstall();

    calculate();
});

function setupConnectAppInstall() {
    const btn = document.getElementById("connect-app-btn");
    const modal = document.getElementById("site-install-modal");
    const goBtn = document.getElementById("site-install-go");
    if (!btn || !modal) return;

    const appUrl = btn.getAttribute("href") || "app/index.html?install=1";
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    function openModal() {
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const androidNote = document.getElementById("site-install-android");
        const iosNote = document.getElementById("site-install-ios");
        if (androidNote) androidNote.hidden = ios;
        if (iosNote) iosNote.hidden = !ios;
        modal.hidden = false;
        document.body.classList.add("site-install-open");
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("site-install-open");
    }

    function goToApp() {
        closeModal();
        window.location.href = appUrl;
    }

    if (isMobile) {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            openModal();
        });
    }

    goBtn?.addEventListener("click", goToApp);
    modal.querySelectorAll("[data-site-install-close]").forEach((el) => {
        el.addEventListener("click", closeModal);
    });
}
