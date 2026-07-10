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

    /** Showroom — kinowy złoty burst (canvas) + blask na wierszu usługi. */
    function showroomLuxeReveal() {
        const input = document.getElementById("showroom");
        const row = input?.closest(".service-item");
        if (!row) return;

        row.classList.remove("showroom-activated");
        void row.offsetWidth;
        row.classList.add("showroom-activated");
        window.setTimeout(() => row.classList.remove("showroom-activated"), 3000);

        if (reducedMotion) return;

        try {
            navigator.vibrate?.([10, 35, 18]);
        } catch (_) {
            /* ignore */
        }

        const rect = row.getBoundingClientRect();
        const ox = rect.left + rect.width * 0.14;
        const oy = rect.top + rect.height * 0.5;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const fx = document.createElement("div");
        fx.className = "cad-showroom-fx";
        fx.setAttribute("aria-hidden", "true");

        const flash = document.createElement("div");
        flash.className = "cad-showroom-flash";
        flash.style.setProperty("--sx", `${ox}px`);
        flash.style.setProperty("--sy", `${oy}px`);

        const ring = document.createElement("div");
        ring.className = "cad-showroom-ring";
        ring.style.setProperty("--sx", `${ox}px`);
        ring.style.setProperty("--sy", `${oy}px`);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.scale(dpr, dpr);

        fx.appendChild(flash);
        fx.appendChild(ring);
        fx.appendChild(canvas);
        document.body.appendChild(fx);

        const colors = ["#fffef5", "#f8edd0", "#f2d07a", "#d4af37", "#ffffff", "#c9a227", "#ffe9a8"];
        const particles = [];

        function spawnBurst(cx, cy, count, spread, speedMin, speedMax) {
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * spread;
                const speed = speedMin + Math.random() * (speedMax - speedMin);
                const roll = Math.random();
                const type = roll < 0.12 ? "streak" : roll < 0.34 ? "shard" : roll < 0.58 ? "spark" : "dust";
                particles.push({
                    x: cx + (Math.random() - 0.5) * rect.width * 0.55,
                    y: cy + (Math.random() - 0.5) * rect.height * 0.45,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - (1.2 + Math.random() * 2.4),
                    life: 1,
                    decay: 0.007 + Math.random() * 0.014,
                    size: type === "shard" ? 3.5 + Math.random() * 5.5 : 1.2 + Math.random() * 2.8,
                    rot: Math.random() * Math.PI * 2,
                    vr: (Math.random() - 0.5) * 0.24,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    type
                });
            }
        }

        spawnBurst(ox, oy, 88, 0.55, 2.2, 9.5);
        window.setTimeout(() => spawnBurst(ox, oy, 36, 0.9, 3.5, 11), 120);
        window.setTimeout(() => spawnBurst(ox, oy, 22, 1.2, 1.5, 5.5), 280);

        const start = performance.now();
        const duration = 2600;

        function drawParticle(p) {
            ctx.globalAlpha = Math.max(0, p.life);
            if (p.type === "streak") {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.4;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 3.2, p.y - p.vy * 3.2);
                ctx.stroke();
                return;
            }
            if (p.type === "shard") {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.lineTo(p.size * 0.55, 0);
                ctx.lineTo(0, p.size);
                ctx.lineTo(-p.size * 0.55, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                return;
            }
            ctx.beginPath();
            ctx.fillStyle = p.color;
            if (p.type === "spark") {
                ctx.shadowBlur = 10;
                ctx.shadowColor = "rgba(255, 236, 180, 0.95)";
            }
            ctx.arc(p.x, p.y, p.size * (0.55 + p.life * 0.45), 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        function frame(now) {
            const t = now - start;
            ctx.clearRect(0, 0, w, h);

            const pulse = Math.max(0, 1 - t / 900);
            if (pulse > 0) {
                const grd = ctx.createRadialGradient(ox, oy, 0, ox, oy, 55 + pulse * 160);
                grd.addColorStop(0, `rgba(255, 248, 225, ${0.38 * pulse})`);
                grd.addColorStop(0.35, `rgba(212, 175, 55, ${0.2 * pulse})`);
                grd.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, w, h);
            }

            let alive = 0;
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.055;
                p.vx *= 0.988;
                p.rot += p.vr;
                p.life -= p.decay;
                if (p.life > 0) {
                    alive++;
                    drawParticle(p);
                }
            }

            if (t < duration && alive > 0) {
                requestAnimationFrame(frame);
            } else {
                fx.remove();
            }
        }

        requestAnimationFrame(frame);
        window.setTimeout(() => fx.remove(), duration + 300);
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
        /* wyłączone — bez trybu po wielokrotnym kliknięciu logo */
    }

    function setupServiceFun() {
        document.querySelectorAll(".service").forEach((cb) => {
            cb.addEventListener("change", () => {
                if (cb.checked && !cb.disabled && cb.id === "showroom") {
                    showroomLuxeReveal();
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

    window.CAD_Fun = { confetti: confettiBurst, showroomLuxeReveal, enableFunMode };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
