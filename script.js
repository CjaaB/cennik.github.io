function setGreeting() {
    const hour = new Date().getHours();
    const greetingElement = document.getElementById("greeting-text");
    if (!greetingElement) return;

    if (hour >= 5 && hour < 12) greetingElement.innerText = "Dzień dobry! Poranna kawa i detailing?";
    else if (hour >= 12 && hour < 18) greetingElement.innerText = "Siemanko! Czas na popołudniowe odświeżenie auta?";
    else if (hour >= 18 && hour < 22) greetingElement.innerText = "Dobry wieczór!";
    else greetingElement.innerText = "Witaj nocny marku";
}

function generateOfferPDF() {
    const sizeSelect = document.getElementById("car-size");
    const selectedSize = sizeSelect ? sizeSelect.options[sizeSelect.selectedIndex].text : "Nieokreślony";
    const selectedCarModel = document.getElementById("selected-car-model")?.dataset.model || "";
    const selectedServices = document.querySelectorAll(".service:checked");
    const totalNode = document.getElementById("res-gross");
    const totalEur = totalNode ? (totalNode.getAttribute("data-eur-total") || totalNode.innerText) : "0";
    const total = window.CAD_Features
        ? window.CAD_Features.formatMoney(parseInt(totalEur, 10) || 0)
        : `${totalEur} €`;

    if (selectedServices.length === 0) {
        alert("Najpierw wybierz usługi, aby wygenerować ofertę!");
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
        const name = row.querySelector(".service-name")?.innerText || "Usługa";
        const price = row.querySelector(".service-price")?.innerText || "-";
        rows += `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${price}</td>
            </tr>`;
    });

    let content = `
        <html>
        <head>
            <title>Oferta Car All Detailing</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                .header { display: flex; align-items: center; gap: 24px; border-bottom: 3px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
                .header img { width: 80px; height: auto; flex-shrink: 0; }
                .header-text { flex: 1; }
                .logo { font-size: 26px; font-weight: bold; color: #000; letter-spacing: 2px; margin: 0; }
                .signature { color: #666; font-size: 13px; margin: 4px 0 0; }
                .subheader { color: #d4af37; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin-top: 6px; }
                .info-box { margin-bottom: 30px; font-size: 14px; color: #555; background: #fafafa; padding: 16px 20px; border-radius: 8px; border-left: 4px solid #d4af37; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { text-align: left; background: #f5f5f5; padding: 12px; border-bottom: 2px solid #d4af37; text-transform: uppercase; font-size: 12px; }
                td { padding: 12px; border-bottom: 1px solid #eee; }
                .total-section { text-align: right; margin-top: 40px; padding: 20px 24px; background: #f9f9f9; border-radius: 8px; border: 1px solid #e8e0c8; }
                .total-label { font-size: 16px; color: #777; }
                .total-amount { font-size: 28px; color: #000; font-weight: bold; display: block; margin-top: 6px; }
                .footer { margin-top: 50px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                @media print { body { padding: 24px; } }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="logo1.png" alt="Car All Detailing">
                <div class="header-text">
                    <h1 class="logo">CAR ALL DETAILING</h1>
                    <p class="signature">by Karol Zagórski</p>
                    <div class="subheader">Wstępna wycena usług</div>
                </div>
            </div>
            
            <div class="info-box">
                <p><strong>Data:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Wielkość pojazdu:</strong> ${selectedSize}</p>
                ${selectedCarModel ? `<p><strong>Model auta:</strong> ${selectedCarModel}</p>` : ""}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Wybrana usługa</th>
                        <th style="text-align: right;">Cena szacunkowa</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="total-section">
                <span class="total-label">Suma całkowita (brutto):</span>
                <span class="total-amount">${total}</span>
            </div>

            <div class="footer">
                <p>Przedstawiona wycena ma charakter informacyjny i nie stanowi oferty handlowej w rozumieniu przepisów prawa.</p>
                <p>Ostateczny koszt usługi jest ustalany po inspekcji stanu pojazdu na miejscu.</p>
                <p><strong>CAR ALL DETAILING</strong> | www.cjaab.github.io/cennik.github.io</p>
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
    const resGrossElement = document.getElementById("res-gross");
    const promoBar = document.getElementById("promo-bar");
    const promoText = document.getElementById("promo-text");
    const promoCloseBtn = document.getElementById("promo-close-btn");
    const visitCountEl = document.getElementById("visit-count");
    const timeResultEl = document.getElementById("res-time");
    const upsellEl = document.getElementById("upsell-suggestion");
    const carModelPanel = document.getElementById("car-model-panel");
    const carModelList = document.getElementById("car-model-list");
    const customCarModelInput = document.getElementById("custom-car-model");
    const selectedCarModelEl = document.getElementById("selected-car-model");
    const storageKey = (window.CAD_CONFIG && window.CAD_CONFIG.storageKeys.calculator) || "cad_calculator_state_v2";
    const serviceTimeMap = (window.CAD_CONFIG && window.CAD_CONFIG.serviceTimeMap) || {};
    let selectedCarModel = "";

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
    if (window.CAD_Features && window.CAD_Features.hasAnalyticsConsent()) {
        updateVisitCounter();
    }
    document.addEventListener("cad:analytics-allowed", updateVisitCounter);
    restoreCalculatorState();
    setupHeroParallax();

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
            promoText.innerHTML = "<strong>Witamy pierwszy raz!</strong> Odbierz -10% kodem <strong>START10</strong> na pierwszą usługę.";
            localStorage.setItem("cad_has_visited", "1");
        } else {
            promoText.innerHTML = "<strong>Wracasz do nas? Super!</strong> Poleć usługę znajomemu i odbierz bonus przy kolejnej wizycie.";
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

    async function updateVisitCounter() {
        if (!visitCountEl) return;
        const namespace = "car-all-detailing";
        const key = "homepage-visits";
        const endpoint = `https://api.countapi.xyz/hit/${namespace}/${key}`;

        try {
            const response = await fetch(endpoint, { method: "GET" });
            if (!response.ok) throw new Error("Counter request failed");
            const data = await response.json();
            const value = typeof data.value === "number" ? data.value : null;
            visitCountEl.innerText = value !== null ? value.toLocaleString("pl-PL") : "brak danych";
        } catch (error) {
            visitCountEl.innerText = "niedostępny";
        }
    }

    function renderEstimatedTime(minMinutes, maxMinutes) {
        if (!timeResultEl) return;
        if (minMinutes === 0 && maxMinutes === 0) {
            timeResultEl.innerText = "0h";
            return;
        }
        const minHours = (minMinutes / 60).toFixed(1);
        const maxHours = (maxMinutes / 60).toFixed(1);
        timeResultEl.innerText = `${minHours}h - ${maxHours}h`;
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
            upsellEl.innerHTML = `Tip: w pakiecie <strong>COMBO</strong> możesz zaoszczędzić ok. <strong>${diff} €</strong>.`;
            upsellEl.classList.add("show");
            return;
        }

        if (showroomPrice && !showroom?.checked && currentTotal > showroomPrice) {
            const diff = Math.round(currentTotal - showroomPrice);
            upsellEl.innerHTML = `Tip: rozważ <strong>Pakiet Showroom</strong> (oszczędność ok. <strong>${diff} €</strong> i pełniejszy efekt).`;
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
            ts: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(state));
    }

    function updateSelectedCarModel(model) {
        selectedCarModel = (model || "").trim();
        if (!selectedCarModelEl) return;

        selectedCarModelEl.dataset.model = selectedCarModel;
        selectedCarModelEl.classList.toggle("has-model", !!selectedCarModel);
        selectedCarModelEl.textContent = selectedCarModel
            ? `Wybrane auto: ${selectedCarModel}`
            : "Model auta nie został jeszcze wybrany.";
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
        let minMinutes = 0;
        let maxMinutes = 0;

        services.forEach((checkbox) => {
            if (checkbox.checked) {
                const sizePrice = checkbox.getAttribute(`data-${currentSize.toLowerCase()}`);
                const staticPrice = checkbox.getAttribute("data-static");
                total += sizePrice ? parseFloat(sizePrice) : (staticPrice ? parseFloat(staticPrice) : 0);
                const timeRange = serviceTimeMap[checkbox.id] || [25, 45];
                minMinutes += timeRange[0];
                maxMinutes += timeRange[1];
            }
        });

        animatePrice(Math.round(total));
        renderEstimatedTime(minMinutes, maxMinutes);
        renderUpsellSuggestion(total, currentSize);
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

    if (logoContainer && logoImg) {
        logoContainer.addEventListener("mousemove", (e) => {
            if (window.matchMedia("(pointer: coarse)").matches) return;
            const rect = logoContainer.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * -30;
            logoImg.style.transform = `rotateX(${y}deg) rotateY(${x}deg) scale(1.1)`;
        });

        logoContainer.addEventListener("mouseleave", () => {
            logoImg.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
        });
    }

    services.forEach((s) => s.addEventListener("change", handleExclusions));

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

    document.getElementById("download-offer-btn")?.addEventListener("click", () => {
        window.CAD_Features?.trackEvent("pdf_download_click");
    });

    document.querySelector(".book-btn")?.addEventListener("click", () => {
        window.CAD_Features?.trackEvent("calendly_book_click");
    });

    calculate();
});
