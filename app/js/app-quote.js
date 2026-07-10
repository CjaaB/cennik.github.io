(function () {
    const STORAGE_KEY = "cad_calculator_state_v2";

    let size = "M";
    let carModel = "";
    const selected = new Set();
    let expandedDescId = null;

    function getSizes() {
        return window.CAD_DATA?.getSettings?.()?.sizes || [];
    }

    function getCatalog() {
        return window.CAD_DATA?.getSettings?.()?.catalog || [];
    }

    function lang() {
        return window.CAD_APP?.locale || "pl";
    }

    function L(obj) {
        return window.CAD_DATA?.L?.(obj, lang()) || obj?.pl || "";
    }

    function findItem(id) {
        return window.CAD_DATA?.findCatalogItem?.(id) || null;
    }

    function priceFor(item) {
        if (!item) return 0;
        if (item.static != null) return Number(item.static) || 0;
        const direct = item.prices?.[size];
        if (direct != null) return direct;
        const fallback = window.CAD_DATA?.findDefaultCatalogItem?.(item.id);
        return fallback?.prices?.[size] || 0;
    }

    function calcTotal() {
        let total = 0;
        getCatalog().forEach((group) => {
            (group.items || []).forEach((item) => {
                if (selected.has(item.id)) total += priceFor(item);
            });
        });
        return total;
    }

    function formatMoney(eur) {
        if (window.CAD_Currency?.formatMoney) {
            return window.CAD_Currency.formatMoney(eur);
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
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            /* ignore */
        }
        window.dispatchEvent(new CustomEvent("cad:quote-updated"));
        syncQuoteToConversation(state);
    }

    function loadSavedQuote() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const state = JSON.parse(raw);
            if (!state || typeof state !== "object") return;
            if (state.ts && Date.now() - state.ts > 30 * 24 * 60 * 60 * 1000) return;
            if (state.size) size = state.size;
            carModel = state.carModel || "";
            selected.clear();
            (state.selectedServiceIds || []).forEach((id) => {
                if (id) selected.add(id);
            });
        } catch (e) {
            /* ignore */
        }
    }

    async function syncQuoteToConversation(state) {
        if (!window.CAD_ChatClient?.updateQuoteSnapshot) return;
        const snap = window.CAD_DATA?.buildQuoteSnapshot?.(state, lang());
        if (snap) await window.CAD_ChatClient.updateQuoteSnapshot(snap);
    }

    function clearSavedQuote() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            /* ignore */
        }
        size = "M";
        carModel = "";
        selected.clear();
    }

    let quoteInteractionsBound = false;

    function bindQuoteInteractions() {
        const root = document.getElementById("app-quote-root");
        if (!root || quoteInteractionsBound) return;
        quoteInteractionsBound = true;

        root.addEventListener("click", (e) => {
            const sizeBtn = e.target.closest(".app-quote-size");
            if (sizeBtn && root.contains(sizeBtn)) {
                e.preventDefault();
                setSize(sizeBtn.getAttribute("data-size"));
                return;
            }

            const infoBtn = e.target.closest(".app-quote-card__info");
            if (infoBtn) {
                e.preventDefault();
                e.stopPropagation();
                const shell = infoBtn.closest(".app-quote-card-shell");
                const id = shell?.querySelector(".app-quote-card")?.dataset.id;
                if (!id) return;
                if (expandedDescId === id) {
                    closeExpandedDesc();
                    return;
                }
                closeExpandedDesc();
                expandedDescId = id;
                shell?.classList.add("is-desc-open");
                return;
            }

            const card = e.target.closest(".app-quote-card");
            if (!card || !root.contains(card)) return;
            e.preventDefault();
            const id = card.dataset.id;
            if (!id) return;
            closeExpandedDesc();
            toggleService(id);
            if (navigator.vibrate) navigator.vibrate(8);
        });
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

    function closeExpandedDesc() {
        expandedDescId = null;
        document.querySelectorAll(".app-quote-card-shell.is-desc-open").forEach((shell) => {
            shell.classList.remove("is-desc-open");
        });
    }

    function bindQuoteScrollDismiss() {
        const scrollEl = document.querySelector(".app-quote-scroll");
        if (!scrollEl || scrollEl.dataset.scrollDismiss) return;
        scrollEl.dataset.scrollDismiss = "1";
        scrollEl.addEventListener("scroll", closeExpandedDesc, { passive: true });
    }

    function showQuoteToast(message) {
        if (window.CAD_AppShell?.showToast) {
            window.CAD_AppShell.showToast(message);
            return;
        }
        alert(message);
    }

    function applyQuoteI18n() {
        const root = document.getElementById("app-quote-root");
        if (!root) return;
        root.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (!key || key === "pl" || key === "nl" || key === "en") return;
            el.textContent = appT(key);
        });
        const carInput = document.getElementById("app-quote-car");
        if (carInput) carInput.placeholder = appT("appQuoteModelPh");
        const shareBtn = document.getElementById("app-quote-share-btn");
        const pdfBtn = document.getElementById("app-quote-pdf-btn");
        if (shareBtn) shareBtn.title = appT("appQuoteShareBtn");
        if (pdfBtn) pdfBtn.title = appT("appQuotePdfBtn");
        const sizesGroup = document.querySelector(".app-quote-sizes");
        if (sizesGroup) sizesGroup.setAttribute("aria-label", appT("appQuoteSizeAria"));
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
        if (!getSizes().some((s) => s.id === next)) return;
        if (size === next) {
            updateAllCardPrices();
            updateTotal();
            return;
        }
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

    function syncAllCards() {
        const root = document.getElementById("app-quote-root");
        if (!root) return;
        root.querySelectorAll(".app-quote-card").forEach((card) => {
            const sid = card.dataset.id;
            const on = selected.has(sid);
            const shell = card.closest(".app-quote-card-shell");
            card.classList.toggle("is-on", on);
            card.setAttribute("aria-pressed", String(on));
            shell?.classList.toggle("is-on", on);
        });
    }

    function toggleService(id) {
        if (!id) return;
        const adding = !selected.has(id);
        const nextIds =
            window.CAD_DATA?.applyServiceExclusions?.([...selected], id, adding) ||
            (adding ? [...selected, id] : [...selected].filter((x) => x !== id));
        selected.clear();
        nextIds.forEach((sid) => selected.add(sid));
        syncAllCards();
        updateTotal();
        persist();
    }

    function buildQuoteSummary() {
        const st = {
            size,
            carModel: carModel.trim(),
            selectedServiceIds: [...selected],
            totalEur: calcTotal()
        };
        const locale = lang();
        const sizeObj = getSizes().find((s) => s.id === st.size);
        const sizeLabel = sizeObj ? L(sizeObj.label) : st.size;
        const lines = st.selectedServiceIds.map((id) => {
            const item = findItem(id);
            return item ? L(item.name) : id;
        });
        const car = st.carModel ? `\n${appT("quoteSummaryModel")}: ${st.carModel}` : "";
        return (
            `${appT("quoteSummaryTitle")}\n` +
            `${appT("quoteSummaryClass")}: ${sizeLabel}${car}\n` +
            `${appT("quoteSummaryServices")}: ${lines.join(", ") || "—"}\n` +
            `${appT("quoteSummaryTotal")}: ${formatMoney(st.totalEur)}\n` +
            appT("quoteSummaryLink")
        );
    }

    function printQuotePdf() {
        if (selected.size === 0) {
            alert(appT("appQuotePickOne"));
            return;
        }
        const sizeObj = getSizes().find((s) => s.id === size);
        const rows = [...selected]
            .map((id) => {
                const item = findItem(id);
                if (!item) return null;
                return {
                    name: L(item.name),
                    price: formatMoney(priceFor(item))
                };
            })
            .filter(Boolean);

        const payload = {
            title: appT("quotePdfTitle"),
            subtitle: appT("quotePdfSubtitle") || appT("quotePdfTitle"),
            fileName: "Car_All_Detailing_Wycena.pdf",
            dateLabel: lang() === "nl" ? "Datum" : lang() === "en" ? "Date" : "Data",
            classLabel: appT("quotePdfClass"),
            modelLabel: appT("quoteSummaryModel"),
            serviceCol: appT("quotePdfServiceCol"),
            priceCol: appT("quotePdfPriceCol"),
            totalLabel: appT("quotePdfTotalLine"),
            disclaimer: appT("quotePdfDisclaimer"),
            footerLine: "CAR ALL DETAILING · Karol Zagorski",
            date: new Date().toLocaleDateString(),
            sizeLabel: sizeObj ? L(sizeObj.label) : size,
            carModel: carModel.trim(),
            rows,
            totalText: formatMoney(calcTotal())
        };

        if (!window.CAD_Documents?.printQuote) {
            alert(appT("quotePdfBlocked"));
            return;
        }
        window.CAD_Documents.printQuote(payload);
    }

    async function shareQuote() {
        if (!selected.size) {
            alert(appT("appQuotePickOne"));
            return;
        }
        const text = buildQuoteSummary();
        const shareData = { title: appT("quoteShareTitle"), text };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (e) {
                /* cancelled */
            }
        }
        try {
            await navigator.clipboard.writeText(text);
            showQuoteToast(appT("quoteShareCopied"));
        } catch (e) {
            window.prompt(appT("quoteSharePrompt"), text);
        }
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

        const bookBtn = document.getElementById("app-quote-book-btn");
        if (bookBtn) {
            bookBtn.onclick = (e) => {
                e.preventDefault();
                persist();
                window.CAD_AppShell?.openBookWithQuote?.();
            };
        }

        const shareBtn = document.getElementById("app-quote-share-btn");
        if (shareBtn) {
            shareBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                shareQuote().catch((err) => {
                    console.warn("[CAD quote] share", err);
                    alert(appT("quoteSharePrompt"));
                });
            };
        }
        const pdfBtn = document.getElementById("app-quote-pdf-btn");
        if (pdfBtn) {
            pdfBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                printQuotePdf();
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

        const sizes = getSizes();
        const catalog = getCatalog();
        if (!sizes.length || !catalog.length) {
            root.innerHTML = `<p class="app-quote-loading">${escapeHtml(appT("appQuoteLoading") || "Ładowanie cennika…")}</p>`;
            return;
        }

        const sizeHtml = sizes
            .map(
                (s) =>
                    `<button type="button" class="app-quote-size${s.id === size ? " active" : ""}" data-size="${s.id}">
                    <strong>${escapeHtml(L(s.label))}</strong><small>${escapeHtml(L(s.hint))}</small>
                </button>`
            )
            .join("");

        const groupsHtml = catalog
            .map((group) => {
                const items = (group.items || [])
                    .map((item) => {
                        const p = priceFor(item);
                        const on = selected.has(item.id);
                        const badge =
                            item.badge === "hit"
                                ? `<span class="app-quote-card__badge">${escapeHtml(appT("quoteBadgeHit"))}</span>`
                                : item.badge === "premium"
                                  ? `<span class="app-quote-card__badge app-quote-card__badge--gold">${escapeHtml(appT("quoteBadgePremium"))}</span>`
                                  : "";
                        return `<div class="app-quote-card-shell${on ? " is-on" : ""}">
                        <button type="button" class="app-quote-card${on ? " is-on" : ""}" data-id="${item.id}" aria-pressed="${on}">
                        <span class="app-quote-card__icon"><i class="fas ${item.icon}"></i></span>
                        <span class="app-quote-card__name">${escapeHtml(L(item.name))}${badge}</span>
                        <span class="app-quote-card__desc">${escapeHtml(L(item.desc))}</span>
                        <span class="app-quote-card__price">${escapeHtml(formatMoney(p))}</span>
                        </button>
                        <button type="button" class="app-quote-card__info" aria-label="${escapeAttr(appT("appQuoteInfoAria"))}" title="${escapeAttr(appT("appQuoteInfoAria"))}"><i class="fas fa-circle-info" aria-hidden="true"></i></button>
                    </div>`;
                    })
                    .join("");
                return `<div class="app-quote-group"><h3 class="app-quote-group__title">${escapeHtml(L(group.cat))}</h3><div class="app-quote-grid">${items}</div></div>`;
            })
            .join("");

        root.innerHTML = `
            <div class="app-quote-scroll">
                <header class="app-quote-head">
                    <div class="app-quote-head__top">
                        <div>
                            <h2 data-i18n="appQuoteTitle">Wycena</h2>
                            <p data-i18n="appQuoteLead">Wybierz rozmiar auta i usługi.</p>
                        </div>
                        <div class="app-currency-switch app-quote-currency" role="group" aria-label="Waluta">
                            <button type="button" class="lang-pill currency-pill active" data-currency="EUR" title="Euro" aria-label="Euro">€</button>
                            <button type="button" class="lang-pill currency-pill" data-currency="PLN" title="Złoty" aria-label="Złoty">zł</button>
                        </div>
                    </div>
                    <p class="app-rate-line" id="app-quote-rate-line" data-currency-rate-hint hidden></p>
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
                    <button type="button" class="btn btn-outline btn-sm" id="app-quote-share-btn" title="Udostępnij"><i class="fas fa-share-alt"></i></button>
                    <button type="button" class="btn btn-outline btn-sm" id="app-quote-pdf-btn" title="Drukuj"><i class="fas fa-print"></i></button>
                    <button type="button" class="btn btn-outline btn-sm" id="app-quote-chat-btn" data-i18n="quoteResumeChat">Chat</button>
                    <button type="button" class="btn btn-gold btn-sm" id="app-quote-book-btn" data-i18n="appQuoteBook">Termin</button>
                </div>
            </footer>`;

        applyQuoteI18n();
        wireControls();
        bindQuoteScrollDismiss();
        window.CAD_Currency?.syncCurrencyButtons?.();
        window.CAD_Currency?.updateRateHints?.();
        syncAllCards();
        updateTotal();
        window.CAD_Icons?.refresh?.(root);
    }

    async function ensureSettingsLoaded() {
        if (typeof firebase === "undefined" || !firebase.apps?.length) return;
        try {
            const db = firebase.firestore();
            await window.CAD_DATA.loadSettings(db);
        } catch (e) {
            console.warn("[CAD quote] settings", e);
        }
    }

    window.CAD_AppQuote = {
        init() {
            loadSavedQuote();
            bindQuoteInteractions();
            render();
            ensureSettingsLoaded().then(() => render());
            window.addEventListener("cad:app-locale-change", () => {
                render();
            });
            window.addEventListener("cad:currency-change", () => {
                updateAllCardPrices();
                updateTotal();
                window.CAD_Currency?.updateRateHints?.();
            });
            window.addEventListener("cad:settings-loaded", () => {
                render();
                updateAllCardPrices();
                updateTotal();
            });
        },
        refresh: render,
        reset: clearSavedQuote,
        getState() {
            return {
                size,
                carModel: carModel.trim(),
                selectedServiceIds: [...selected],
                totalEur: calcTotal()
            };
        }
    };
})();
