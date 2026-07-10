(function () {
    "use strict";

    const FA_MAP = {
        "fa-calculator": "calculator",
        "fa-calendar-check": "calendar-check",
        "fa-calendar-alt": "calendar",
        "fa-mobile-screen": "smartphone",
        "fa-mobile-alt": "smartphone",
        "fa-arrow-right": "arrow-right",
        "fa-file-signature": "clipboard-signature",
        "fa-spray-can": "spray-can",
        "fa-spray-can-sparkles": "sparkles",
        "fa-chevron-left": "chevron-left",
        "fa-chevron-right": "chevron-right",
        "fa-chevron-down": "chevron-down",
        "fa-check": "check",
        "fa-sparkles": "sparkles",
        "fa-clipboard-list": "clipboard-list",
        "fa-search": "search",
        "fa-shield-alt": "shield-check",
        "fa-shield-halved": "shield-check",
        "fa-download": "download",
        "fa-car-side": "car",
        "fa-cloud-sun": "cloud-sun",
        "fa-address-card": "contact",
        "fa-file-pdf": "file-down",
        "fa-file-contract": "file-text",
        "fa-file-invoice-dollar": "receipt",
        "fa-tags": "tags",
        "fa-key": "key-round",
        "fa-child": "baby",
        "fa-comments": "messages-square",
        "fa-book-open": "book-open",
        "fa-sun": "sun",
        "fa-moon": "moon",
        "fa-location-dot": "map-pin",
        "fa-location-crosshairs": "locate-fixed",
        "fa-times": "x",
        "fa-sync-alt": "refresh-cw",
        "fa-th-large": "layout-grid",
        "fa-images": "images",
        "fa-ellipsis-h": "ellipsis",
        "fa-external-link-alt": "external-link",
        "fa-camera": "camera",
        "fa-paper-plane": "send",
        "fa-envelope": "mail",
        "fa-user": "user",
        "fa-bell": "bell",
        "fa-eraser": "eraser",
        "fa-share-alt": "share-2",
        "fa-globe": "globe",
        "fa-couch": "sofa",
        "fa-hand-sparkles": "sparkles",
        "fa-star": "star",
        "fa-gears": "cog",
        "fa-gem": "gem",
        "fa-smog": "cloud-fog",
        "fa-cloud-rain": "cloud-rain",
        "fa-snowflake": "snowflake",
        "fa-bolt": "zap",
        "fa-cloud": "cloud",
        "fa-circle-info": "info",
        "fa-droplet": "droplet",
        "fa-wind": "wind",
        "fa-print": "printer",
        "fa-images": "images",
        "fa-compact-disc": "disc-3",
        "fa-wand-magic-sparkles": "sparkles",
        "fa-paw": "paw-print",
        "fa-car-battery": "battery",
        "fa-triangle-exclamation": "triangle-alert",
        "fa-cloud-sun-rain": "cloud-sun-rain",
        "fa-trash-alt": "trash-2"
    };

    const BRAND = {
        "fa-whatsapp":
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.917l4.458-1.495A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.37l-.36-.214-3.003 1.008 1.008-3.003-.214-.36A9.818 9.818 0 1 1 12 21.818z"/></svg>',
        "fa-instagram":
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm11 1.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>'
    };

    const ICON_ATTRS = { "stroke-width": 2, "aria-hidden": "true" };
    const STYLE_CLASSES = new Set(["fa-solid", "fa-regular", "fa-brands", "fab", "fas", "far", "fa-light", "fa-thin"]);
    let lucideLoading = false;

    function lucideUrl() {
        const self = [...document.scripts].find((s) => s.src && s.src.includes("cad-icons.js"));
        if (self?.src) return self.src.replace(/cad-icons\.js.*$/, "vendor/lucide.min.js");
        return "site/js/vendor/lucide.min.js";
    }

    function faKey(el) {
        for (const cls of el.classList) {
            if (cls.startsWith("fa-") && !STYLE_CLASSES.has(cls)) return cls;
        }
        return null;
    }

    function replaceIcon(el) {
        if (!el || el.closest(".cad-ico-wrap, .cad-ico-brand")) return false;
        const key = faKey(el);
        if (!key) return false;

        if (BRAND[key]) {
            const brand = document.createElement("span");
            brand.className = `cad-ico-brand cad-ico-brand--${key === "fa-whatsapp" ? "whatsapp" : "instagram"}`;
            brand.innerHTML = BRAND[key];
            if (el.getAttribute("aria-hidden")) brand.setAttribute("aria-hidden", "true");
            el.replaceWith(brand);
            return true;
        }

        const lucideName = FA_MAP[key];
        if (!lucideName || !window.lucide) return false;

        const wrap = document.createElement("span");
        wrap.className = "cad-ico-wrap";
        if (el.getAttribute("aria-hidden")) wrap.setAttribute("aria-hidden", "true");
        const extraClass = el.className.replace(/\bfa[srb]?-?\S+/g, "").trim();
        if (extraClass) wrap.className += ` ${extraClass}`;
        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", lucideName);
        wrap.appendChild(icon);
        el.replaceWith(wrap);
        return true;
    }

    function paintLucide(root) {
        if (!window.lucide) return;
        const options = { attrs: ICON_ATTRS };
        if (root && root.nodeType === 1) options.root = root;
        window.lucide.createIcons(options);
    }

    function refresh(root) {
        if (!window.lucide) return;
        const scope = root || document;
        scope.querySelectorAll('i[class*="fa-"]').forEach(replaceIcon);
        paintLucide(scope === document ? document.body : scope);
    }

    function ensureLucide() {
        if (window.lucide) return Promise.resolve(true);
        if (lucideLoading) {
            return new Promise((resolve) => {
                const wait = () => {
                    if (window.lucide) resolve(true);
                    else setTimeout(wait, 30);
                };
                wait();
            });
        }
        lucideLoading = true;
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = lucideUrl();
            script.async = true;
            script.onload = () => resolve(Boolean(window.lucide));
            script.onerror = () => resolve(false);
            document.head.appendChild(script);
        });
    }

    window.CAD_Icons = {
        refresh,
        set(host, name) {
            if (!host || !window.lucide) return false;
            let wrap = host.querySelector(".cad-ico-wrap");
            if (!wrap) {
                wrap = document.createElement("span");
                wrap.className = "cad-ico-wrap";
                host.replaceChildren(wrap);
            }
            let icon = wrap.querySelector("[data-lucide]");
            if (!icon) {
                icon = document.createElement("i");
                wrap.appendChild(icon);
            }
            icon.setAttribute("data-lucide", name);
            icon.replaceChildren();
            paintLucide(wrap);
            return true;
        }
    };

    function boot() {
        ensureLucide().then((ok) => {
            if (!ok) return;
            try {
                refresh();
            } catch (err) {
                console.warn("[CAD icons]", err);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
