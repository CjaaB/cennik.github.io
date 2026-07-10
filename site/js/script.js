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

function cadRefreshIcons(root) {
    window.CAD_Icons?.refresh(root || document);
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

    const rows = [];
    selectedServices.forEach((s) => {
        const row = s.closest(".service-item");
        if (!row) return;
        rows.push({
            name: row.querySelector(".service-name")?.innerText || cadT("quoteServiceFallback"),
            price: row.querySelector(".service-price")?.innerText || "-"
        });
    });

    const payload = {
        title: cadT("pdfTitle"),
        subtitle: cadT("pdfSubtitle"),
        fileName: "Car_All_Detailing_Wycena.pdf",
        dateLabel: cadT("pdfDate"),
        classLabel: cadT("pdfVehicleSize"),
        modelLabel: cadT("pdfCarModel"),
        serviceCol: cadT("pdfService"),
        priceCol: cadT("pdfEstimatedPrice"),
        totalLabel: cadT("pdfTotal"),
        statusLabel: cadT("pdfStatus"),
        statusValue: cadT("pdfStatusValue"),
        disclaimer: cadT("pdfNote"),
        footerLine: "CAR ALL DETAILING · Karol Zagórski · Maarssen, NL",
        date: new Date().toLocaleDateString("pl-PL"),
        sizeLabel: selectedSize,
        carModel: selectedCarModel,
        rows,
        totalText: total
    };

    if (!window.CAD_Documents?.printQuote) {
        alert(cadT("pdfPrintBlocked"));
        return;
    }
    window.CAD_Documents.printQuote(payload);
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
    let currentWeatherForecast = [];
    let currentWeatherLocation = "";
    let currentWeatherIsFallback = false;
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
    setupQuoteHub();
    setupCalcStickyBar();
    setupBrandCarousel();
    resetCalculatorOnLoad();
    setupHeroParallax();
    setupThemeToggle();

    function setupPromoBar() {
        if (promoBar) promoBar.style.display = "none";
        document.body.classList.remove("promo-bar-visible");
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
        else document.body.classList.remove("light-mobile-mode");
    }

    window.addEventListener("resize", applyLightMobileMode, { passive: true });
    window.addEventListener("orientationchange", () => {
        setTimeout(applyLightMobileMode, 150);
    }, { passive: true });

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

    function setupQuoteHub() {
        const panel = document.getElementById("quote-hub-panel");
        const teaser = document.getElementById("quote-hub-teaser");
        const toggleBtn = document.getElementById("quote-hub-toggle");
        const hub = document.getElementById("kalkulator");
        if (!panel || !hub) return;

        let outsideClickGuardUntil = 0;

        const isOpen = () => hub.classList.contains("is-open");

        const syncToggleUi = () => {
            if (!toggleBtn) return;
            const open = isOpen();
            const textEl = toggleBtn.querySelector(".quote-hub__toggle-text");
            const iconEl = toggleBtn.querySelector("i");
            toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
            toggleBtn.setAttribute("aria-label", open ? "Zwiń kalkulator" : "Rozwiń kalkulator");
            if (textEl) textEl.textContent = open ? "Zwiń" : "Rozwiń";
            if (iconEl) iconEl.className = open ? "fas fa-chevron-up" : "fas fa-chevron-down";
        };

        const openHub = ({ scroll = true } = {}) => {
            if (isOpen()) return;
            panel.hidden = false;
            panel.classList.remove("quote-hub__panel--closing");
            panel.classList.add("quote-hub__panel--opening");
            window.setTimeout(() => panel.classList.remove("quote-hub__panel--opening"), 420);
            if (teaser) {
                teaser.hidden = true;
                teaser.setAttribute("aria-expanded", "true");
            }
            document.body.classList.add("quote-hub-open");
            hub.classList.add("is-open");
            outsideClickGuardUntil = Date.now() + 380;
            syncToggleUi();
            if (scroll) {
                window.requestAnimationFrame(() => {
                    hub.scrollIntoView({ behavior: "smooth", block: "start" });
                });
            }
            window.syncCalcStickyBar?.();
            window.dispatchEvent(new CustomEvent("cad:quote-hub-change"));
        };

        const closeHub = () => {
            if (!isOpen()) return;
            panel.classList.add("quote-hub__panel--closing");
            window.setTimeout(() => {
                panel.hidden = true;
                panel.classList.remove("quote-hub__panel--closing");
            }, 220);
            if (teaser) {
                teaser.hidden = false;
                teaser.setAttribute("aria-expanded", "false");
            }
            document.body.classList.remove("quote-hub-open");
            hub.classList.remove("is-open");
            const bar = document.getElementById("calc-sticky-bar");
            if (bar) bar.hidden = true;
            document.body.classList.remove("has-calc-sticky");
            syncToggleUi();
            window.dispatchEvent(new CustomEvent("cad:quote-hub-change"));
        };

        const toggleHub = ({ scroll = false } = {}) => {
            if (isOpen()) closeHub();
            else openHub({ scroll });
        };

        document.querySelectorAll("[data-open-quote-hub]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isOpen() && !panel.contains(btn)) {
                    closeHub();
                    return;
                }
                openHub();
            });
        });

        toggleBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleHub({ scroll: !isOpen() });
        });

        document.addEventListener("click", (e) => {
            if (!isOpen()) return;
            if (Date.now() < outsideClickGuardUntil) return;
            const target = e.target;
            if (!(target instanceof Element)) return;
            if (hub.contains(target)) return;
            if (target.closest("[data-open-quote-hub]")) return;
            if (target.closest(".modal, .calendly-overlay, #calc-sticky-bar, .whatsapp-float")) return;
            closeHub();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && isOpen()) closeHub();
        });

        const hash = (location.hash || "").replace("#", "").toLowerCase();
        if (hash === "kalkulator" || hash === "quote" || hash === "calculator") {
            openHub({ scroll: false });
        }

        syncToggleUi();
        window.CAD_openQuoteHub = () => openHub();
        window.CAD_closeQuoteHub = () => closeHub();
        window.CAD_toggleQuoteHub = () => toggleHub();
    }

    function setupCalcStickyBar() {
        const bar = document.getElementById("calc-sticky-bar");
        const calc = document.querySelector(".calculator-container");
        const stickyTotal = document.getElementById("sticky-total");
        const stickyCurrency = document.getElementById("sticky-currency");
        const bookBtn = document.getElementById("sticky-book-btn");
        if (!bar || !calc) return;

        const syncSticky = () => {
            const gross = document.getElementById("res-gross");
            const sym = document.getElementById("currency-symbol");
            if (stickyTotal && gross) stickyTotal.textContent = gross.textContent;
            if (stickyCurrency && sym) stickyCurrency.textContent = sym.textContent;
        };
        window.syncCalcStickyBar = syncSticky;

        bookBtn?.addEventListener("click", () => {
            document.querySelector(".summary-card .book-btn")?.click();
        });

        const mqMobile = window.matchMedia("(max-width: 900px)");
        const isMobileView = () => mqMobile.matches || window.matchMedia("(pointer: coarse)").matches;

        const updateVisibility = () => {
            if (!isMobileView() || !document.body.classList.contains("quote-hub-open")) {
                bar.hidden = true;
                document.body.classList.remove("has-calc-sticky");
                return;
            }
            const rect = calc.getBoundingClientRect();
            const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 88;
            bar.hidden = !inView;
            document.body.classList.toggle("has-calc-sticky", inView);
            if (inView) syncSticky();
        };

        window.addEventListener("scroll", updateVisibility, { passive: true });
        window.addEventListener("resize", updateVisibility);
        document.addEventListener("cad:currency-change", syncSticky);
        document.addEventListener("cad:recalculate-display", syncSticky);
        window.visualViewport?.addEventListener("resize", updateVisibility);
        window.visualViewport?.addEventListener("scroll", updateVisibility);
        mqMobile.addEventListener("change", updateVisibility);
        window.addEventListener("cad:quote-hub-change", updateVisibility);
        updateVisibility();
        syncSticky();
    }

    function setupBrandCarousel() {
        const carousel = document.querySelector(".brand-story-carousel");
        const track = carousel?.querySelector(".brand-story-track");
        if (!carousel || !track || track.dataset.marqueeReady) return;
        track.dataset.marqueeReady = "1";

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reducedMotion) {
            carousel.classList.add("brand-story-carousel--manual");
            return;
        }

        Array.from(track.children).forEach((card) => {
            const clone = card.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            clone.querySelectorAll("img").forEach((img) => img.setAttribute("alt", ""));
            track.appendChild(clone);
        });

        const syncMarquee = () => {
            const half = track.scrollWidth / 2;
            const card = track.firstElementChild;
            const cardW = card ? card.getBoundingClientRect().width : 330;
            const duration = Math.max(36, Math.round((half / Math.max(cardW + 18, 1)) * 6.5));
            track.style.setProperty("--brand-scroll-end", `-${half}px`);
            track.style.setProperty("--brand-scroll-duration", `${duration}s`);
        };

        syncMarquee();
        window.addEventListener("resize", syncMarquee);
        track.classList.add("is-marquee-ready");

        carousel.addEventListener("mouseenter", () => carousel.classList.add("is-paused"));
        carousel.addEventListener("mouseleave", () => carousel.classList.remove("is-paused"));
        carousel.addEventListener("touchstart", () => carousel.classList.add("is-paused"), { passive: true });
        carousel.addEventListener("touchend", () => {
            window.setTimeout(() => carousel.classList.remove("is-paused"), 1200);
        }, { passive: true });
        carousel.addEventListener("focusin", () => carousel.classList.add("is-paused"));
        carousel.addEventListener("focusout", () => carousel.classList.remove("is-paused"));
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

        const isCoarse = window.matchMedia("(pointer: coarse)").matches;

        const closeAllPreviews = () => closeOtherPreviews(null);

        const bindPreviewDismiss = () => {
            const closeOnMove = () => closeAllPreviews();
            ["scroll", "touchmove", "wheel"].forEach((ev) => {
                window.addEventListener(ev, closeOnMove, { passive: true, capture: true });
                document.addEventListener(ev, closeOnMove, { passive: true, capture: true });
            });
            document.querySelectorAll(".services-selection, .quote-app-main, .calculator-container, .app-quote-scroll, .app-main").forEach((el) => {
                el.addEventListener("scroll", closeOnMove, { passive: true });
            });
        };
        bindPreviewDismiss();

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

            const closeBtn = isCoarse
                ? `<button type="button" class="service-preview-close" aria-label="Zamknij opis">×</button>`
                : "";

            preview.innerHTML = `
                ${closeBtn}
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
            cadRefreshIcons(preview);

            preview.querySelector(".service-preview-close")?.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                closePreview(card);
            });
        };

        document.querySelectorAll(".service-item").forEach((card) => {
            if (!isCoarse) {
                card.addEventListener("mouseenter", () => renderPanel(card));
                card.addEventListener("mouseleave", () => closePreview(card));
                card.addEventListener("focusin", () => renderPanel(card));
                card.addEventListener("click", () => renderPanel(card));
                return;
            }

            if (!card.querySelector(".service-info-btn")) {
                const infoBtn = document.createElement("button");
                infoBtn.type = "button";
                infoBtn.className = "service-info-btn";
                infoBtn.setAttribute("aria-label", cadT("serviceInfoAria") || "Pokaż opis usługi");
                infoBtn.innerHTML = '<i class="fas fa-circle-info" aria-hidden="true"></i>';
                card.appendChild(infoBtn);
                cadRefreshIcons(infoBtn);
                infoBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (card.classList.contains("service-preview-open")) {
                        closePreview(card);
                        return;
                    }
                    renderPanel(card);
                });
            }
        });

        document.addEventListener("click", (event) => {
            if (event.target.closest(".service-item")) return;
            closeAllPreviews();
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

    function isWeatherDesktop() {
        return window.matchMedia("(min-width: 901px)").matches;
    }

    function openWeatherModal() {
        const modal = document.getElementById("weatherModal");
        if (!modal) return;
        modal.style.display = "flex";
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        modal.querySelector("[data-weather-modal-close]")?.focus();
    }

    function closeWeatherModal() {
        const modal = document.getElementById("weatherModal");
        if (!modal) return;
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
        if (!document.querySelector('.modal-overlay[style*="flex"]')) {
            document.body.classList.remove("modal-open");
        }
        document.getElementById("weather-toggle")?.focus();
    }

    function getWeatherDayHint(tone) {
        const key = tone === "good" ? "weatherDayGood" : tone === "bad" ? "weatherDayBad" : "weatherDayCaution";
        return cadT(key);
    }

    function getWeatherToneLabel(tone) {
        const key = tone === "good" ? "weatherGoodLabel" : tone === "bad" ? "weatherBadLabel" : "weatherCautionLabel";
        return cadT(key);
    }

    function findBestExteriorDay(assessed) {
        const rank = { good: 0, caution: 1, bad: 2 };
        return [...assessed].sort((a, b) => rank[a.tone] - rank[b.tone] || a.index - b.index)[0];
    }

    function getWeatherGuideActions(mainDay, bestDay) {
        const bestLabel = formatWeatherDay(bestDay.date, bestDay.index);
        const prefix = mainDay.tone === "good" ? "weatherGuideGood" : mainDay.tone === "bad" ? "weatherGuideBad" : "weatherGuideCaution";
        const actions = [cadT(`${prefix}1`), cadT(`${prefix}2`, { day: bestLabel }), cadT(`${prefix}3`)];
        const icons =
            mainDay.tone === "good"
                ? ["fa-calendar-check", "fa-spray-can-sparkles", "fa-couch"]
                : mainDay.tone === "bad"
                  ? ["fa-couch", "fa-calendar-day", "fa-brands fa-whatsapp"]
                  : ["fa-clock", "fa-car-side", "fa-couch"];
        return actions.map((text, index) => ({ text, icon: `fas ${icons[index]}` }));
    }

    function getWeatherSelectionNote() {
        if (!currentWeatherAssessment || currentWeatherAssessment.tone === "good") return "";

        const selected = services.filter((service) => service.checked);
        if (!selected.length) return "";

        const hasWeatherSensitiveService = selected.some((service) => weatherSensitiveServices.has(service.id));
        const hasInteriorService = selected.some((service) => interiorFriendlyServices.has(service.id));
        const isBadWeather = currentWeatherAssessment.tone === "bad";

        if (hasWeatherSensitiveService) {
            return isBadWeather ? cadT("weatherAdviceBadExterior") : cadT("weatherAdviceCautionExterior");
        }
        if (hasInteriorService) return cadT("weatherAdviceInterior");
        return cadT("weatherAdviceDefault");
    }

    function buildWeatherGuideHtml(assessed, mainDay, locationName, isFallback = false) {
        if (isFallback) {
            return `
            <div class="weather-guide weather-guide--caution">
                <p class="weather-guide__summary">${cadT("weatherFallbackStatus")}</p>
                <h4 class="weather-guide__title">${cadT("weatherGuideTitle")}</h4>
                <ul class="weather-guide__list">
                    <li><i class="fas fa-message" aria-hidden="true"></i><span>${cadT("weatherGuideFallback1")}</span></li>
                    <li><i class="fas fa-couch" aria-hidden="true"></i><span>${cadT("weatherGuideFallback2")}</span></li>
                </ul>
            </div>`;
        }

        const summaryKey = `weather${mainDay.tone.charAt(0).toUpperCase() + mainDay.tone.slice(1)}Summary`;
        const bestDay = findBestExteriorDay(assessed);
        const actions = getWeatherGuideActions(mainDay, bestDay);
        const selectionNote = getWeatherSelectionNote();

        return `
            <div class="weather-guide weather-guide--${mainDay.tone}">
                <p class="weather-guide__summary">${cadT(summaryKey, { location: locationName })}</p>
                <h4 class="weather-guide__title">${cadT("weatherGuideTitle")}</h4>
                <ul class="weather-guide__list">
                    ${actions.map((action) => `<li><i class="${action.icon}" aria-hidden="true"></i><span>${action.text}</span></li>`).join("")}
                </ul>
                ${selectionNote ? `<p class="weather-guide__selection"><i class="fas fa-circle-info" aria-hidden="true"></i><span>${selectionNote}</span></p>` : ""}
            </div>`;
    }

    function renderWeatherGuide(assessed, mainDay, locationName, isFallback = false) {
        const guideHtml = buildWeatherGuideHtml(assessed, mainDay, locationName, isFallback);
        const guideEl = document.getElementById("weather-guide");
        const modalGuideEl = document.getElementById("weather-modal-guide");
        const adviceEl = document.getElementById("weather-service-advice");

        [guideEl, modalGuideEl].forEach((el) => {
            if (!el) return;
            el.innerHTML = guideHtml;
            el.hidden = false;
        });

        const selectionNote = getWeatherSelectionNote();
        if (adviceEl) {
            if (selectionNote) {
                adviceEl.className = `weather-service-advice show weather-service-advice--${mainDay.tone || "caution"}`;
                adviceEl.innerHTML = `<i class="fas fa-circle-info" aria-hidden="true"></i><span>${selectionNote}</span>`;
                cadRefreshIcons(adviceEl);
            } else {
                adviceEl.className = "weather-service-advice";
                adviceEl.innerHTML = "";
            }
        }
    }

    function buildWeatherDaysHtml(assessed) {
        return assessed
            .map(
                (day) => `
            <article class="weather-day weather-day--${day.tone}">
                <div class="weather-day__top">
                    <span class="weather-day__label">${formatWeatherDay(day.date, day.index)}</span>
                    <i class="${getWeatherIcon(day.code)} weather-day__icon" aria-hidden="true"></i>
                </div>
                <div class="weather-day__temp">
                    <span class="weather-day__max">${day.tempMax}°</span>
                    <span class="weather-day__min">${day.tempMin}°</span>
                </div>
                <div class="weather-day__meta">
                    <span><i class="fas fa-droplet" aria-hidden="true"></i>${day.rainChance}%</span>
                    <span><i class="fas fa-wind" aria-hidden="true"></i>${day.wind} km/h</span>
                </div>
                <span class="weather-day__hint">${getWeatherDayHint(day.tone)}</span>
            </article>`
            )
            .join("");
    }

    function isWeatherPlannerWidget(widget) {
        return Boolean(
            widget?.classList?.contains("weather-widget--planner") ||
            widget?.closest(".weather-hub") ||
            widget?.closest(".weather-planner")
        );
    }

    function updateWeatherBubble(mainDay, locationName) {
        const bubble = document.getElementById("weather-toggle");
        const widget = document.getElementById("weather-widget");
        if (!bubble || !mainDay) return;

        bubble.classList.remove("weather-bubble--good", "weather-bubble--caution", "weather-bubble--bad");
        if (!isWeatherPlannerWidget(widget)) {
            bubble.classList.add(`weather-bubble--${mainDay.tone}`);
        }

        widget?.classList.remove("weather-hub--good", "weather-hub--caution", "weather-hub--bad", "weather-hub--loading");
        widget?.classList.add(`weather-hub--${mainDay.tone || "caution"}`);

        const iconWrap = bubble.querySelector(".weather-bubble__icon, .weather-hub__icon");
        if (iconWrap) {
            iconWrap.innerHTML = `<i class="${getWeatherIcon(mainDay.code)}" aria-hidden="true"></i>`;
            cadRefreshIcons(iconWrap);
        }

        const meta = document.getElementById("weather-bubble-meta");
        if (meta) {
            meta.textContent = `${locationName} · max ${mainDay.tempMax}° · ${getWeatherToneLabel(mainDay.tone)}`;
        }

        const preview = document.getElementById("weather-bubble-preview");
        if (preview) preview.textContent = `${mainDay.tempMax}°`;

        const tone = document.getElementById("weather-hub-tone");
        if (tone) tone.textContent = getWeatherToneLabel(mainDay.tone);
    }

    function syncWeatherViews(assessed, locationName, mainDay) {
        const daysHtml = buildWeatherDaysHtml(assessed);
        const modalDays = document.getElementById("weather-modal-days");
        const modalSubtitle = document.getElementById("weather-modal-subtitle");
        const modalTitle = document.getElementById("weather-modal-title");

        if (modalTitle) modalTitle.textContent = cadT("weatherTitle");
        if (modalSubtitle) modalSubtitle.textContent = locationName;
        if (modalDays) {
            modalDays.innerHTML = daysHtml;
            cadRefreshIcons(modalDays);
        }

        updateWeatherBubble(mainDay, locationName);
        renderWeatherGuide(assessed, mainDay, locationName);
    }

    function setupWeatherToggle(widget) {
        const toggleBtn = document.getElementById("weather-toggle");
        const modal = document.getElementById("weatherModal");
        if (!toggleBtn) return;
        if (toggleBtn.dataset.weatherToggleBound) return;
        toggleBtn.dataset.weatherToggleBound = "1";

        const setInlineOpen = (isOpen) => {
            if (!isWeatherPlannerWidget(widget) && isWeatherDesktop()) return;
            widget.classList.toggle("weather-widget--collapsed", !isOpen);
            toggleBtn.setAttribute("aria-expanded", String(isOpen));
        };

        toggleBtn.addEventListener("click", () => {
            if (isWeatherDesktop() && !isWeatherPlannerWidget(widget)) {
                openWeatherModal();
                return;
            }
            setInlineOpen(widget.classList.contains("weather-widget--collapsed"));
        });

        modal?.querySelector("[data-weather-modal-close]")?.addEventListener("click", closeWeatherModal);
        modal?.addEventListener("click", (event) => {
            if (event.target === modal) closeWeatherModal();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && modal?.style.display === "flex") {
                closeWeatherModal();
                return;
            }
            if (event.key === "Escape" && (isWeatherPlannerWidget(widget) || !isWeatherDesktop())) {
                setInlineOpen(false);
            }
        });

        document.addEventListener("click", (event) => {
            if (!isWeatherPlannerWidget(widget) && isWeatherDesktop()) return;
            if (widget.contains(event.target)) return;
            setInlineOpen(false);
        });

        window.matchMedia("(min-width: 901px)").addEventListener("change", () => {
            if (!isWeatherPlannerWidget(widget)) {
                setInlineOpen(false);
                if (!isWeatherDesktop()) closeWeatherModal();
            }
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
        currentWeatherAssessment = mainDay;
        currentWeatherForecast = assessed;
        currentWeatherLocation = locationName;
        currentWeatherIsFallback = false;

        statusEl.textContent = `${locationName} · ${getWeatherToneLabel(mainDay.tone)}`;
        if (mainIcon) {
            mainIcon.innerHTML = `<i class="${getWeatherIcon(mainDay.code)}" aria-hidden="true"></i>`;
            cadRefreshIcons(mainIcon);
        }

        daysContainer.innerHTML = buildWeatherDaysHtml(assessed);
        cadRefreshIcons(daysContainer);
        syncWeatherViews(assessed, locationName, mainDay);
        updateWeatherServiceAdvice();
    }

    function renderWeatherFallback(daysContainer, statusEl, mainIcon) {
        currentWeatherAssessment = { tone: "caution" };
        currentWeatherForecast = [];
        currentWeatherLocation = "";
        currentWeatherIsFallback = true;
        statusEl.textContent = cadT("weatherFallbackStatus");
        if (mainIcon) {
            mainIcon.innerHTML = '<i class="fas fa-cloud" aria-hidden="true"></i>';
            cadRefreshIcons(mainIcon);
        }

        const fallbackAssessed = [0, 1, 2].map((index) => ({
            tone: "caution",
            code: 3,
            tempMax: "--",
            tempMin: "--",
            rainChance: "--",
            wind: "--",
            date: "",
            index
        }));
        const fallbackHtml = buildWeatherDaysHtml(fallbackAssessed);
        const fallbackMain = fallbackAssessed[0];

        daysContainer.innerHTML = fallbackHtml;
        cadRefreshIcons(daysContainer);
        const modalDays = document.getElementById("weather-modal-days");
        const modalSubtitle = document.getElementById("weather-modal-subtitle");
        if (modalDays) {
            modalDays.innerHTML = fallbackHtml;
            cadRefreshIcons(modalDays);
        }
        if (modalSubtitle) modalSubtitle.textContent = cadT("temporarilyUnavailable");
        renderWeatherGuide(fallbackAssessed, fallbackMain, "", true);
        updateWeatherServiceAdvice();
        updateWeatherBubble(fallbackMain, cadT("temporarilyUnavailable"));
    }

    function updateWeatherServiceAdvice() {
        if (!currentWeatherAssessment) return;
        renderWeatherGuide(
            currentWeatherForecast || [],
            currentWeatherAssessment,
            currentWeatherLocation || "",
            currentWeatherIsFallback
        );
    }

    function assessDetailingWeather(day) {
        const rainyCode = day.code >= 51 && day.code <= 82;
        const stormOrSnow = day.code >= 85 || day.code === 95 || day.code === 96 || day.code === 99;
        if (stormOrSnow || day.rainChance >= 70 || day.wind >= 42 || day.tempMax <= 4) {
            return { tone: "bad" };
        }
        if (rainyCode || day.rainChance >= 40 || day.wind >= 30 || day.tempMax <= 8) {
            return { tone: "caution" };
        }
        return { tone: "good" };
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

    function resetCalculatorOnLoad() {
        try {
            localStorage.removeItem(storageKey);
            sessionStorage.removeItem(storageKey);
        } catch (e) {
            /* ignore */
        }
        if (!sizeSelect) return;

        sizeSelect.value = "M";
        selectedCarModel = "";
        if (customCarModelInput) customCarModelInput.value = "";

        document.querySelectorAll(".size-option").forEach((opt) => {
            opt.classList.toggle("active", opt.getAttribute("data-value") === "M");
        });

        services.forEach((checkbox) => {
            checkbox.checked = false;
        });

        hideCarModelPanel();
        updateSelectedCarModel("");
        syncServiceVisualState();
        syncQuoteHubPreview();
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
            headerContent.style.transform = `translateY(${progress * 12}px)`;
            headerVideo.style.transform = "";
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
                if (window.syncCalcStickyBar) window.syncCalcStickyBar();
                setTimeout(() => resGrossElement.classList.remove("price-flip"), 180);
            }
        };
        window.requestAnimationFrame(step);
    }

    function syncQuoteHubPreview() {
        const size = sizeSelect?.value || "M";
        const checked = services.filter((s) => s.checked);
        const grossEl = document.getElementById("res-gross");
        const symEl = document.getElementById("currency-symbol");
        const totalText = grossEl?.textContent?.trim() || "0";
        const sym = symEl?.textContent?.trim() || "€";
        const hasSelection = checked.length > 0;
        const total = Number(totalText) || 0;

        let meta = `Klasa ${size} · kliknij, aby wybrać auto i usługi`;
        if (hasSelection) {
            meta = `Klasa ${size} · ${checked.length} ${checked.length === 1 ? "usługa" : "usługi"}`;
        }

        document.querySelectorAll("[data-quote-preview-class]").forEach((el) => {
            el.innerHTML = `<i class="fas fa-car-side"></i> Klasa ${size}`;
            cadRefreshIcons(el);
        });
        document.querySelectorAll("[data-quote-preview-total]").forEach((el) => {
            el.textContent = hasSelection && total > 0 ? `${totalText} ${sym}` : "od €115";
            el.classList.toggle("is-live", hasSelection && total > 0);
        });
        document.querySelectorAll("[data-quote-preview-meta]").forEach((el) => {
            el.textContent = meta;
        });

        document.querySelectorAll(".quote-hub__teaser-mockup").forEach((el) => {
            el.classList.toggle("has-selection", hasSelection && total > 0);
        });
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
        syncQuoteHubPreview();
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
        let themeFlashEl = null;

        function applyTheme(theme) {
            const isLight = theme === "light";
            document.documentElement.classList.toggle("theme-light", isLight);
            document.body.classList.toggle("theme-light", isLight);
            if (themeToggleBtn) {
                themeToggleBtn.setAttribute("aria-pressed", String(isLight));
                const label = themeToggleBtn.querySelector(".float-action-copy small");
                if (label) label.textContent = isLight ? cadT("themeDarkTarget") : cadT("themeLightTarget");
                const iconHost = themeToggleBtn.querySelector(".theme-toggle-icon");
                if (!window.CAD_Icons?.set(iconHost, isLight ? "moon" : "sun")) {
                    const icon = iconHost?.querySelector("i");
                    if (icon) icon.className = isLight ? "fas fa-moon" : "fas fa-sun";
                }
            }
        }

        function ensureThemeFlash() {
            if (themeFlashEl) return themeFlashEl;
            themeFlashEl = document.createElement("div");
            themeFlashEl.id = "cad-theme-flash";
            themeFlashEl.hidden = true;
            themeFlashEl.innerHTML = '<div class="cad-theme-flash__ring" aria-hidden="true"></div>';
            document.body.appendChild(themeFlashEl);
            return themeFlashEl;
        }

        function playThemeFlash(nextTheme, originX, originY, swapTheme) {
            const flash = ensureThemeFlash();
            const goingLight = nextTheme === "light";
            flash.className = `cad-theme-flash cad-theme-flash--${goingLight ? "to-light" : "to-dark"}`;
            flash.style.setProperty("--cad-flash-x", `${originX}%`);
            flash.style.setProperty("--cad-flash-y", `${originY}%`);
            flash.hidden = false;
            flash.classList.remove("is-active", "is-fading");
            void flash.offsetWidth;
            requestAnimationFrame(() => flash.classList.add("is-active"));

            window.setTimeout(() => swapTheme(), 200);
            window.setTimeout(() => flash.classList.add("is-fading"), 300);
            window.setTimeout(() => {
                flash.classList.remove("is-active", "is-fading");
                flash.hidden = true;
            }, 520);
        }

        function transitionTheme(nextTheme, originX, originY) {
            const swapTheme = () => {
                localStorage.setItem(themeKey, nextTheme);
                applyTheme(nextTheme);
            };

            const reduceMotion =
                document.body.classList.contains("cad-reduced-motion") ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            if (reduceMotion) {
                swapTheme();
                return;
            }

            if (typeof document.startViewTransition === "function") {
                document.startViewTransition(swapTheme);
                return;
            }

            playThemeFlash(nextTheme, originX, originY, swapTheme);
        }

        applyTheme(initialTheme);
        if (themeToggleBtn?.dataset.themeToggleBound) return;
        if (themeToggleBtn) themeToggleBtn.dataset.themeToggleBound = "1";

        themeToggleBtn?.addEventListener("click", () => {
            const nextTheme = document.body.classList.contains("theme-light") ? "dark" : "light";
            const rect = themeToggleBtn.getBoundingClientRect();
            const originX = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
            const originY = ((rect.top + rect.height / 2) / window.innerHeight) * 100;

            transitionTheme(nextTheme, originX, originY);
            if (navigator.vibrate) navigator.vibrate(8);
        });
    }

    if (logoContainer && logoImg) {
        const logoTip = logoContainer.querySelector(".logo-description");
        if (logoTip && window.matchMedia("(pointer: coarse)").matches) {
            logoContainer.addEventListener("click", (e) => {
                e.stopPropagation();
                const willOpen = !logoContainer.classList.contains("logo-tip-open");
                logoContainer.classList.toggle("logo-tip-open", willOpen);
            });
            document.addEventListener("click", (e) => {
                if (!logoContainer.contains(e.target)) {
                    logoContainer.classList.remove("logo-tip-open");
                }
            });
        }
    }

    services.forEach((s) => {
        s.addEventListener("change", handleExclusions);
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
