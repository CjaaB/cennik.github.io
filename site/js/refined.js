/**
 * Car All Detailing — refined interactions (no dependencies)
 */
(function () {
    "use strict";

    const REVEAL_SELECTORS = [
        ".home-front",
        ".home-process-section",
        ".gallery-section",
        ".location-section",
        ".safety-section",
        ".quote-hub",
        ".weather-hub",
        ".brands-section"
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
            const staggerGrid = el.querySelector("[data-home-stagger]");
            if (staggerGrid) {
                staggerGrid.classList.add("cad-refined-reveal");
                staggerGrid.setAttribute("data-refined-stagger", "");
            }
        });

        const revealNow = (el) => {
            el.classList.add("cad-refined-visible");
            el.querySelector("[data-home-stagger]")?.classList.add("cad-refined-visible");
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("cad-refined-visible");
                    entry.target.querySelector("[data-home-stagger]")?.classList.add("cad-refined-visible");
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
        );

        targets.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.94) revealNow(el);
            observer.observe(el);
        });
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

    function setupProcessSteps() {
        const section = document.querySelector("[data-home-process]");
        const steps = Array.from(document.querySelectorAll("[data-home-step]"));
        const fill = document.getElementById("home-process-fill");
        if (!section || !steps.length) return;

        const setActive = (index) => {
            steps.forEach((step, i) => {
                step.classList.toggle("is-active", i === index);
                step.classList.toggle("is-done", i < index);
            });
        };

        const updateProgress = () => {
            const viewportAnchor = window.innerHeight * 0.44;
            const first = steps[0].getBoundingClientRect();
            const last = steps[steps.length - 1].getBoundingClientRect();
            const startY = first.top + first.height * 0.35;
            const endY = last.top + last.height * 0.65;
            const span = Math.max(endY - startY, 1);
            const progress = Math.min(Math.max((viewportAnchor - startY) / span, 0), 1);

            if (fill) {
                fill.style.width = `${12 + progress * 88}%`;
            }

            const activeIdx = progress >= 0.98
                ? steps.length - 1
                : Math.min(steps.length - 1, Math.floor(progress * steps.length));
            setActive(activeIdx);
        };

        setActive(0);
        if (fill) fill.style.width = "12%";

        if (prefersReducedMotion.matches) {
            steps.forEach((s) => s.classList.add("is-active"));
            if (fill) fill.style.width = "100%";
            return;
        }

        let frame = null;
        const onScroll = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(() => {
                frame = null;
                updateProgress();
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        updateProgress();
    }

    function setupGalleryCarousel(viewport) {
        const carousel = document.querySelector("[data-gallery-carousel]");
        if (!carousel || !viewport) return;

        const step = () => {
            const item = viewport.querySelector(".gallery-item");
            if (!item) return 0;
            const styles = getComputedStyle(viewport.querySelector(".gallery-carousel__track") || viewport);
            const gap = parseFloat(styles.columnGap || styles.gap || "12") || 12;
            return item.getBoundingClientRect().width + gap;
        };

        const scrollByStep = (dir) => {
            const amount = step() * dir;
            const max = viewport.scrollWidth - viewport.clientWidth;
            if (dir > 0 && viewport.scrollLeft >= max - 6) {
                viewport.scrollTo({ left: 0, behavior: "smooth" });
                return;
            }
            if (dir < 0 && viewport.scrollLeft <= 6) {
                viewport.scrollTo({ left: max, behavior: "smooth" });
                return;
            }
            viewport.scrollBy({ left: amount, behavior: "smooth" });
        };

        carousel.querySelector('[data-gallery-scroll="prev"]')?.addEventListener("click", () => scrollByStep(-1));
        carousel.querySelector('[data-gallery-scroll="next"]')?.addEventListener("click", () => scrollByStep(1));

        if (prefersReducedMotion.matches) return;

        let timer = window.setInterval(() => scrollByStep(1), 4800);
        const pause = () => window.clearInterval(timer);
        const resume = () => {
            pause();
            timer = window.setInterval(() => scrollByStep(1), 4800);
        };
        carousel.addEventListener("mouseenter", pause);
        carousel.addEventListener("mouseleave", resume);
        carousel.addEventListener("focusin", pause);
        carousel.addEventListener("focusout", resume);
    }

    async function setupGallery() {
        const grid = document.querySelector("[data-gallery-grid]");
        const viewport = document.querySelector("[data-gallery-viewport]");
        const carousel = document.querySelector("[data-gallery-carousel]");
        const empty = document.querySelector("[data-gallery-empty]");
        if (!grid) return;

        const hasItems = grid.querySelector(".gallery-item");
        if (hasItems) {
            if (carousel) carousel.hidden = false;
            if (empty) empty.hidden = true;
            setupGalleryCarousel(viewport);
            setupGalleryLightbox();
            return;
        }

        if (carousel) carousel.hidden = true;
        if (empty) empty.hidden = false;
    }

    function setupGalleryLightbox() {
        const grid = document.querySelector("[data-gallery-grid]");
        const lightbox = document.getElementById("galleryLightbox");
        if (!grid || !lightbox) return;

        const items = Array.from(grid.querySelectorAll(".gallery-item"));
        const img = lightbox.querySelector(".gallery-lightbox__img");
        const caption = lightbox.querySelector(".gallery-lightbox__caption");
        let index = 0;

        const show = (nextIndex) => {
            if (!items.length) return;
            index = (nextIndex + items.length) % items.length;
            const item = items[index];
            const src = item.getAttribute("data-gallery-src") || item.querySelector("img")?.getAttribute("src") || "";
            const alt = item.getAttribute("data-gallery-alt") || item.querySelector("img")?.getAttribute("alt") || "";
            if (img) {
                img.src = src;
                img.alt = alt;
            }
            if (caption) caption.textContent = "";
            lightbox.hidden = false;
            lightbox.setAttribute("aria-hidden", "false");
            document.body.classList.add("gallery-lightbox-open");
        };

        const hide = () => {
            lightbox.hidden = true;
            lightbox.setAttribute("aria-hidden", "true");
            document.body.classList.remove("gallery-lightbox-open");
            if (img) img.removeAttribute("src");
        };

        items.forEach((item, i) => {
            item.addEventListener("click", () => show(i));
        });

        lightbox.querySelector("[data-gallery-close]")?.addEventListener("click", hide);
        lightbox.querySelector("[data-gallery-prev]")?.addEventListener("click", () => show(index - 1));
        lightbox.querySelector("[data-gallery-next]")?.addEventListener("click", () => show(index + 1));

        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox) hide();
        });

        document.addEventListener("keydown", (e) => {
            if (lightbox.hidden) return;
            if (e.key === "Escape") hide();
            if (e.key === "ArrowLeft") show(index - 1);
            if (e.key === "ArrowRight") show(index + 1);
        });
    }

    function init() {
        applyReducedMotion();
        prefersReducedMotion.addEventListener("change", applyReducedMotion);
        setupScrollReveal();
        setupHeroSpotlight();
        setupGlossaryModalReveal();
        setupProcessSteps();
        setupGallery();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
