(() => {
  const bar = document.getElementById("scroll-bar");
  const nav = document.getElementById("nav");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rules = window.CAD_QuoteRules;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* Refresh always starts clean at the top */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
  }
  window.scrollTo(0, 0);

  function syncChrome(scrollY) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? (scrollY / max) * 100 : 0;
    if (bar) bar.style.width = `${p}%`;
    if (nav) nav.classList.toggle("is-solid", scrollY > 24);
  }

  /* —— Smooth scroll (Lenis) + GSAP —— */
  let lenis = null;
  const coarseOrNarrow = window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
  if (!reduced && !coarseOrNarrow && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });
    window.__cadLenis = lenis;
    document.documentElement.classList.add("lenis");
    lenis.on("scroll", ({ scroll }) => {
      syncChrome(scroll);
      if (hasGsap) window.ScrollTrigger.update();
    });
    if (hasGsap) {
      window.gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + (lenis.scroll || window.scrollY) - 72;
        lenis.scrollTo(top);
      });
    });
  } else {
    window.addEventListener("scroll", () => syncChrome(window.scrollY), { passive: true });
    syncChrome(window.scrollY);
  }

  function splitHeadings() {
    document.querySelectorAll("[data-split]").forEach((el) => {
      if (el.dataset.splitDone) return;
      const text = el.textContent.trim();
      el.setAttribute("aria-label", text);
      el.textContent = "";
      const line = document.createElement("span");
      line.className = "split-line";
      const inner = document.createElement("span");
      inner.className = "split-line__inner";
      inner.textContent = text;
      line.appendChild(inner);
      el.appendChild(line);
      el.dataset.splitDone = "1";
    });
  }
  splitHeadings();

  function markIn(el) {
    el.classList.add("is-in");
    if (el.hasAttribute("data-split") || el.querySelector("[data-split]")) {
      (el.hasAttribute("data-split") ? el : el.querySelector("[data-split]"))?.classList.add("is-split");
    }
    el.querySelectorAll("[data-split]").forEach((h) => h.classList.add("is-split"));
  }

  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          markIn(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    document.querySelectorAll("[data-reveal], [data-split]").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll("[data-reveal], [data-split]").forEach((el) => markIn(el));
  }

  const video = document.querySelector(".hero__video");
  const heroMedia = document.querySelector(".hero__media");
  if (video) {
    const play = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    video.addEventListener("error", () => {
      if (heroMedia) heroMedia.style.backgroundImage = 'url("assets/tlo.jpg")';
    });
    if (video.readyState >= 2) play();
    else video.addEventListener("loadeddata", play, { once: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) video.pause();
      else play();
    });
  }

  if (!reduced && hasGsap && window.matchMedia("(min-width: 900px)").matches) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    /* Parallax the wrapper — never the <video> (avoids GPU crash on refresh) */
    if (heroMedia) {
      window.gsap.to(heroMedia, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }
    window.gsap.to(".hero__inner", {
      y: 48,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    window.gsap.utils.toArray(".process__item").forEach((item, i) => {
      window.gsap.fromTo(
        item,
        { y: 56, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          delay: i * 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: item,
            start: "top 88%",
            toggleActions: "play none none none"
          }
        }
      );
      const img = item.querySelector("img");
      if (img) {
        window.gsap.fromTo(
          img,
          { scale: 1.14, yPercent: -6 },
          {
            scale: 1,
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              start: "top bottom",
              end: "bottom top",
              scrub: true
            }
          }
        );
      }
    });

    window.gsap.fromTo(
      ".quote__layout > *",
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".quote__layout",
          start: "top 82%",
          toggleActions: "play none none none"
        }
      }
    );

    window.gsap.fromTo(
      ".trust__grid > *",
      { y: 48, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.14,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".trust",
          start: "top 82%",
          toggleActions: "play none none none"
        }
      }
    );

    window.gsap.fromTo(
      ".place__panel",
      { scale: 0.96, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".place",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    window.ScrollTrigger.refresh();
  }

  /* —— Gallery (crossfade frame) —— */
  const galleryRoot = document.querySelector("[data-gallery]");
  const galleryImgs = [
    "assets/gallery/01.jpg",
    "assets/gallery/02.jpg",
    "assets/gallery/03.jpg",
    "assets/gallery/04.jpg",
    "assets/gallery/05.jpg",
    "assets/gallery/06.jpg",
    "assets/gallery/07.jpg"
  ];
  const mainImg = document.getElementById("gallery-main");
  const galleryCaption = document.getElementById("gallery-caption");
  const galleryIndexEl = document.getElementById("gallery-index");
  const thumbs = [...document.querySelectorAll("[data-gallery-goto]")];
  let galleryIndex = 0;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function showGallery(i) {
    galleryIndex = (i + galleryImgs.length) % galleryImgs.length;
    const src = galleryImgs[galleryIndex];
    if (mainImg && !reduced) mainImg.classList.add("is-swap");
    window.setTimeout(() => {
      if (mainImg) {
        mainImg.src = src;
        mainImg.alt = `Detailing — zdjęcie ${galleryIndex + 1}`;
        mainImg.classList.remove("is-swap");
      }
      if (galleryCaption) galleryCaption.textContent = `${pad(galleryIndex + 1)} / ${pad(galleryImgs.length)}`;
      if (galleryIndexEl) galleryIndexEl.textContent = pad(galleryIndex + 1);
      thumbs.forEach((t, idx) => t.classList.toggle("is-active", idx === galleryIndex));
    }, reduced ? 0 : 180);
  }

  document.querySelector("[data-gallery-prev]")?.addEventListener("click", () => showGallery(galleryIndex - 1));
  document.querySelector("[data-gallery-next]")?.addEventListener("click", () => showGallery(galleryIndex + 1));
  thumbs.forEach((t) => {
    t.addEventListener("click", () => showGallery(Number(t.dataset.galleryGoto) || 0));
  });
  galleryRoot?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") showGallery(galleryIndex - 1);
    if (e.key === "ArrowRight") showGallery(galleryIndex + 1);
  });

  let touchX = null;
  galleryRoot?.addEventListener("touchstart", (e) => {
    touchX = e.changedTouches[0]?.clientX ?? null;
  }, { passive: true });
  galleryRoot?.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
    touchX = null;
    if (Math.abs(dx) < 48) return;
    showGallery(galleryIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* —— Full quote calculator —— */
  const sizeBtns = [...document.querySelectorAll(".chip[data-size]")];
  const svcBtns = [...document.querySelectorAll(".svc[data-svc]")];
  const presetBtns = [...document.querySelectorAll("[data-preset]")];
  const sumEl = document.getElementById("quote-sum");
  const metaEl = document.getElementById("quote-meta");
  const linesEl = document.getElementById("quote-lines");
  const waEl = document.getElementById("quote-wa");
  const ctaEl = document.getElementById("quote-cta");

  let sizeId = "M";
  let selected = new Set();

  function priceOf(btn) {
    if (!btn) return 0;
    const staticRaw = btn.dataset.static;
    if (staticRaw != null && staticRaw !== "") {
      const n = Number(staticRaw);
      return Number.isFinite(n) ? n : 0;
    }
    const map = {
      S: btn.dataset.s,
      M: btn.dataset.m,
      L: btn.dataset.l,
      XL: btn.dataset.xl,
      XXL: btn.dataset.xxl
    };
    const n = Number(map[sizeId]);
    return Number.isFinite(n) ? n : 0;
  }

  function formatEuro(n) {
    return `€${Math.round(n)}`;
  }

  function blockedIds() {
    const blocked = new Set();
    selected.forEach((id) => {
      (rules?.getExclusions?.(id) || []).forEach((ex) => {
        if (!selected.has(ex)) blocked.add(ex);
      });
    });
    return blocked;
  }

  function syncPrices() {
    svcBtns.forEach((btn) => {
      const priceEl = btn.querySelector("[data-svc-price]");
      if (!priceEl) return;
      priceEl.textContent = formatEuro(priceOf(btn));
    });
  }

  function syncSelectionUI() {
    const blocked = blockedIds();
    svcBtns.forEach((btn) => {
      const id = btn.dataset.svc;
      const on = selected.has(id);
      btn.classList.toggle("is-on", on);
      btn.classList.toggle("is-blocked", !on && !btn.disabled && blocked.has(id));
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    const key = [...selected].sort().join(",");
    presetBtns.forEach((btn) => {
      const ids = (btn.dataset.preset || "").split(",").filter(Boolean).sort().join(",");
      btn.classList.toggle("is-on", ids === key && key !== "");
    });
  }

  function syncTotal() {
    const lines = [];
    let total = 0;
    svcBtns.forEach((btn) => {
      const id = btn.dataset.svc;
      if (!selected.has(id) || btn.disabled) return;
      const price = priceOf(btn);
      total += price;
      const name = (btn.querySelector("strong")?.textContent || id)
        .replace(/\s*(Wkrótce|Premium)\s*/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      lines.push({ name, price });
    });

    if (sumEl) sumEl.textContent = String(Math.round(total));
    if (metaEl) {
      metaEl.textContent = lines.length
        ? `Klasa ${sizeId} · ${lines.length} poz.`
        : "Wybierz usługę";
    }
    if (linesEl) {
      linesEl.innerHTML = lines
        .map((l) => `<li><span>${l.name}</span><span>${formatEuro(l.price)}</span></li>`)
        .join("");
    }

    const hasSelection = lines.length > 0;
    if (ctaEl) {
      if (hasSelection && !ctaEl.classList.contains("is-in")) {
        void ctaEl.offsetWidth;
        ctaEl.classList.add("is-in");
        ctaEl.removeAttribute("aria-hidden");
      } else if (!hasSelection) {
        ctaEl.classList.remove("is-in");
        ctaEl.setAttribute("aria-hidden", "true");
      }
    }

    if (waEl) {
      const list = lines.map((l) => `${l.name} (${formatEuro(l.price)})`).join(", ");
      const msg = encodeURIComponent(
        `Cześć! Orientacyjna wycena (klasa ${sizeId}): ${formatEuro(total)}. Pozycje: ${list || "—"}.`
      );
      waEl.href = `https://wa.me/48731693089?text=${msg}`;
    }
  }

  function refresh() {
    syncPrices();
    syncSelectionUI();
    syncTotal();
  }

  sizeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      sizeBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      sizeId = btn.dataset.size || "M";
      refresh();
    });
  });

  svcBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const id = btn.dataset.svc;
      const adding = !selected.has(id);
      if (rules?.applyExclusions) {
        selected = new Set(rules.applyExclusions([...selected], id, adding));
      } else if (adding) {
        selected.add(id);
      } else {
        selected.delete(id);
      }
      refresh();
    });
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const ids = (btn.dataset.preset || "").split(",").filter(Boolean);
      let next = [];
      ids.forEach((id) => {
        const el = svcBtns.find((b) => b.dataset.svc === id);
        if (!el || el.disabled) return;
        if (rules?.applyExclusions) next = rules.applyExclusions(next, id, true);
        else next.push(id);
      });
      selected = new Set(next);
      if (ids.some((id) => ["premiumWax", "quickWax", "leather-clean"].includes(id))) {
        const addons = document.querySelector(".quote__addons");
        if (addons) addons.open = true;
      }
      refresh();
    });
  });

  refresh();
})();
