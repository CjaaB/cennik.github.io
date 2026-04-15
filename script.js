/**
 * 1. FUNKCJE MODALI (Słowniczek, Powitanie, Porównanie)
 */
function toggleInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.style.display = (modal.style.display === "flex") ? "none" : "flex";
    }
}

function closeWelcomeModal() {
    const welcome = document.getElementById('welcomeModal');
    if (welcome) welcome.style.display = 'none';
}

function toggleCompareModal() {
    const modal = document.getElementById('compareModal');
    if (modal) {
        modal.style.display = (modal.style.display === "flex") ? "none" : "flex";
    }
}

/**
 * 2. POWITANIE CZASOWE
 */
function setGreeting() {
    const hour = new Date().getHours();
    const greetingElement = document.getElementById('greeting-text');
    let greeting;

    if (hour >= 5 && hour < 12) greeting = "Dzień dobry! Poranna kawa i detailing?";
    else if (hour >= 12 && hour < 18) greeting = "Siemanko! Czas na popołudniowe odświeżenie auta?";
    else if (hour >= 18 && hour < 22) greeting = "Dobry wieczór!";
    else greeting = "Witaj nocny marku";

    if (greetingElement) greetingElement.innerText = greeting;
}

/**
 * 3. GŁÓWNA LOGIKA PO ZAŁADOWANIU DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    setGreeting();

    const sizeSelect = document.getElementById('car-size');
    const services = document.querySelectorAll('.service');
    let currentTotal = 0;

    // Referencje do usług
    const extBasic = document.getElementById('ext-basic');
    const intBasic = document.getElementById('int-basic');
    const fullCombo = document.getElementById('full-combo');
    const deepClean = document.getElementById('deep-clean');
    const showroom = document.getElementById('showroom');
    const leatherClean = document.getElementById('leather-clean');
    const bonetingSeats = document.getElementById('boneting-seats');
    const bonetingFull = document.getElementById('boneting-full');

    // --- ANIMACJA LICZNIKA CENY ---
    function animatePrice(endValue) {
        const obj = document.getElementById('res-gross');
        if (!obj) return;
        const startValue = currentTotal;
        const duration = 500;
        let startTimestamp = null;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (endValue - startValue) + startValue);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
        currentTotal = endValue;
    }

    // --- LOGIKA WYKLUCZEŃ ---
    function handleExclusions(e) {
        const target = e.target;
        if (target === showroom && showroom.checked) {
            [extBasic, intBasic, fullCombo, deepClean, leatherClean, bonetingSeats, bonetingFull].forEach(el => { if (el) el.checked = false; });
        }
        if (target === leatherClean && leatherClean.checked) {
            [deepClean, bonetingSeats, bonetingFull, showroom].forEach(el => { if (el) el.checked = false; });
        }
        if ((target === deepClean || target === bonetingSeats || target === bonetingFull) && target.checked) {
            if (leatherClean) leatherClean.checked = false;
            if (showroom) showroom.checked = false;
        }
        if (target === deepClean && deepClean.checked) {
            [intBasic, fullCombo, showroom, bonetingSeats, bonetingFull].forEach(el => { if (el) el.checked = false; });
        }
        if (target === bonetingFull && bonetingFull.checked) {
            if (bonetingSeats) bonetingSeats.checked = false;
            if (deepClean) deepClean.checked = false;
        }
        if (target === bonetingSeats && bonetingSeats.checked) {
            if (bonetingFull) bonetingFull.checked = false;
            if (deepClean) deepClean.checked = false;
        }
        if (target === fullCombo && fullCombo.checked) {
            [extBasic, intBasic, deepClean, showroom].forEach(el => { if (el) el.checked = false; });
        }
        if ((target === extBasic || target === intBasic) && target.checked) {
            if (fullCombo) fullCombo.checked = false;
            if (showroom) showroom.checked = false;
        }
    }

    // --- OBLICZENIA ---
    function calculate() {
        if (!sizeSelect) return;
        const currentSize = sizeSelect.value;
        let total = 0;

        services.forEach(checkbox => {
            if (checkbox.checked) {
                const sizePrice = checkbox.getAttribute(`data-${currentSize.toLowerCase()}`);
                const staticPrice = checkbox.getAttribute('data-static');
                total += sizePrice ? parseFloat(sizePrice) : (staticPrice ? parseFloat(staticPrice) : 0);
            }
        });
        animatePrice(total);
    }

    // --- MAGNETYCZNE PRZYCISKI (Zostaje!) ---
    const magneticElements = document.querySelectorAll('.whatsapp-float, .info-float');
    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const pos = el.getBoundingClientRect();
            const x = e.clientX - pos.left - pos.width / 2;
            const y = e.clientY - pos.top - pos.height / 2;
            el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        el.addEventListener('mouseleave', () => el.style.transform = `translate(0px, 0px)`);
    });

    // --- TILT EFEKT (3D) DLA KART (Zostaje!) ---
    document.querySelectorAll('.service-item').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = (y - rect.height/2) / 25; 
            const rotateY = (rect.width/2 - x) / 25; 
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', () => card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`);
    });

    // --- SUWAK BEFORE/AFTER (Zostaje!) ---
    const container = document.getElementById('before-after-slider');
    if (container) {
        const sliderInput = container.querySelector('.slider-input');
        const imgBefore = container.querySelector('.img-before');
        const sliderHandle = container.querySelector('.slider-handle');
        sliderInput.addEventListener('input', (e) => {
            const value = e.target.value + "%";
            imgBefore.style.width = value;
            sliderHandle.style.left = value;
        });
    }

 // --- STABILNY TYPEWRITER (BEZ SKAKANIA LOGO) ---
    const tagline = document.querySelector('.tagline');
    if (tagline) {
        const words = ["Premium Car Care", "Showroom Excellence", "Passion for Perfection"];
        let wordIdx = 0, charIdx = 0, isDeleting = false;

        function typeEffect() {
            const currentWord = words[wordIdx];
            
            // Zamiast skracać tekst, zawijamy go w niewidzialny kontener
            const visibleText = currentWord.substring(0, charIdx);
            const invisibleText = currentWord.substring(charIdx);
            
            // Tworzymy tekst, gdzie reszta liter jest ukryta (opacity: 0), 
            // dzięki czemu szerokość elementu się nie zmienia!
            tagline.innerHTML = `${visibleText}<span style="opacity: 0">${invisibleText}</span>`;

            if (!isDeleting && charIdx < currentWord.length) {
                charIdx++;
                setTimeout(typeEffect, 100);
            } else if (isDeleting && charIdx > 0) {
                charIdx--;
                setTimeout(typeEffect, 50);
            } else if (!isDeleting && charIdx === currentWord.length) {
                isDeleting = true;
                setTimeout(typeEffect, 2000);
            } else {
                isDeleting = false;
                wordIdx = (wordIdx + 1) % words.length;
                setTimeout(typeEffect, 500);
            }
        }
        typeEffect();
    }

    // --- EVENT LISTENERS ---
    if (sizeSelect) sizeSelect.addEventListener('change', calculate);
    services.forEach(s => {
        s.addEventListener('change', (e) => {
            handleExclusions(e); 
            calculate();         
        });
    });

    window.addEventListener('click', (e) => {
        const infoM = document.getElementById('infoModal');
        const compareM = document.getElementById('compareModal');
        if (e.target === infoM) infoM.style.display = "none";
        if (e.target === compareM) compareM.style.display = "none";
    });

    calculate(); 
});

/**
 * 4. SCROLL REVEAL (Intersection Observer - Zostaje!)
 */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            entry.target.querySelectorAll('.pillar-item').forEach(p => p.classList.add('appear'));
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.service-item, .size-selector, .brands-section, .pillar-item, .brand-pillars-minimal').forEach(el => {
    el.classList.add('reveal-hidden');
    revealObserver.observe(el);
});
