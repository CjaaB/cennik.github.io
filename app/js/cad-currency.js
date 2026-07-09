(function () {
    const FALLBACK_KEY = "cad_currency_v1";
    const CACHE_KEY = "cad_eur_pln_cache_v1";

    let currency = "EUR";
    let rateMeta = { source: "fallback", date: null, loading: false };

    function cfg() {
        return window.CAD_CONFIG || {};
    }

    function storageKey() {
        return cfg().storageKeys?.currency || FALLBACK_KEY;
    }

    function cacheKey() {
        return cfg().storageKeys?.eurPlnCache || CACHE_KEY;
    }

    function locale() {
        return window.CAD_APP?.locale || "pl";
    }

    function getRate() {
        const c = cfg();
        return Number(c.eurToPln) || Number(c.eurToPlnFallback) || 4.32;
    }

    function getCurrency() {
        return currency;
    }

    function formatMoney(amountEur) {
        const eur = Number(amountEur) || 0;
        if (currency === "PLN") {
            return `${Math.round(eur * getRate())} zł`;
        }
        return `€${eur}`;
    }

    function saveRateCache(rate, source, date) {
        try {
            localStorage.setItem(cacheKey(), JSON.stringify({ rate, source, date, ts: Date.now() }));
        } catch (e) {
            /* ignore */
        }
    }

    function loadCachedRate() {
        try {
            const raw = localStorage.getItem(cacheKey());
            if (!raw) return false;
            const cached = JSON.parse(raw);
            if (!cached || typeof cached.rate !== "number") return false;
            if (Date.now() - cached.ts > 12 * 60 * 60 * 1000) return false;
            cfg().eurToPln = cached.rate;
            rateMeta = { source: cached.source || "NBP", date: cached.date || null, loading: false };
            return true;
        } catch (e) {
            return false;
        }
    }

    function applyLiveRate(rate, source, date) {
        cfg().eurToPln = rate;
        rateMeta = { source, date, loading: false };
        saveRateCache(rate, source, date);
        updateRateHints();
        window.dispatchEvent(new CustomEvent("cad:currency-change"));
    }

    async function fetchLiveRate() {
        rateMeta.loading = true;
        updateRateHints();

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
        } catch (e) {
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
        } catch (e) {
            /* fallback below */
        }

        cfg().eurToPln = cfg().eurToPlnFallback || 4.32;
        rateMeta = { source: "fallback", date: null, loading: false };
        updateRateHints();
    }

    function rateDisclaimerText() {
        if (currency !== "PLN") return "";
        if (typeof appT !== "function") {
            return `1 € = ${getRate().toFixed(4)} zł`;
        }
        if (rateMeta.loading) {
            return appT("currencyRateLoading");
        }
        const datePart = rateMeta.date ? `, ${rateMeta.date}` : "";
        return appT("currencyRateLive", {
            source: rateMeta.source,
            date: datePart,
            rate: getRate().toFixed(4)
        });
    }

    function updateRateHints() {
        document.querySelectorAll("[data-currency-rate-hint]").forEach((el) => {
            const text = rateDisclaimerText();
            if (!text) {
                el.hidden = true;
                el.textContent = "";
                return;
            }
            el.hidden = false;
            el.textContent = text;
        });
    }

    function syncCurrencyButtons() {
        document.querySelectorAll(".currency-pill[data-currency]").forEach((btn) => {
            btn.classList.toggle("active", btn.getAttribute("data-currency") === currency);
        });
    }

    function setCurrency(next) {
        currency = next === "PLN" ? "PLN" : "EUR";
        try {
            localStorage.setItem(storageKey(), currency);
        } catch (e) {
            /* ignore */
        }
        syncCurrencyButtons();
        updateRateHints();
        window.dispatchEvent(new CustomEvent("cad:currency-change"));
        if (currency === "PLN" && rateMeta.source === "fallback" && !rateMeta.loading) {
            fetchLiveRate();
        }
    }

    function bindCurrencyButtons() {
        if (bindCurrencyButtons.bound) return;
        bindCurrencyButtons.bound = true;
        document.addEventListener("click", (e) => {
            const btn = e.target.closest(".currency-pill[data-currency]");
            if (!btn) return;
            e.preventDefault();
            setCurrency(btn.getAttribute("data-currency"));
        });
    }

    function init() {
        const c = cfg();
        if (!c.eurToPln) c.eurToPln = c.eurToPlnFallback || 4.32;

        try {
            const saved = localStorage.getItem(storageKey());
            currency = saved === "PLN" ? "PLN" : "EUR";
        } catch (e) {
            currency = c.defaultCurrency === "PLN" ? "PLN" : "EUR";
        }

        loadCachedRate();
        syncCurrencyButtons();
        bindCurrencyButtons();
        updateRateHints();

        if (currency === "PLN") {
            fetchLiveRate();
        }

        window.addEventListener("cad:app-locale-change", updateRateHints);
    }

    window.CAD_Currency = {
        init,
        getCurrency,
        setCurrency,
        getRate,
        formatMoney,
        fetchLiveRate,
        rateDisclaimerText,
        updateRateHints,
        syncCurrencyButtons
    };
})();
