(function () {
    let deferredInstallPrompt = null;
    const THEME_KEY = "cad_app_theme";

    window.CAD_APP = {
        locale: localStorage.getItem("cad_app_locale") || "pl",
        panel: "home"
    };

    function setLocale(lang) {
        const next = ["pl", "nl", "en"].includes(lang) ? lang : "pl";
        window.CAD_APP.locale = next;
        localStorage.setItem("cad_app_locale", next);
        document.querySelectorAll("[data-locale]").forEach((btn) => {
            btn.classList.toggle("active", btn.getAttribute("data-locale") === next);
        });
        applyAppI18n();
        syncQuoteFrameLang();
    }

    function syncQuoteFrameLang() {
        const frame = document.getElementById("quote-frame");
        if (!frame || !frame.contentWindow) return;
        try {
            frame.contentWindow.postMessage({ type: "cad:set-locale", locale: window.CAD_APP.locale }, "*");
        } catch (e) {
            /* cross-origin safe ignore */
        }
    }

    function setQuoteFrameActive(active) {
        const frame = document.getElementById("quote-frame");
        if (!frame) return;
        frame.style.pointerEvents = active ? "auto" : "none";
        frame.setAttribute("aria-hidden", active ? "false" : "true");
        if (!active) {
            try {
                frame.contentWindow?.blur();
            } catch (e) {
                /* ignore */
            }
        }
    }

    function setBookFrameActive(active) {
        const frame = document.getElementById("book-frame");
        if (!frame) return;
        frame.style.pointerEvents = active ? "auto" : "none";
        frame.setAttribute("aria-hidden", active ? "false" : "true");
    }

    function showPanel(name) {
        if (!["home", "quote", "chat", "book", "more"].includes(name)) name = "home";
        window.CAD_APP.panel = name;
        document.querySelectorAll(".app-panel").forEach((p) => {
            p.classList.toggle("active", p.dataset.panel === name);
        });
        document.querySelectorAll(".nav-btn").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.panel === name);
        });
        setQuoteFrameActive(name === "quote");
        setBookFrameActive(name === "book");
        if (name === "quote") loadQuoteFrame();
        if (name === "home") window.CAD_AppHome?.refreshQuoteResume();
        if (name === "chat") window.CAD_ChatClient?.clearUnread?.();
        try {
            history.replaceState(null, "", name === "home" ? location.pathname + location.search : `#${name}`);
        } catch (e) {
            location.hash = name === "home" ? "" : name;
        }
    }

    function loadQuoteFrame() {
        const frame = document.getElementById("quote-frame");
        if (!frame) return;
        if (frame.dataset.loaded === "1") {
            syncQuoteFrameLang();
            return;
        }
        const lang = window.CAD_APP.locale;
        frame.src = `./quote.html?lang=${encodeURIComponent(lang)}`;
        frame.dataset.loaded = "1";
        frame.addEventListener("load", () => syncQuoteFrameLang(), { once: true });
    }

    function applyTheme(theme) {
        const isLight = theme === "light";
        document.body.classList.toggle("theme-light", isLight);
        localStorage.setItem(THEME_KEY, theme);
        const icon = document.querySelector("#theme-toggle i");
        if (icon) icon.className = isLight ? "fas fa-moon" : "fas fa-sun";
    }

    function toggleTheme() {
        const next = document.body.classList.contains("theme-light") ? "dark" : "light";
        applyTheme(next);
    }

    function setupStandalone() {
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true;
        if (isStandalone) {
            document.body.classList.add("cad-standalone");
        }
    }

    function bindAppMessages() {
        window.addEventListener("message", (event) => {
            if (event.data?.type === "cad:open-panel" && event.data.panel) {
                showPanel(event.data.panel);
            }
        });
    }

    function isStandaloneMode() {
        return (
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true
        );
    }

    function stripInstallQuery() {
        try {
            const url = new URL(location.href);
            if (!url.searchParams.has("install")) return;
            url.searchParams.delete("install");
            history.replaceState(null, "", url.pathname + url.hash + (url.search || ""));
        } catch (e) {
            /* ignore */
        }
    }

    function setupAutoInstallFromWebsite() {
        if (isStandaloneMode()) {
            stripInstallQuery();
            return;
        }

        const params = new URLSearchParams(location.search);
        if (!params.has("install")) return;

        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            if (params.has("install")) {
                e.prompt().then(() => {
                    deferredInstallPrompt = null;
                    stripInstallQuery();
                }).catch(() => {
                    stripInstallQuery();
                });
            }
        });

        if (isIos) {
            stripInstallQuery();
            return;
        }

        window.setTimeout(() => {
            if (!deferredInstallPrompt) stripInstallQuery();
        }, 12000);
    }

    async function shareApp() {
        const url = new URL("./index.html", window.location.href).href;
        const shareData = {
            title: "Car All Detailing",
            text: appT("moreShareText"),
            url
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (e) {
                /* cancelled */
            }
        }
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            alert(url);
        }
    }

    function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return;
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    }

    function bindNav() {
        document.querySelector(".app-nav")?.addEventListener("click", (e) => {
            const btn = e.target.closest(".nav-btn");
            if (!btn?.dataset.panel) return;
            e.preventDefault();
            showPanel(btn.dataset.panel);
        });

        document.getElementById("app-root")?.addEventListener("click", (e) => {
            const link = e.target.closest("[data-goto]");
            if (!link?.dataset.goto) return;
            e.preventDefault();
            showPanel(link.dataset.goto);
        });

        document.querySelectorAll("[data-locale]").forEach((btn) => {
            btn.addEventListener("click", () => setLocale(btn.getAttribute("data-locale")));
        });
        document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
        document.getElementById("share-app-btn")?.addEventListener("click", shareApp);
    }

    function initFromHash() {
        const hash = (location.hash || "").replace("#", "");
        if (["home", "quote", "chat", "book", "more"].includes(hash)) showPanel(hash);
        else showPanel("home");
    }

    function init() {
        applyTheme(localStorage.getItem(THEME_KEY) || "dark");
        setLocale(window.CAD_APP.locale);
        bindNav();
        setupStandalone();
        bindAppMessages();
        setupAutoInstallFromWebsite();
        registerServiceWorker();
        initFromHash();
        window.CAD_ChatClient?.init();
        window.CAD_AppHome?.init();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.showPanel = showPanel;
})();
