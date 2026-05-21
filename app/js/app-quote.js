(function () {
    const STORAGE_KEY = "cad_calculator_state_v2";

    const SIZES = [
        { id: "S", label: { pl: "S", nl: "S", en: "S" }, hint: { pl: "Małe", nl: "Klein", en: "Small" } },
        { id: "M", label: { pl: "M", nl: "M", en: "M" }, hint: { pl: "Średnie", nl: "Middel", en: "Medium" } },
        { id: "L", label: { pl: "L", nl: "L", en: "L" }, hint: { pl: "Duże", nl: "Groot", en: "Large" } },
        { id: "XL", label: { pl: "XL", nl: "XL", en: "XL" }, hint: { pl: "SUV", nl: "SUV", en: "SUV" } },
        { id: "XXL", label: { pl: "XXL", nl: "XXL", en: "XXL" }, hint: { pl: "VAN", nl: "BUS", en: "Van" } }
    ];

    const CATALOG = [
        {
            cat: { pl: "Pakiety", nl: "Pakketten", en: "Packages" },
            items: [
                {
                    id: "ext-basic",
                    icon: "fa-car-side",
                    name: { pl: "Mycie zewnętrzne", nl: "Buiten wassen", en: "Exterior wash" },
                    desc: { pl: "Karoseria, felgi, opony", nl: "Carrosserie, velgen", en: "Body, wheels, tyres" },
                    prices: { S: 50, M: 60, L: 75, XL: 90, XXL: 110 }
                },
                {
                    id: "int-basic",
                    icon: "fa-couch",
                    name: { pl: "Czyszczenie wnętrza", nl: "Interieur reinigen", en: "Interior clean" },
                    desc: { pl: "Odkurzanie, plastiki, szyby", nl: "Stofzuigen, plastiek", en: "Vacuum, plastics, glass" },
                    prices: { S: 75, M: 85, L: 105, XL: 130, XXL: 160 }
                },
                {
                    id: "full-combo",
                    icon: "fa-star",
                    name: { pl: "Pakiet COMBO", nl: "COMBO pakket", en: "COMBO package" },
                    desc: { pl: "Zewnątrz + wnętrze", nl: "Buiten + interieur", en: "Exterior + interior" },
                    prices: { S: 115, M: 140, L: 175, XL: 215, XXL: 270 },
                    badge: "hit"
                },
                {
                    id: "showroom",
                    icon: "fa-gem",
                    name: { pl: "Showroom", nl: "Showroom", en: "Showroom" },
                    desc: { pl: "Pełna pielęgnacja premium", nl: "Volledige premium care", en: "Full premium care" },
                    prices: { S: 220, M: 260, L: 320, XL: 380, XXL: 460 },
                    badge: "premium"
                }
            ]
        },
        {
            cat: { pl: "Wnętrze i dodatki", nl: "Interieur & extra", en: "Interior & extras" },
            items: [
                {
                    id: "leather-clean",
                    icon: "fa-chair",
                    name: { pl: "Pielęgnacja skóry", nl: "Leder verzorging", en: "Leather care" },
                    desc: { pl: "Czyszczenie i impregnacja", nl: "Reinigen en voeden", en: "Clean and nourish" },
                    static: 70
                },
                {
                    id: "steering-wheel",
                    icon: "fa-circle-notch",
                    name: { pl: "Kierownica", nl: "Stuurwiel", en: "Steering wheel" },
                    desc: { pl: "Dokładne czyszczenie", nl: "Grondig reinigen", en: "Deep clean" },
                    static: 20
                },
                {
                    id: "boneting-seats",
                    icon: "fa-spray-can-sparkles",
                    name: { pl: "Odświeżenie foteli", nl: "Stoelen opfrissen", en: "Seat refresh" },
                    desc: { pl: "Materiałowe fotele", nl: "Stoffen stoelen", en: "Fabric seats" },
                    static: 45
                },
                {
                    id: "boneting-full",
                    icon: "fa-border-all",
                    name: { pl: "Odświeżenie wnętrza", nl: "Interieur opfrissen", en: "Interior refresh" },
                    desc: { pl: "Fotele, boczki, podsufitka", nl: "Stoelen, panelen", en: "Seats, panels, headliner" },
                    static: 85
                },
                {
                    id: "premiumWax",
                    icon: "fa-sun",
                    name: { pl: "Wosk premium", nl: "Premium wax", en: "Premium wax" },
                    desc: { pl: "Połysk i ochrona lakieru", nl: "Glans en bescherming", en: "Shine and protection" },
                    static: 65
                },
                {
                    id: "clay-deiron",
                    icon: "fa-droplet",
                    name: { pl: "Oczyszczenie lakieru", nl: "Lak reinigen", en: "Paint decontamination" },
                    desc: { pl: "Glina / żelazko", nl: "Kleigrond / ijzer", en: "Clay / iron fallout" },
                    static: 55
                },
                {
                    id: "pet-hair",
                    icon: "fa-paw",
                    name: { pl: "Sierść zwierząt", nl: "Huisdierenharen", en: "Pet hair removal" },
                    desc: { pl: "Z wnętrza auta", nl: "Uit het interieur", en: "From interior" },
                    static: 35
                },
                {
                    id: "engine-bay",
                    icon: "fa-car-battery",
                    name: { pl: "Pod maską", nl: "Motorruimte", en: "Engine bay" },
                    desc: { pl: "Czyszczenie komory", nl: "Reinigen motorruimte", en: "Bay clean" },
                    static: 55
                }
            ]
        }
    ];

    let size = "M";
    let carModel = "";
    const selected = new Set();

    function lang() {
        return window.CAD_APP?.locale || "pl";
    }

    function L(obj) {
        return obj[lang()] || obj.pl || "";
    }

    function priceFor(item) {
        if (item.static) return item.static;
        return item.prices?.[size] || 0;
    }

    function calcTotal() {
        let total = 0;
        CATALOG.forEach((group) => {
            group.items.forEach((item) => {
                if (selected.has(item.id)) total += priceFor(item);
            });
        });
        return total;
    }

    function formatMoney(eur) {
        const cur = localStorage.getItem("cad_currency_v1") || "EUR";
        if (cur === "PLN") {
            const rate = window.CAD_CONFIG?.eurToPlnFallback || 4.32;
            return `${Math.round(eur * rate)} zł`;
        }
        return `€${eur}`;
    }

    function persist() {
        const state = {
            size,
            carModel: carModel.trim(),
            selectedServiceIds: [...selected],
            totalEur: calcTotal(),
            ts: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent("cad:quote-updated"));
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const s = JSON.parse(raw);
            if (s.size && SIZES.some((x) => x.id === s.size)) size = s.size;
            if (s.carModel) carModel = String(s.carModel);
            selected.clear();
            (s.selectedServiceIds || []).forEach((id) => selected.add(id));
        } catch (e) {
            /* ignore */
        }
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/"/g, "&quot;");
    }

    function escapeAttr(s) {
        return escapeHtml(s).replace(/'/g, "&#39;");
    }

    function applyQuoteI18n() {
        const root = document.getElementById("app-quote-root");
        if (!root) return;
        root.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (!key) return;
            el.textContent = appT(key);
        });
        const carInput = document.getElementById("app-quote-car");
        if (carInput) carInput.placeholder = appT("appQuoteModelPh");
    }

    function updateTotal() {
        const totalEl = document.getElementById("app-quote-total");
        if (totalEl) totalEl.textContent = formatMoney(calcTotal());
    }

    function updateAllCardPrices() {
        const root = document.getElementById("app-quote-root");
        if (!root) return;
        root.querySelectorAll(".app-quote-card").forEach((card) => {
            const item = findItem(card.dataset.id);
            if (!item) return;
            const priceEl = card.querySelector(".app-quote-card__price");
            if (!priceEl) return;
            priceEl.textContent = formatMoney(priceFor(item));
            priceEl.classList.remove("price-flash");
            void priceEl.offsetWidth;
            priceEl.classList.add("price-flash");
        });
    }

    function setSize(next) {
        if (!SIZES.some((s) => s.id === next) || size === next) return;
        size = next;
        const root = document.getElementById("app-quote-root");
        if (root) {
            root.querySelectorAll(".app-quote-size").forEach((btn) => {
                btn.classList.toggle("active", btn.getAttribute("data-size") === size);
            });
        }
        updateAllCardPrices();
        updateTotal();
        persist();
    }

    function toggleService(id, card) {
        if (!id) return;
        if (selected.has(id)) selected.delete(id);
        else selected.add(id);
        if (card) {
            card.classList.toggle("is-on", selected.has(id));
            card.setAttribute("aria-pressed", String(selected.has(id)));
        }
        updateTotal();
        persist();
    }

    function findItem(id) {
        for (const group of CATALOG) {
            const hit = group.items.find((i) => i.id === id);
            if (hit) return hit;
        }
        return null;
    }

    function wireControls() {
        const root = document.getElementById("app-quote-root");
        if (!root) return;

        root.querySelectorAll(".app-quote-size").forEach((btn) => {
            const next = btn.getAttribute("data-size");
            btn.onclick = (e) => {
                e.preventDefault();
                setSize(next);
            };
        });

        root.querySelectorAll(".app-quote-card").forEach((card) => {
            const id = card.dataset.id;
            card.onclick = (e) => {
                e.preventDefault();
                toggleService(id, card);
            };
        });

        const chatBtn = document.getElementById("app-quote-chat-btn");
        if (chatBtn) {
            chatBtn.onclick = (e) => {
                e.preventDefault();
                if (!selected.size) {
                    alert(appT("appQuotePickOne"));
                    return;
                }
                persist();
                window.CAD_AppHome?.sendQuoteToChat?.();
            };
        }

        const carInput = document.getElementById("app-quote-car");
        if (carInput) {
            carInput.oninput = () => {
                carModel = carInput.value;
                persist();
            };
        }
    }

    function render() {
        const root = document.getElementById("app-quote-root");
        if (!root) return;

        const sizeHtml = SIZES.map(
            (s) =>
                `<button type="button" class="app-quote-size${s.id === size ? " active" : ""}" data-size="${s.id}">
                    <strong>${escapeHtml(L(s.label))}</strong><small>${escapeHtml(L(s.hint))}</small>
                </button>`
        ).join("");

        const groupsHtml = CATALOG.map((group) => {
            const items = group.items
                .map((item) => {
                    const p = priceFor(item);
                    const on = selected.has(item.id);
                    const badge =
                        item.badge === "hit"
                            ? `<span class="app-quote-card__badge">${escapeHtml(appT("quoteBadgeHit"))}</span>`
                            : item.badge === "premium"
                              ? `<span class="app-quote-card__badge app-quote-card__badge--gold">${escapeHtml(appT("quoteBadgePremium"))}</span>`
                              : "";
                    return `<button type="button" class="app-quote-card${on ? " is-on" : ""}" data-id="${item.id}" aria-pressed="${on}">
                        <span class="app-quote-card__icon"><i class="fas ${item.icon}"></i></span>
                        <span class="app-quote-card__name">${escapeHtml(L(item.name))}${badge}</span>
                        <span class="app-quote-card__desc">${escapeHtml(L(item.desc))}</span>
                        <span class="app-quote-card__price">${escapeHtml(formatMoney(p))}</span>
                    </button>`;
                })
                .join("");
            return `<div class="app-quote-group"><h3 class="app-quote-group__title">${escapeHtml(L(group.cat))}</h3><div class="app-quote-grid">${items}</div></div>`;
        }).join("");

        root.innerHTML = `
            <div class="app-quote-scroll">
                <header class="app-quote-head">
                    <h2 data-i18n="appQuoteTitle">Wycena</h2>
                    <p data-i18n="appQuoteLead">Wybierz rozmiar auta i usługi.</p>
                </header>
                <div class="app-quote-sizes" role="group" aria-label="Rozmiar auta">${sizeHtml}</div>
                <label class="app-quote-model">
                    <span data-i18n="appQuoteModel">Model auta (opcjonalnie)</span>
                    <input type="text" id="app-quote-car" maxlength="80" value="${escapeAttr(carModel)}">
                </label>
                ${groupsHtml}
            </div>
            <footer class="app-quote-bar">
                <div class="app-quote-bar__total">
                    <small data-i18n="appQuoteTotalLabel">Suma orientacyjna</small>
                    <strong id="app-quote-total">${escapeHtml(formatMoney(calcTotal()))}</strong>
                </div>
                <div class="app-quote-bar__actions">
                    <button type="button" class="btn btn-outline btn-sm" id="app-quote-chat-btn" data-i18n="quoteResumeChat">Wyślij na chat</button>
                    <button type="button" class="btn btn-gold btn-sm" data-goto="book" data-i18n="appQuoteBook">Termin</button>
                </div>
            </footer>`;

        applyQuoteI18n();
        wireControls();
    }

    window.CAD_AppQuote = {
        init() {
            loadState();
            render();
            window.addEventListener("cad:app-locale-change", () => render());
        },
        refresh: render
    };
})();
