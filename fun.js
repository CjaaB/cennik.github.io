(function () {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let toastHost = null;
    let logoClickCount = 0;
    let logoClickTimer = null;
    let konamiIndex = 0;
    const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

    function ensureToastHost() {
        if (toastHost) return toastHost;
        toastHost = document.createElement("di" + "v");
        toastHost.className = "cad-toast-host";
        toastHost.setAttribute("aria-live", "polite");
        document.body.appendChild(toastHost);
        return toastHost;
    }

    function toast(message, icon) {
        if (!message) return;
        const host = ensureToastHost();
        const el = document.createElement("di" + "v");
        el.className = "cad-toast";
        el.innerHTML = `<span class="cad-toast-icon">${icon || "✨"}</span><span class="cad-toast-text">${message}</span>`;
        host.appendChild(el);
        requestAnimationFrame(() => el.classList.add("show"));
        setTimeout(() => {
            el.classList.remove("show");
            setTimeout(() => el.remove(), 400);
        }, 3200);
    }

    function confettiBurst() {
        if (reducedMotion) return;
        const colors = ["#d4af37", "#fff3b0", "#ffffff", "#c9a227"];
        for (let i = 0; i < 42; i++) {
            const p = document.createElement("span");
            p.className = "cad-confetti";
            p.style.left = 50 + (Math.random() - 0.5) * 40 + "vw";
            p.style.top = "35vh";
            p.style.background = colors[i % colors.length];
            p.style.setProperty("--dx", (Math.random() - 0.5) * 220 + "px");
            p.style.setProperty("--dy", 120 + Math.random() * 280 + "px");
            p.style.setProperty("--rot", Math.random() * 720 + "deg");
            p.style.animationDelay = Math.random() * 0.25 + "s";
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 2200);
        }
    }

    /** Detail God Mode: złoty blask nagłówka + pulsująca karta wyceny (bez zmiany cen). */
    function enableFunMode() {
        if (document.body.classList.contains("cad-fun-mode")) return;
        document.body.classList.add("cad-fun-mode");
        toast("Detail God Mode — złoty blask aktywny.", "👑");
        confettiBurst();
        const tagline = document.querySelector(".tagline");
        if (tagline) {
            const prev = tagline.textContent;
            tagline.textContent = "DETAIL GOD MODE";
            tagline.classList.add("tagline-glitch");
            setTimeout(() => {
                tagline.textContent = prev;
                tagline.classList.remove("tagline-glitch");
            }, 5000);
        }
    }

    function setupLogoEasterEgg() {
        const logoContainer = document.querySelector(".logo-container");
        if (!logoContainer) return;

        logoContainer.addEventListener("click", () => {
            logoClickCount++;
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => {
                logoClickCount = 0;
            }, 700);

            if (logoClickCount === 5) {
                logoClickCount = 0;
                logoContainer.classList.add("easter-egg-active");
                enableFunMode();
            }
        });
    }

    function setupServiceFun() {
        document.querySelectorAll(".service").forEach((cb) => {
            cb.addEventListener("change", () => {
                if (cb.checked && !cb.disabled && cb.id === "showroom") {
                    confettiBurst();
                }
            });
        });
    }

    function setupKonami() {
        document.addEventListener("keydown", (e) => {
            if (e.key === konami[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konami.length) {
                    konamiIndex = 0;
                    enableFunMode();
                }
            } else {
                konamiIndex = 0;
            }
        });
    }

    function setupSummaryWiggle() {
        const total = document.getElementById("res-gross");
        if (!total) return;
        let last = 0;
        document.addEventListener("cad:recalculate-display", () => {
            const val = parseInt(total.textContent, 10) || 0;
            if (val > 400 && val !== last) {
                total.classList.add("price-wow");
                setTimeout(() => total.classList.remove("price-wow"), 600);
            }
            last = val;
        });
    }

    function init() {
        setupLogoEasterEgg();
        setupServiceFun();
        setupKonami();
        setupSummaryWiggle();
    }

    window.CAD_Fun = { confetti: confettiBurst, enableFunMode };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
