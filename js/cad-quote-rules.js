/**
 * Jedna mapa wykluczeń kalkulatora — strona www + aplikacja.
 * Pary są dwukierunkowe.
 *
 * Showroom obejmuje m.in.: dokładniejsze wnętrze/zewnętrze, wosk, kierownicę,
 * pielęgnację skóry / odświeżenie materiałów (stąd wykluczenia dodatków).
 * COMBO = mycie + podstawowe wnętrze — dodatki (skóra, fotele, kierownica, wosk) wolno dokładać.
 */
(function () {
    "use strict";

    const EXCLUSION_PAIRS = [
        /* Pakiety główne */
        ["ext-basic", "full-combo"],
        ["ext-basic", "showroom"],
        ["int-basic", "full-combo"],
        ["int-basic", "showroom"],
        ["full-combo", "showroom"],

        /* Showroom zawiera te elementy */
        ["showroom", "deep-clean"],
        ["showroom", "leather-clean"],
        ["showroom", "boneting-seats"],
        ["showroom", "boneting-full"],
        ["showroom", "steering-wheel"],
        ["showroom", "premiumWax"],
        ["showroom", "quickWax"],
        ["showroom", "clay-deiron"],

        /* Wnętrze: podstawowe vs głębokie pranie */
        ["int-basic", "deep-clean"],

        /* Alternatywy tej samej strefy */
        ["deep-clean", "boneting-seats"],
        ["deep-clean", "boneting-full"],
        ["deep-clean", "leather-clean"],
        ["boneting-seats", "boneting-full"],
        ["boneting-seats", "leather-clean"],
        ["boneting-full", "leather-clean"],
        ["premiumWax", "quickWax"]
    ];

    const SERVICE_EXCLUSIONS = (() => {
        const map = Object.create(null);
        EXCLUSION_PAIRS.forEach(([a, b]) => {
            if (!map[a]) map[a] = [];
            if (!map[b]) map[b] = [];
            if (!map[a].includes(b)) map[a].push(b);
            if (!map[b].includes(a)) map[b].push(a);
        });
        return map;
    })();

    function getExclusions(serviceId) {
        return SERVICE_EXCLUSIONS[serviceId] ? SERVICE_EXCLUSIONS[serviceId].slice() : [];
    }

    function applyExclusions(selectedIds, toggledId, adding) {
        const next = new Set(selectedIds || []);
        if (adding) {
            next.add(toggledId);
            getExclusions(toggledId).forEach((id) => next.delete(id));
        } else {
            next.delete(toggledId);
        }
        return Array.from(next);
    }

    /** Cena pozycji katalogu dla klasy S–XXL (prices ma pierwszeństwo przed static). */
    function priceForItem(item, sizeId, fallbackItem) {
        if (!item) return 0;
        const size = sizeId || "M";
        const fromPrices = (src) => {
            if (!src?.prices || typeof src.prices !== "object") return null;
            const raw = src.prices[size];
            if (raw == null || raw === "") return null;
            const n = Number(raw);
            return Number.isFinite(n) ? n : null;
        };
        const sized = fromPrices(item);
        if (sized != null) return sized;
        if (item.static != null && item.static !== "") {
            const n = Number(item.static);
            if (Number.isFinite(n)) return n;
        }
        const fbSized = fromPrices(fallbackItem);
        if (fbSized != null) return fbSized;
        if (fallbackItem?.static != null && fallbackItem.static !== "") {
            const n = Number(fallbackItem.static);
            if (Number.isFinite(n)) return n;
        }
        return 0;
    }

    window.CAD_QuoteRules = {
        EXCLUSION_PAIRS,
        getExclusions,
        applyExclusions,
        priceForItem
    };
})();
