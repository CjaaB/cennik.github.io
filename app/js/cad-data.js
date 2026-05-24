(function () {
    const DEFAULT_SIZES = [
        { id: "S", label: { pl: "S", nl: "S", en: "S" }, hint: { pl: "Małe", nl: "Klein", en: "Small" } },
        { id: "M", label: { pl: "M", nl: "M", en: "M" }, hint: { pl: "Średnie", nl: "Middel", en: "Medium" } },
        { id: "L", label: { pl: "L", nl: "L", en: "L" }, hint: { pl: "Duże", nl: "Groot", en: "Large" } },
        { id: "XL", label: { pl: "XL", nl: "XL", en: "XL" }, hint: { pl: "SUV", nl: "SUV", en: "SUV" } },
        { id: "XXL", label: { pl: "XXL", nl: "XXL", en: "XXL" }, hint: { pl: "VAN", nl: "BUS", en: "Van" } }
    ];

    const DEFAULT_CATALOG = [
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

    const DEFAULT_APP_SETTINGS = {
        calendlyUrl:
            "https://calendly.com/yakasu1999/new-meeting?hide_gdpr_banner=1&background_color=050505&text_color=e8e4d8&primary_color=d4af37",
        businessHours: {
            pl: "Odpowiadam zwykle w ciągu kilku godzin (pn–sob, 9:00–20:00).",
            nl: "Ik antwoord meestal binnen enkele uren (ma–za, 9:00–20:00).",
            en: "I usually reply within a few hours (Mon–Sat, 9:00–20:00)."
        },
        sizes: DEFAULT_SIZES,
        catalog: DEFAULT_CATALOG
    };

    let cached = null;
    let loadPromise = null;
    const SETTINGS_CACHE_KEY = "cad_settings_cache_v1";

    function readSettingsCache() {
        try {
            const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
            if (!raw) return null;
            return mergeSettings(JSON.parse(raw));
        } catch (e) {
            return null;
        }
    }

    function writeSettingsCache(settings) {
        try {
            localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
        } catch (e) {
            /* ignore */
        }
    }

    function mergeSettings(remote) {
        const base = JSON.parse(JSON.stringify(DEFAULT_APP_SETTINGS));
        if (!remote || typeof remote !== "object") return base;
        if (remote.calendlyUrl) base.calendlyUrl = String(remote.calendlyUrl);
        if (remote.businessHours) base.businessHours = { ...base.businessHours, ...remote.businessHours };
        if (Array.isArray(remote.sizes) && remote.sizes.length) base.sizes = remote.sizes;
        if (Array.isArray(remote.catalog) && remote.catalog.length) base.catalog = remote.catalog;
        return base;
    }

    function getSettings() {
        if (cached) return cached;
        const fromDisk = readSettingsCache();
        if (fromDisk) {
            cached = fromDisk;
            return cached;
        }
        return DEFAULT_APP_SETTINGS;
    }

    async function loadSettings(db) {
        if (cached) return cached;
        if (loadPromise) return loadPromise;
        loadPromise = (async () => {
            const disk = readSettingsCache();
            if (!db) {
                cached = disk || DEFAULT_APP_SETTINGS;
                return cached;
            }
            try {
                const snap = await db.collection("settings").doc("app").get();
                cached = mergeSettings(snap.exists ? snap.data() : null);
                writeSettingsCache(cached);
            } catch (e) {
                console.warn("[CAD] settings load", e);
                cached = disk || DEFAULT_APP_SETTINGS;
            }
            window.dispatchEvent(new CustomEvent("cad:settings-loaded"));
            return cached;
        })();
        return loadPromise;
    }

    async function saveSettings(db, data) {
        if (!db) throw new Error("no-db");
        const patch = data && typeof data === "object" ? data : {};
        const merged = mergeSettings({ ...getSettings(), ...patch });
        const payload = {
            ...merged,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection("settings").doc("app").set(payload, { merge: true });
        cached = merged;
        writeSettingsCache(cached);
        window.dispatchEvent(new CustomEvent("cad:settings-loaded"));
    }

    function convStatusLabel(data) {
        if (!data) return { key: "unknown", pl: "—", nl: "—", en: "—" };
        if (data.unreadAdmin) return { key: "new", pl: "Nowa", nl: "Nieuw", en: "New" };
        if (data.lastSender === "admin") return { key: "waiting", pl: "Czeka na klienta", nl: "Wacht op klient", en: "Waiting" };
        return { key: "reply", pl: "Do odpowiedzi", nl: "Te beantwoorden", en: "Needs reply" };
    }

    function statusClass(key) {
        if (key === "new") return "status-new";
        if (key === "waiting") return "status-waiting";
        return "status-reply";
    }

    const CLIENT_ID_KEY = "cad_client_id";

    function getOrCreateClientId() {
        try {
            if (typeof firebase !== "undefined" && firebase.auth?.()?.currentUser?.uid) {
                return firebase.auth().currentUser.uid;
            }
        } catch (e) {
            /* ignore */
        }
        let id = localStorage.getItem(CLIENT_ID_KEY);
        if (!id) {
            id = "c_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36).slice(-5);
            localStorage.setItem(CLIENT_ID_KEY, id);
        }
        return id;
    }

    function L(obj, lang) {
        if (!obj || typeof obj !== "object") return "";
        const code = lang || (window.CAD_APP?.locale || "pl");
        return obj[code] || obj.pl || "";
    }

    function findCatalogItem(id, catalog) {
        const cat = catalog || getSettings().catalog || [];
        for (const group of cat) {
            const hit = (group.items || []).find((i) => i.id === id);
            if (hit) return hit;
        }
        return null;
    }

    /** Wykluczenia jak na stronie www (script.js) — wybór jednej opcji odznacza sprzeczne */
    const SERVICE_EXCLUSIONS = {
        showroom: [
            "ext-basic",
            "int-basic",
            "full-combo",
            "leather-clean",
            "boneting-seats",
            "boneting-full",
            "premiumWax"
        ],
        "full-combo": ["ext-basic", "int-basic", "boneting-seats", "boneting-full", "showroom"],
        "leather-clean": ["boneting-seats", "boneting-full", "showroom", "full-combo"],
        "boneting-full": ["boneting-seats", "int-basic", "full-combo", "showroom", "leather-clean"],
        "boneting-seats": ["boneting-full", "int-basic", "full-combo", "showroom", "leather-clean"],
        premiumWax: ["showroom"],
        "ext-basic": ["full-combo", "showroom"],
        "int-basic": ["full-combo", "showroom"]
    };

    function getServiceExclusions(serviceId) {
        return SERVICE_EXCLUSIONS[serviceId] ? [...SERVICE_EXCLUSIONS[serviceId]] : [];
    }

    function applyServiceExclusions(selectedIds, toggledId, adding) {
        const next = new Set(selectedIds || []);
        if (adding) {
            next.add(toggledId);
            getServiceExclusions(toggledId).forEach((id) => next.delete(id));
        } else {
            next.delete(toggledId);
        }
        return [...next];
    }

    function buildQuoteSnapshot(state, lang) {
        if (!state?.selectedServiceIds?.length) return null;
        const settings = getSettings();
        const locale = lang || window.CAD_APP?.locale || "pl";
        const lines = state.selectedServiceIds.map((id) => {
            const item = findCatalogItem(id, settings.catalog);
            return item ? L(item.name, locale) : id;
        });
        return {
            size: state.size || "M",
            carModel: (state.carModel || "").trim(),
            totalEur: state.totalEur || 0,
            serviceIds: [...state.selectedServiceIds],
            serviceLabels: lines,
            updatedAt: Date.now()
        };
    }

    function buildCalendlyUrl(baseUrl, quoteState) {
        const base = (baseUrl || getSettings().calendlyUrl || "").trim();
        if (!base) return base;
        try {
            const url = new URL(base);
            if (quoteState?.selectedServiceIds?.length) {
                const size = quoteState.size || "M";
                const total = quoteState.totalEur || 0;
                const car = quoteState.carModel ? ` · ${quoteState.carModel}` : "";
                url.searchParams.set("a1", `CAD ${size}${car} · ~€${total}`);
                const names = (quoteState.serviceLabels || quoteState.selectedServiceIds || [])
                    .slice(0, 5)
                    .join(", ");
                if (names) url.searchParams.set("a2", names.slice(0, 280));
            }
            return url.toString();
        } catch (e) {
            return base;
        }
    }

    function businessHoursText(lang) {
        const bh = getSettings().businessHours || {};
        return L(bh, lang || window.CAD_APP?.locale || "pl");
    }

    window.CAD_DATA = {
        DEFAULT_APP_SETTINGS,
        getSettings,
        loadSettings,
        saveSettings,
        convStatusLabel,
        statusClass,
        getOrCreateClientId,
        buildQuoteSnapshot,
        buildCalendlyUrl,
        businessHoursText,
        findCatalogItem,
        getServiceExclusions,
        applyServiceExclusions,
        L
    };
})();
