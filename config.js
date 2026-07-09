window.CAD_CONFIG = {
    defaultLocale: "pl",
    defaultCurrency: "EUR",
    whatsappNumber: "48731693089",

    // Zapasowy kurs, gdy API NBP/ECB nie odpowie (na zywo pobiera app.js)
    eurToPlnFallback: 4.32,
    eurToPln: 4.32,

    // Google Analytics 4: wklej ID pomiaru z panelu GA (np. "G-XXXXXXXXXX").
    // Zostaw puste "", jesli nie uzywasz jeszcze statystyk.
    gaMeasurementId: "",
    stateMaxAgeMs: 30 * 24 * 60 * 60 * 1000,
    storageKeys: {
        calculator: "cad_calculator_state_v2",
        consent: "cad_cookie_consent_v1",
        locale: "cad_locale_v1",
        currency: "cad_currency_v1",
        eurPlnCache: "cad_eur_pln_cache_v1"
    },
    validSizes: ["S", "M", "L", "XL", "XXL"],
    weather: {
        enabled: true,
        locationName: "Maarssen",
        latitude: 52.1392,
        longitude: 5.0413
    }
};
