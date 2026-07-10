(function () {
    "use strict";

    const INSTALL_SEEN_KEY = "cad_protocol_install_seen";

    let deferredInstallPrompt = null;
    let installPromptWaiter = null;

    function isStandalone() {
        return (
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true
        );
    }

    function isIos() {
        return /iphone|ipad|ipod/i.test(navigator.userAgent);
    }

    function isInAppBrowser() {
        return /(FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp)/i.test(navigator.userAgent);
    }

    function installSeen() {
        try {
            return localStorage.getItem(INSTALL_SEEN_KEY) === "1";
        } catch (_) {
            return false;
        }
    }

    function markInstallSeen() {
        try {
            localStorage.setItem(INSTALL_SEEN_KEY, "1");
        } catch (_) {}
    }

    function stripInstallQuery() {
        try {
            const url = new URL(location.href);
            if (!url.searchParams.has("install")) return;
            url.searchParams.delete("install");
            history.replaceState(null, "", url.pathname + url.search + url.hash);
        } catch (_) {}
    }

    function setInstallStatus(text) {
        const el = document.getElementById("fb-install-status");
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
            const btn = document.getElementById("fb-install-btn");
            if (btn) {
                btn.disabled = false;
                btn.classList.add("is-ready");
            }
        });

        window.addEventListener("appinstalled", () => {
            deferredInstallPrompt = null;
            markInstallSeen();
            setInstallStatus("Aplikacja zainstalowana.");
            hideInstallUi();
            window.setTimeout(hideInstallSheet, 1500);
        });
    }

    async function refreshInstallUi() {
        const androidBlock = document.getElementById("fb-install-android");
        const iosBlock = document.getElementById("fb-install-ios");
        const inappBlock = document.getElementById("fb-install-inapp");
        const btn = document.getElementById("fb-install-btn");

        if (inappBlock) inappBlock.hidden = !isInAppBrowser();

        if (isInAppBrowser()) {
            if (androidBlock) androidBlock.hidden = true;
            if (iosBlock) iosBlock.hidden = true;
            setInstallStatus("Otwórz tę stronę w Chrome, aby zainstalować aplikację.");
            return;
        }

        if (isIos()) {
            if (androidBlock) androidBlock.hidden = true;
            if (iosBlock) iosBlock.hidden = false;
            setInstallStatus("Safari: Udostępnij → Dodaj do ekranu początkowego.");
            return;
        }

        if (androidBlock) androidBlock.hidden = false;
        if (iosBlock) iosBlock.hidden = true;
        if (btn) {
            btn.hidden = false;
            btn.disabled = true;
            btn.classList.remove("is-ready");
        }

        setInstallStatus("Sprawdzam możliwość instalacji…");
        await waitForInstallPrompt(3000);

        if (deferredInstallPrompt) {
            setInstallStatus("Gotowe — kliknij Zainstaluj.");
            if (btn) {
                btn.disabled = false;
                btn.classList.add("is-ready");
            }
        } else {
            setInstallStatus("Menu Chrome (⋮) → Zainstaluj aplikację / Dodaj do ekranu głównego.");
            if (btn) btn.hidden = true;
        }
    }

    function showInstallSheet() {
        if (isStandalone()) return;
        const sheet = document.getElementById("fb-install-sheet");
        if (!sheet) return;
        sheet.hidden = false;
        document.body.classList.add("fb-install-open");
        refreshInstallUi();
    }

    function hideInstallSheet() {
        const sheet = document.getElementById("fb-install-sheet");
        if (!sheet) return;
        sheet.hidden = true;
        document.body.classList.remove("fb-install-open");
        markInstallSeen();
        stripInstallQuery();
    }

    function hideInstallUi() {
        document.getElementById("fb-install-open-btn")?.classList.add("fb-hidden");
    }

    async function triggerInstall() {
        if (isInAppBrowser()) {
            showInstallSheet();
            return;
        }
        if (!deferredInstallPrompt) {
            await waitForInstallPrompt(3000);
        }
        if (!deferredInstallPrompt) {
            setInstallStatus("Użyj menu przeglądarki, aby dodać aplikację.");
            return;
        }
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
    }

    async function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return false;
        if (location.protocol === "file:") return false;
        try {
            await navigator.serviceWorker.register("./sw.js", { scope: "./" });
            await navigator.serviceWorker.ready;
            return true;
        } catch (e) {
            console.warn("[CAD Protocol] SW:", e);
            return false;
        }
    }

    function bindInstallUi() {
        document.getElementById("fb-install-open-btn")?.addEventListener("click", showInstallSheet);
        document.getElementById("fb-install-btn")?.addEventListener("click", () => triggerInstall());
        document.querySelectorAll("[data-fb-install-dismiss]").forEach((el) => {
            el.addEventListener("click", hideInstallSheet);
        });
    }

    function init() {
        setupInstallPromptCapture();
        bindInstallUi();
        registerServiceWorker();

        if (isStandalone() || installSeen()) {
            hideInstallUi();
            stripInstallQuery();
            return;
        }

        const params = new URLSearchParams(location.search);
        if (params.has("install")) {
            showInstallSheet();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.CAD_ProtocolShell = {
        showInstallSheet,
        hideInstallSheet,
        isStandalone
    };
})();
