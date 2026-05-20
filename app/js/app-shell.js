(function () {
    let deferredInstallPrompt = null;
    let installPromptWaiter = null;
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
            /* ignore */
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
        if (isStandaloneMode()) {
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

    function isIos() {
        return /iphone|ipad|ipod/i.test(navigator.userAgent);
    }

    function isInAppBrowser() {
        return /instagram|fbav|fb_iab|fbios|fban|line\/|twitter/i.test(navigator.userAgent);
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

    function setInstallStatus(text) {
        const el = document.getElementById("install-status");
        if (el) el.textContent = text || "";
    }

    function waitForInstallPrompt(timeoutMs) {
        if (deferredInstallPrompt) return Promise.resolve(deferredInstallPrompt);
        return new Promise((resolve) => {
            const timer = window.setTimeout(() => resolve(null), timeoutMs);
            installPromptWaiter = (event) => {
                event.preventDefault();
                deferredInstallPrompt = event;
                window.clearTimeout(timer);
                installPromptWaiter = null;
                resolve(event);
            };
            window.addEventListener("beforeinstallprompt", installPromptWaiter);
        });
    }

    function setupInstallPromptCapture() {
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            if (installPromptWaiter) {
                installPromptWaiter(e);
                installPromptWaiter = null;
            }
            const btn = document.getElementById("install-pwa-btn");
            if (btn) {
                btn.disabled = false;
                btn.classList.add("is-ready");
            }
        });

        window.addEventListener("appinstalled", () => {
            deferredInstallPrompt = null;
            setInstallStatus(appT("installSuccess"));
            window.setTimeout(hideInstallSheet, 2200);
        });
    }

    async function refreshInstallUi() {
        const androidBlock = document.getElementById("install-android-block");
        const iosBlock = document.getElementById("install-ios-block");
        const inappBlock = document.getElementById("install-inapp-block");
        const btn = document.getElementById("install-pwa-btn");

        if (inappBlock) inappBlock.hidden = !isInAppBrowser();

        if (isInAppBrowser()) {
            if (androidBlock) androidBlock.hidden = true;
            if (iosBlock) iosBlock.hidden = true;
            setInstallStatus(appT("installInAppStatus"));
            return;
        }

        if (isIos()) {
            if (androidBlock) androidBlock.hidden = true;
            if (iosBlock) iosBlock.hidden = false;
            setInstallStatus(appT("installIosStatus"));
            return;
        }

        if (androidBlock) androidBlock.hidden = false;
        if (iosBlock) iosBlock.hidden = true;
        if (btn) {
            btn.hidden = false;
            btn.disabled = true;
            btn.classList.remove("is-ready");
        }

        setInstallStatus(appT("installAndroidLoading"));
        await waitForInstallPrompt(8000);

        if (deferredInstallPrompt) {
            setInstallStatus(appT("installAndroidReady"));
            if (btn) {
                btn.disabled = false;
                btn.classList.add("is-ready");
            }
        } else {
            setInstallStatus(appT("installAndroidManual"));
            if (btn) btn.hidden = true;
        }
    }

    function showInstallSheet() {
        const sheet = document.getElementById("install-sheet");
        if (!sheet || isStandaloneMode()) return;
        sheet.hidden = false;
        document.body.classList.add("install-sheet-open");
        refreshInstallUi();
    }

    function hideInstallSheet() {
        const sheet = document.getElementById("install-sheet");
        if (!sheet) return;
        sheet.hidden = true;
        document.body.classList.remove("install-sheet-open");
        localStorage.setItem("cad_install_sheet_seen", "1");
        stripInstallQuery();
    }

    async function triggerPwaInstall() {
        if (isInAppBrowser()) {
            showInstallSheet();
            return;
        }

        if (!deferredInstallPrompt) {
            await waitForInstallPrompt(3000);
        }

        if (!deferredInstallPrompt) {
            setInstallStatus(appT("installAndroidManual"));
            return;
        }

        try {
            await deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
        } catch (e) {
            /* ignore */
        }
        deferredInstallPrompt = null;
    }

    function bindInstallSheet() {
        document.getElementById("install-pwa-btn")?.addEventListener("click", () => triggerPwaInstall());
        document.querySelectorAll("[data-install-dismiss]").forEach((el) => {
            el.addEventListener("click", hideInstallSheet);
        });
        document.getElementById("install-copy-link")?.addEventListener("click", async () => {
            const url = new URL("./index.html?install=1", window.location.href).href;
            try {
                await navigator.clipboard.writeText(url);
                setInstallStatus(appT("installLinkCopied"));
            } catch (e) {
                window.prompt(appT("installCopyPrompt"), url);
            }
        });
    }

    function setupInstallFlow() {
        if (isStandaloneMode()) {
            stripInstallQuery();
            return;
        }

        setupInstallPromptCapture();
        bindInstallSheet();

        const params = new URLSearchParams(location.search);
        if (params.has("install") || isInAppBrowser()) {
            showInstallSheet();
        }
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

    async function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return false;
        try {
            await navigator.serviceWorker.register("./sw.js", { scope: "./" });
            await navigator.serviceWorker.ready;
            return true;
        } catch (e) {
            console.warn("[CAD] Service worker:", e);
            return false;
        }
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
        document.getElementById("install-app-btn")?.addEventListener("click", showInstallSheet);
    }

    function initFromHash() {
        const hash = (location.hash || "").replace("#", "");
        if (["home", "quote", "chat", "book", "more"].includes(hash)) showPanel(hash);
        else showPanel("home");
    }

    async function init() {
        applyTheme(localStorage.getItem(THEME_KEY) || "dark");
        setLocale(window.CAD_APP.locale);
        bindNav();
        setupStandalone();
        bindAppMessages();
        await registerServiceWorker();
        setupInstallFlow();
        initFromHash();
        window.CAD_ChatClient?.init();
        window.CAD_AppHome?.init();
    }

    window.CAD_showInstallSheet = showInstallSheet;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.showPanel = showPanel;
})();
