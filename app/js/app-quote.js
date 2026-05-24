(function () {
    const STORAGE_KEY = "cad_calculator_state_v2";

    let size = "M";
    let carModel = "";
    const selected = new Set();

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

    function priceFor(item) {
        if (item.static) return item.static;
        return item.prices?.[size] || 0;
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
        syncQuoteToConversation(state);
    }

    async function syncQuoteToConversation(state) {
        if (!window.CAD_ChatClient?.updateQuoteSnapshot) return;
        const snap = window.CAD_DATA?.buildQuoteSnapshot?.(state, lang());
        if (snap) await window.CAD_ChatClient.updateQuoteSnapshot(snap);
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const s = JSON.parse(raw);
            if (s.size && getSizes().some((x) => x.id === s.size)) size = s.size;
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
        if (!getSizes().some((s) => s.id === next) || size === next) return;
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
            card.classList.toggle("is-on", on);
            card.setAttribute("aria-pressed", String(on));
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
        if (!selected.size) {
            alert(appT("appQuotePickOne"));
            return;
        }
        const locale = lang();
        const sizeObj = getSizes().find((s) => s.id === size);
        const rows = [...selected]
            .map((id) => {
                const item = findItem(id);
                if (!item) return "";
                return `<tr><td>${escapeHtml(L(item.name))}</td><td>${escapeHtml(formatMoney(priceFor(item)))}</td></tr>`;
            })
            .join("");
        const html = `<!DOCTYPE html><html lang="${locale}"><head><meta charset="utf-8"><title>${escapeHtml(appT("quotePdfTitle"))}</title>
<style>body{font-family:Segoe UI,sans-serif;padding:28px;color:#111}h1{font-size:1.25rem}table{width:100%;border-collapse:collapse;margin:16px 0}td{padding:8px 4px;border-bottom:1px solid #ddd}.total{font-size:1.2rem;font-weight:700;margin-top:12px}small{color:#666}</style></head>
<body><h1>${escapeHtml(appT("quotePdfTitle"))}</h1><p>${escapeHtml(appT("quotePdfClass"))}: <strong>${escapeHtml(sizeObj ? L(sizeObj.label) : size)}</strong>${carModel.trim() ? ` · ${escapeHtml(carModel.trim())}` : ""}</p>
<table><thead><tr><th>${escapeHtml(appT("quotePdfServiceCol"))}</th><th>${escapeHtml(appT("quotePdfPriceCol"))}</th></tr></thead><tbody>${rows}</tbody></table>
<p class="total">${escapeHtml(appT("quotePdfTotalLine"))}: ${escapeHtml(formatMoney(calcTotal()))}</p>
<small>${escapeHtml(appT("quotePdfDisclaimer"))}</small>
<script>window.onload=function(){window.print();}</script></body></html>`;
        const w = window.open("", "_blank", "noopener,noreferrer");
        if (!w) {
            alert(appT("quotePdfBlocked"));
            return;
        }
        w.document.write(html);
        w.document.close();
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
            alert(appT("quoteShareCopied"));
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

        root.querySelectorAll(".app-quote-card").forEach((card) => {
            const id = card.dataset.id;
            card.onclick = (e) => {
                e.preventDefault();
                toggleService(id);
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

        document.getElementById("app-quote-share-btn")?.addEventListener("click", (e) => {
            e.preventDefault();
            shareQuote();
        });
        document.getElementById("app-quote-pdf-btn")?.addEventListener("click", (e) => {
            e.preventDefault();
            printQuotePdf();
        });

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
                        return `<button type="button" class="app-quote-card${on ? " is-on" : ""}" data-id="${item.id}" aria-pressed="${on}">
                        <span class="app-quote-card__icon"><i class="fas ${item.icon}"></i></span>
                        <span class="app-quote-card__name">${escapeHtml(L(item.name))}${badge}</span>
                        <span class="app-quote-card__desc">${escapeHtml(L(item.desc))}</span>
                        <span class="app-quote-card__price">${escapeHtml(formatMoney(p))}</span>
                    </button>`;
                    })
                    .join("");
                return `<div class="app-quote-group"><h3 class="app-quote-group__title">${escapeHtml(L(group.cat))}</h3><div class="app-quote-grid">${items}</div></div>`;
            })
            .join("");

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
                    <button type="button" class="btn btn-outline btn-sm" id="app-quote-share-btn" title="Udostępnij"><i class="fas fa-share-alt"></i></button>
                    <button type="button" class="btn btn-outline btn-sm" id="app-quote-pdf-btn" title="PDF"><i class="fas fa-file-pdf"></i></button>
                    <button type="button" class="btn btn-outline btn-sm" id="app-quote-chat-btn" data-i18n="quoteResumeChat">Chat</button>
                    <button type="button" class="btn btn-gold btn-sm" id="app-quote-book-btn" data-i18n="appQuoteBook">Termin</button>
                </div>
            </footer>`;

        applyQuoteI18n();
        wireControls();
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
            loadState();
            render();
            ensureSettingsLoaded().then(() => render());
            window.addEventListener("cad:app-locale-change", () => {
                applyQuoteI18n();
                updateAllCardPrices();
            });
            window.addEventListener("cad:settings-loaded", () => render());
        },
        refresh: render,
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
