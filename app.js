(function () {
    const cfg = window.CAD_CONFIG;
    if (!cfg) return;

    const I18N = {
        pl: {
            payLabel: "DO ZAP\u0141ATY:",
            cookieText: "U\u017cywamy localStorage oraz (po podaniu ID) Google Analytics. Klikaj\u0105c \u201eAkceptuj\u0119\u201d, zgadzasz si\u0119 na niezb\u0119dne dane techniczne.",
            cookieAccept: "Akceptuj\u0119",
            cookieDecline: "Tylko niezb\u0119dne"
        },
        nl: {
            payLabel: "TE BETALEN:",
            cookieText: "We gebruiken localStorage en (met ID) Google Analytics. Met \u201eAccepteren\u201d ga je akkoord met noodzakelijke technische gegevens.",
            cookieAccept: "Accepteren",
            cookieDecline: "Alleen noodzakelijk"
        }
    };

    let currency = cfg.defaultCurrency || "EUR";
    let locale = cfg.defaultLocale || "pl";
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
        locale = next === "nl" ? "nl" : "pl";
        localStorage.setItem(cfg.storageKeys.locale, locale);
        document.documentElement.lang = locale;
        document.querySelectorAll("[data-locale-btn]").forEach((btn) => {
            btn.classList.toggle("active", btn.getAttribute("data-locale-btn") === locale);
        });
        const payLabel = document.getElementById("pay-label");
        if (payLabel) payLabel.textContent = t("payLabel");
        const cookieText = document.getElementById("cookie-consent-text");
        if (cookieText) cookieText.textContent = t("cookieText");
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
                : "Pobieram aktualny kurs EUR/PLN...";
            return;
        }

        const rate = Number(cfg.eurToPln).toFixed(4);
        const datePart = rateMeta.date ? `, ${rateMeta.date}` : "";

        if (locale === "nl") {
            el.textContent = `Live koers (${rateMeta.source}${datePart}): 1 \u20ac = ${rate} z\u0142. Indicatieve prijs.`;
        } else {
            el.textContent = `Kurs na \u017cywo (${rateMeta.source}${datePart}): 1 \u20ac = ${rate} z\u0142. Wycena orientacyjna.`;
        }
    }

    function getQuoteSummary() {
        const sizeSelect = document.getElementById("car-size");
        const selectedSize = sizeSelect ? sizeSelect.options[sizeSelect.selectedIndex].text : "-";
        const selectedCarModel = document.getElementById("selected-car-model")?.dataset.model || "";
        const selected = document.querySelectorAll(".service:checked");
        const totalNode = document.getElementById("res-gross");
        const totalEur = totalNode
            ? parseInt(totalNode.getAttribute("data-eur-total") || totalNode.innerText, 10) || 0
            : 0;
        const timeText = document.getElementById("res-time")?.innerText || "-";
        const lines = [];

        selected.forEach((s) => {
            const row = s.closest(".service-item");
            if (!row) return;
            const name = row.querySelector(".service-name")?.innerText.replace(/\s+/g, " ").trim() || "Usluga";
            lines.push(`- ${name}`);
        });

        return { selectedSize, selectedCarModel, lines, totalEur, timeText, serviceCount: selected.length };
    }

    function buildWhatsAppUrl() {
        const q = getQuoteSummary();
        const totalText = formatMoney(q.totalEur);
        let body;

        if (locale === "nl") {
            const carLine = q.selectedCarModel ? `\nAuto: ${q.selectedCarModel}` : "";
            body = q.serviceCount === 0
                ? `Hoi! Ik heb interesse in detailing.${carLine}\nKan ik een vrije datum vragen?`
                : `Hoi! Offerte uit calculator:\nKlasse: ${q.selectedSize}${carLine}\n${q.lines.join("\n")}\nTotaal: ${totalText}\nTijd: ${q.timeText}\nMag ik een vrije datum?`;
        } else {
            const carLine = q.selectedCarModel ? `\nAuto: ${q.selectedCarModel}` : "";
            body = q.serviceCount === 0
                ? `Cze\u015b\u0107! Interesuje mnie detailing.${carLine}\nChcia\u0142bym zapyta\u0107 o wolny termin.`
                : `Cze\u015b\u0107! Wycena z kalkulatora:\nKlasa: ${q.selectedSize}${carLine}\n${q.lines.join("\n")}\nSuma: ${totalText}\nCzas: ${q.timeText}\nChcia\u0142bym zapyta\u0107 o wolny termin.`;
        }

        return `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(body)}`;
    }

    function updateWhatsAppLinks() {
        const url = buildWhatsAppUrl();
        document.querySelectorAll(".whatsapp-float").forEach((el) => {
            el.href = url;
        });
    }

    function setupWhatsAppFloat() {
        document.getElementById("whatsapp-quote-btn")?.remove();

        const floatBtn = document.querySelector(".whatsapp-float");
        if (!floatBtn || floatBtn.dataset.trackBound) return;
        floatBtn.dataset.trackBound = "1";
        floatBtn.addEventListener("click", () => trackEvent("whatsapp_float_click", { source: "float" }));
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
        bar.setAttribute("aria-label", "Zgoda na cookies");
        bar.innerHTML = `
            <p id="cookie-consent-text">${t("cookieText")}</p>
            <motion class="cookie-consent-actions">
                <button type="button" class="cookie-btn cookie-decline" id="cookie-decline">${t("cookieDecline")}</button>
                <button type="button" class="cookie-btn cookie-accept" id="cookie-accept">${t("cookieAccept")}</button>
            </motion>
        `.replace(/motion/g, "div");

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
            <motion class="prefs-group" aria-label="Jezyk">
                <button type="button" class="pref-btn" data-locale-btn="pl" title="Polski">PL</button>
                <button type="button" class="pref-btn" data-locale-btn="nl" title="Nederlands">NL</button>
            </motion>
            <motion class="prefs-group" aria-label="Waluta">
                <button type="button" class="pref-btn" data-currency-btn="EUR" title="Euro">\u20ac</button>
                <button type="button" class="pref-btn" data-currency-btn="PLN" title="Zloty">z\u0142</button>
            </motion>
        `.replace(/motion/g, "div");

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

        setLocale(cfg.defaultLocale || "pl");
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

    function init() {
        loadCachedRate();
        fetchLiveEurPlnRate();

        setupModals();
        setupCookieBanner();
        setupToolbar();
        setupWhatsAppFloat();
        updateWhatsAppLinks();
        initLazyImages();
        registerServiceWorker();

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
        setCurrency,
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
