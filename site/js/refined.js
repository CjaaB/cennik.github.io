/**
 * Car All Detailing — refined interactions (no dependencies)
 */
(function () {
    "use strict";

    const REVEAL_SELECTORS = [
        ".size-selector",
        ".calculator-container",
        ".brands-section",
        ".safety-section"
    ];

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function applyReducedMotion() {
        document.body.classList.toggle("cad-reduced-motion", prefersReducedMotion.matches);
    }

    function setupScrollReveal() {
        if (prefersReducedMotion.matches) return;

        const targets = REVEAL_SELECTORS
            .map((selector) => document.querySelector(selector))
            .filter(Boolean);

        if (!targets.length) return;

        targets.forEach((el) => {
            el.classList.add("cad-refined-reveal");
            if (el.classList.contains("size-selector")) {
                el.setAttribute("data-refined-stagger", "");
            }
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("cad-refined-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
        );

        targets.forEach((el) => observer.observe(el));
    }

    function setupHeroSpotlight() {
        if (prefersReducedMotion.matches) return;
        if (!window.matchMedia("(pointer: fine)").matches) return;

        const header = document.querySelector(".main-header");
        if (!header) return;

        let frame = null;

        header.addEventListener(
            "mousemove",
            (event) => {
                const rect = header.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;

                if (frame) cancelAnimationFrame(frame);
                frame = requestAnimationFrame(() => {
                    header.style.setProperty("--hero-spot-x", `${x}%`);
                    header.style.setProperty("--hero-spot-y", `${y}%`);
                });
            },
            { passive: true }
        );

        header.addEventListener(
            "mouseleave",
            () => {
                header.style.setProperty("--hero-spot-x", "50%");
                header.style.setProperty("--hero-spot-y", "42%");
            },
            { passive: true }
        );
    }

    function setupGlossaryModalReveal() {
        const modal = document.getElementById("infoModal");
        if (!modal) return;

        const head = modal.querySelector(".glossary-modal-head");
        const accordion = modal.querySelector(".glossary-accordion");

        if (head) head.classList.add("cad-refined-reveal");
        if (accordion) {
            accordion.classList.add("cad-refined-reveal");
            accordion.setAttribute("data-refined-stagger", "");
        }

        const reveal = () => {
            const content = modal.querySelector(".modal-content--glossary");
            if (content) content.scrollTop = 0;

            if (prefersReducedMotion.matches) {
                head?.classList.add("cad-refined-visible");
                accordion?.classList.add("cad-refined-visible");
                return;
            }
            requestAnimationFrame(() => {
                head?.classList.add("cad-refined-visible");
                accordion?.classList.add("cad-refined-visible");
            });
        };

        const reset = () => {
            head?.classList.remove("cad-refined-visible");
            accordion?.classList.remove("cad-refined-visible");
        };

        const observer = new MutationObserver(() => {
            if (modal.style.display === "flex") reveal();
            else reset();
        });

        observer.observe(modal, { attributes: true, attributeFilter: ["style"] });
    }

    function init() {
        applyReducedMotion();
        prefersReducedMotion.addEventListener("change", applyReducedMotion);
        setupScrollReveal();
        setupHeroSpotlight();
        setupGlossaryModalReveal();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
