(function () {
    const cfg = window.CAD_CONFIG;
    if (!cfg) return;

    function highlightRecommendation(size) {
        const id = cfg.recommendBySize && cfg.recommendBySize[size];
        document.querySelectorAll(".service-item").forEach((item) => item.classList.remove("service-recommended"));
        if (!id) return;
        const input = document.getElementById(id);
        const item = input?.closest(".service-item");
        if (item) item.classList.add("service-recommended");
    }

    function setupRecommendations() {
        const sizeSelect = document.getElementById("car-size");
        if (!sizeSelect) return;
        const run = () => highlightRecommendation(sizeSelect.value);
        sizeSelect.addEventListener("change", run);
        document.querySelectorAll(".size-option").forEach((opt) => {
            opt.addEventListener("click", () => setTimeout(run, 0));
        });
        run();
    }

    function setupReveal() {
        const nodes = document.querySelectorAll(
            ".gallery-section, .reviews-section, .safety-section, .brands-section, .brand-pillars-minimal, .instagram-container"
        );
        nodes.forEach((el) => el.classList.add("reveal-hidden"));
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("revealed");
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );
        nodes.forEach((el) => obs.observe(el));
    }

    function init() {
        setupRecommendations();
        setupReveal();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
