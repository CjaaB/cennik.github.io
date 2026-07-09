(function () {
    const FLAGS = {
        pl: '<svg class="cad-flag" viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="8" fill="#ffffff"/><rect y="8" width="24" height="8" fill="#dc143c"/></svg>',
        nl: '<svg class="cad-flag" viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="5.33" fill="#ae1c28"/><rect y="5.33" width="24" height="5.34" fill="#ffffff"/><rect y="10.67" width="24" height="5.33" fill="#21468b"/></svg>',
        en: '<svg class="cad-flag" viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" fill="#012169"/><path d="M0,0 L24,16 M24,0 L0,16" stroke="#ffffff" stroke-width="3"/><path d="M0,0 L24,16 M24,0 L0,16" stroke="#c8102e" stroke-width="1.5"/><path d="M12,0 V16 M0,8 H24" stroke="#ffffff" stroke-width="5"/><path d="M12,0 V16 M0,8 H24" stroke="#c8102e" stroke-width="3"/></svg>'
    };

    const LABELS = { pl: "Polski", nl: "Nederlands", en: "English" };
    const boundRoots = new Set();
    let globalHandlersBound = false;

    function bindGlobalHandlers() {
        if (globalHandlersBound) return;
        globalHandlersBound = true;

        document.addEventListener("click", (e) => {
            boundRoots.forEach((root) => {
                if (!root.isConnected) {
                    boundRoots.delete(root);
                    return;
                }
                if (!root.contains(e.target)) close(root);
            });
        });

        document.addEventListener("keydown", (e) => {
            if (e.key !== "Escape") return;
            boundRoots.forEach((root) => close(root));
        });
    }

    function createHTML() {
        const options = ["pl", "nl", "en"]
            .map(
                (code) =>
                    `<button type="button" class="cad-lang-option" role="option" data-locale-btn="${code}" aria-label="${LABELS[code]}">${FLAGS[code]}<span>${LABELS[code]}</span></button>`
            )
            .join("");

        return `<div class="cad-lang-switch">
            <button type="button" class="cad-lang-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="Język">
                <span class="cad-lang-trigger__flag" data-current-flag></span>
            </button>
            <div class="cad-lang-menu" hidden role="listbox">${options}</div>
        </div>`;
    }

    function sync(root, locale) {
        if (!root) return;
        const code = locale === "nl" || locale === "en" ? locale : "pl";
        const flagHost = root.querySelector("[data-current-flag]");
        if (flagHost) flagHost.innerHTML = FLAGS[code] || FLAGS.pl;

        root.querySelectorAll(".cad-lang-option").forEach((btn) => {
            const on = btn.getAttribute("data-locale-btn") === code;
            btn.classList.toggle("is-active", on);
            btn.setAttribute("aria-selected", on ? "true" : "false");
        });

        const trigger = root.querySelector(".cad-lang-trigger");
        if (trigger) {
            const label = LABELS[code] || LABELS.pl;
            trigger.setAttribute("aria-label", label);
            trigger.title = label;
        }
    }

    function close(root) {
        if (!root) return;
        root.classList.remove("is-open");
        const trigger = root.querySelector(".cad-lang-trigger");
        const menu = root.querySelector(".cad-lang-menu");
        if (menu) menu.hidden = true;
        if (trigger) trigger.setAttribute("aria-expanded", "false");
    }

    function open(root) {
        if (!root) return;
        root.classList.add("is-open");
        const trigger = root.querySelector(".cad-lang-trigger");
        const menu = root.querySelector(".cad-lang-menu");
        if (menu) menu.hidden = false;
        if (trigger) trigger.setAttribute("aria-expanded", "true");
    }

    function bind(root, getLocale, setLocale) {
        if (!root || root.dataset.langBound) return root;
        root.dataset.langBound = "1";
        bindGlobalHandlers();
        boundRoots.add(root);

        const trigger = root.querySelector(".cad-lang-trigger");
        const menu = root.querySelector(".cad-lang-menu");

        trigger?.addEventListener("click", (e) => {
            e.stopPropagation();
            if (root.classList.contains("is-open")) close(root);
            else open(root);
        });

        menu?.querySelectorAll("[data-locale-btn]").forEach((btn) => {
            btn.addEventListener("pointerdown", (e) => {
                e.stopPropagation();
            });
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const next = btn.getAttribute("data-locale-btn");
                if (!next) return;
                setLocale(next);
                sync(root, next);
                close(root);
            });
        });

        sync(root, getLocale());
        return root;
    }

    function mountFixed(getLocale, setLocale) {
        if (document.querySelector(".cad-lang-switch--fixed")) {
            return document.querySelector(".cad-lang-switch--fixed");
        }
        const wrap = document.createElement("div");
        wrap.className = "cad-lang-switch-host cad-lang-switch-host--fixed";
        wrap.innerHTML = createHTML();
        const root = wrap.querySelector(".cad-lang-switch");
        root.classList.add("cad-lang-switch--fixed");
        document.body.appendChild(wrap);
        return bind(root, getLocale, setLocale);
    }

    function mountInline(host, getLocale, setLocale) {
        if (!host) return null;
        host.innerHTML = createHTML();
        const root = host.querySelector(".cad-lang-switch");
        root.classList.add("cad-lang-switch--inline");
        return bind(root, getLocale, setLocale);
    }

    window.CAD_LangSwitch = {
        mountFixed,
        mountInline,
        syncAll(locale) {
            document.querySelectorAll(".cad-lang-switch").forEach((root) => sync(root, locale));
        },
        FLAGS,
        LABELS
    };
})();
