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
 * 3. GENEROWANIE OFERTY (Metoda Iframe - odporna na blokady GitHub Pages)
 */
function generateOfferPDF() {
    const sizeSelect = document.getElementById('car-size');
    const selectedSize = sizeSelect ? sizeSelect.options[sizeSelect.selectedIndex].text : "Nieokreślony";
    const selectedServices = document.querySelectorAll('.service:checked');
    const total = document.getElementById('res-gross').innerText;

    if (selectedServices.length === 0) {
        alert("Najpierw wybierz usługi, aby wygenerować ofertę!");
        return;
    }

    // Tworzenie niewidocznego iframe do obsługi druku
    let iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    let rows = "";
    selectedServices.forEach(s => {
        const row = s.closest('.service-item');
        const name = row.querySelector('.service-name').innerText;
        const price = row.querySelector('.service-price').innerText;
        rows += `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${price}</td>
            </tr>`;
    });

    let content = `
        <html>
        <head>
            <title>Oferta Car All Detailing</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                .header { text-align: center; border-bottom: 3px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 32px; font-weight: bold; color: #000; letter-spacing: 2px; margin: 0; }
                .subheader { color: #d4af37; font-size: 14px; text-transform: uppercase; letter-spacing: 4px; margin-top: 5px; }
                .info-box { margin-bottom: 30px; font-size: 14px; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { text-align: left; background: #f9f9f9; padding: 12px; border-bottom: 2px solid #d4af37; text-transform: uppercase; font-size: 13px; }
                .total-section { text-align: right; margin-top: 40px; padding: 20px; background: #f9f9f9; border-radius: 8px; }
                .total-label { font-size: 16px; color: #777; }
                .total-amount { font-size: 28px; color: #000; font-weight: bold; display: block; }
                .footer { margin-top: 60px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="logo">CAR ALL DETAILING</h1>
                <div class="subheader">Premium Car Care Excellence</div>
            </div>
            
            <div class="info-box">
                <p><strong>Data:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Wielkość pojazdu:</strong> ${selectedSize}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Wybrana usługa</th>
                        <th style="text-align: right;">Cena szacunkowa</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="total-section">
                <span class="total-label">Suma całkowita (brutto):</span>
                <span class="total-amount">${total} €</span>
            </div>

            <div class="footer">
                <p>Przedstawiona wycena ma charakter informacyjny i nie stanowi oferty handlowej w rozumieniu przepisów prawa.</p>
                <p>Ostateczny koszt usługi jest ustalany po inspekcji stanu pojazdu na miejscu.</p>
                <p><strong>CAR ALL DETAILING</strong> | www.cjaab.github.io/cennik.github.io</p>
            </div>
        </body>
        </html>`;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(content);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
    }, 500);
}

//* --- KOMPLETNY SILNIK WITRYNY (KALKULATOR + LOGO ENGINE + EFEKTY) --- *//
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ZMIENNE GLOBALNE (Zawsze na górze!) ---
    let easterEggDiscount = 1; 
    let clickCount = 0;
    let clickTimer;
    let currentTotal = 0;

    const detailingTips = [
        "Lakier na nowoczesnych autach jest cieńszy niż ludzki włos.",
        "Mycie na dwa wiadra redukuje ryzyko rys o 90%.",
        "Glinkowanie usuwa brud, którego nie ruszy żadna piana.",
        "Powłoka ceramiczna to twardość 9H – niemal jak szafir.",
        "Niewidzialna wycieraczka poprawia widoczność w deszczu o 40%.",
        "Ozonowanie zabija bakterie, a nie tylko maskuje zapach.",
        "Deironizacja to proces, w którym felgi 'krwawią' na fioletowo.",
        "Dressingi do plastików chronią przed UV i blaknięciem."
    ];

    // --- 2. REFERENCJE DO ELEMENTÓW ---
    const sizeSelect = document.getElementById('car-size');
    const services = document.querySelectorAll('.service');
    const logoContainer = document.querySelector('.logo-container');
    const logoImg = document.querySelector('.main-logo');
    const logoDescTitle = document.querySelector('.logo-description b');
    const logoDescText = document.querySelector('.logo-description p');

    // Referencje do usług (ID muszą się zgadzać z HTML)
    const extBasic = document.getElementById('ext-basic');
    const intBasic = document.getElementById('int-basic');
    const fullCombo = document.getElementById('full-combo');
    const deepClean = document.getElementById('deep-clean');
    const showroom = document.getElementById('showroom');
    const leatherClean = document.getElementById('leather-clean');
    const bonetingSeats = document.getElementById('boneting-seats');
    const bonetingFull = document.getElementById('boneting-full');
    const premiumWax = document.getElementById('premiumWax'); 
    const quickWax = document.getElementById('quickWax'); 

    // --- 3. LOGIKA KALKULATORA I ANIMACJI CENY ---
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

        if (easterEggDiscount < 1) {
            total = total * easterEggDiscount;
            const discountLabel = document.getElementById('discount-status');
            if (discountLabel) {
                discountLabel.innerHTML = `<span style="color: #d4af37; font-size: 0.8rem; font-weight: bold;">AKTYWNA ZNIŻKA -15% 🏆</span>`;
                discountLabel.style.display = 'block';
            }
        }
        animatePrice(Math.round(total));
    }

    // --- 4. LOGIKA WYKLUCZEŃ I SUGESTII ---
    function handleExclusions(e) {
        const target = e.target;
        if (!target.checked) { calculate(); return; }

        // Toasty sugestii
        if (target === deepClean) showSuggestion("Dodaj Ozonowanie, aby pozbyć się zapachów!");
        if (target === quickWax) showSuggestion("Sprawdź Premium Wax dla lepszej ochrony!");
        if (target === showroom) showSuggestion("Pakiet Showroom to najlepszy wybór!");

        // System wykluczeń
        if (target === showroom) {
            [extBasic, intBasic, fullCombo, deepClean, leatherClean, bonetingSeats, bonetingFull, premiumWax, quickWax].forEach(el => {
                if (el && el !== showroom) el.checked = false;
            });
        }
        if (target === fullCombo) {
            [extBasic, intBasic, deepClean, showroom].forEach(el => { if (el) el.checked = false; });
        }
        if (target === leatherClean) {
            [deepClean, bonetingSeats, bonetingFull, showroom].forEach(el => { if (el) el.checked = false; });
        }
        if (target === deepClean) {
            [intBasic, fullCombo, showroom, bonetingSeats, bonetingFull, leatherClean].forEach(el => { if (el) el.checked = false; });
        }
        if (target === bonetingFull) {
            [bonetingSeats, deepClean, showroom, leatherClean].forEach(el => { if (el) el.checked = false; });
        }
        if (target === bonetingSeats) {
            [bonetingFull, deepClean, showroom, leatherClean].forEach(el => { if (el) el.checked = false; });
        }
        if (target === premiumWax) { if (quickWax) quickWax.checked = false; if (showroom) showroom.checked = false; }
        if (target === quickWax) { if (premiumWax) premiumWax.checked = false; if (showroom) showroom.checked = false; }
        
        if (target === extBasic || target === intBasic) {
            if (fullCombo) fullCombo.checked = false;
            if (showroom) showroom.checked = false;
        }

        calculate();
    }

    function showSuggestion(text) {
        if (document.querySelector('.upsell-toast')) return;
        const toast = document.createElement('div');
        toast.className = 'upsell-toast';
        Object.assign(toast.style, {
            position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
            background: '#1a1a1a', color: '#d4af37', border: '1px solid #d4af37',
            padding: '12px 25px', borderRadius: '30px', zIndex: '10000', fontWeight: 'bold', textAlign: 'center'
        });
        toast.innerHTML = `✨ Sugestia: ${text}`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3500);
    }

    // --- 5. LOGIKA LOGO (TILT + EASTER EGG) ---
    if (logoContainer && logoImg) {
        logoContainer.addEventListener('mousemove', (e) => {
            const rect = logoContainer.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * -30;
            logoImg.style.transform = `rotateX(${y}deg) rotateY(${x}deg) scale(1.1)`;
        });

        logoContainer.addEventListener('mouseleave', () => logoImg.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`);

        logoContainer.addEventListener('click', () => {
            clickCount++;
            // Wyświetl ciekawostkę
            if (logoDescTitle) logoDescTitle.innerText = "CZY WIESZ, ŻE...";
            const tip = detailingTips[Math.floor(Math.random() * detailingTips.length)];
            if (logoDescText) logoDescText.innerHTML = `<i>"${tip}"</i>`;

            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 400);

            if (clickCount === 3) {
                easterEggDiscount = 0.85;
                logoContainer.classList.add('easter-egg-active');
                if (logoDescTitle) logoDescTitle.innerText = "🏆 SEKRET ODKRYTY!";
                if (logoDescText) logoDescText.innerHTML = "ZNIŻKA -15% AKTYWNA!<br>Ceny spadły.";
                calculate();
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        });
    }

   // --- 6. POZOSTAŁE EFEKTY (MAGNETYCZNE, TILT KART, SLIDER, TYPEWRITER) ---
    // Magnetyczne przyciski
    document.querySelectorAll('.whatsapp-float, .info-float').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const pos = el.getBoundingClientRect();
            el.style.transform = `translate(${(e.clientX - pos.left - pos.width/2) * 0.3}px, ${(e.clientY - pos.top - pos.height/2) * 0.3}px)`;
        });
        el.addEventListener('mouseleave', () => el.style.transform = `translate(0px, 0px)`);
    });

    // Tilt kart
    document.querySelectorAll('.service-item').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.transform = `perspective(1000px) rotateX(${(e.clientY - rect.top - rect.height/2) / 25}deg) rotateY(${(rect.width/2 - (e.clientX - rect.left)) / 25}deg)`;
        });
        card.addEventListener('mouseleave', () => card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`);
    });

    // Suwak Before/After
    const sliderContainer = document.getElementById('before-after-slider');
    if (sliderContainer) {
        const input = sliderContainer.querySelector('.slider-input');
        const imgBefore = sliderContainer.querySelector('.img-before');
        const handle = sliderContainer.querySelector('.slider-handle');
        input.addEventListener('input', (e) => {
            imgBefore.style.width = e.target.value + "%";
            handle.style.left = e.target.value + "%";
        });
    }

    // Typewriter
    const tagline = document.querySelector('.tagline');
    if (tagline) {
        const words = ["Premium Car Care", "Showroom Excellence", "Passion for Perfection"];
        let wordIdx = 0, charIdx = 0, isDeleting = false;
        function typeEffect() {
            const currentWord = words[wordIdx];
            const visible = currentWord.substring(0, charIdx);
            tagline.innerHTML = `${visible}<span style="opacity: 0">${currentWord.substring(charIdx)}</span>`;
            if (!isDeleting && charIdx < currentWord.length) charIdx++;
            else if (isDeleting && charIdx > 0) charIdx--;
            else if (!isDeleting && charIdx === currentWord.length) { isDeleting = true; setTimeout(typeEffect, 2000); return; }
            else { isDeleting = false; wordIdx = (wordIdx + 1) % words.length; }
            setTimeout(typeEffect, isDeleting ? 50 : 100);
        }
        typeEffect();
    }

    // Akordeon
    document.querySelectorAll('.knowledge-accordion details').forEach((item) => {
        item.querySelector('summary').addEventListener('click', () => {
            if (!item.hasAttribute('open') && navigator.vibrate) navigator.vibrate(5);
        });
    });

    // --- 7. OBSŁUGA KLIKNIĘĆ W KAFELKI (Wewnątrz DOMContentLoaded) ---
    const sizeOptions = document.querySelectorAll('.size-option');
    // carSizeSelect jest zdefiniowany na początku DOMContentLoaded jako sizeSelect
    
    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            sizeOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            const selectedValue = option.getAttribute('data-value');

            if (sizeSelect) {
                sizeSelect.value = selectedValue;
                console.log("Kafelek ustawia rozmiar na:", selectedValue);
                calculate(); // To odpali animatePrice
                if (navigator.vibrate) navigator.vibrate(15);
            }
        });
    });

    // --- 8. EVENT LISTENERY I START ---
    services.forEach(cb => cb.addEventListener('change', (e) => {
        handleExclusions(e);
        calculate();
    }));

    if (sizeSelect) {
        sizeSelect.addEventListener('change', calculate);
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('infoModal')) document.getElementById('infoModal').style.display = "none";
        if (e.target === document.getElementById('compareModal')) document.getElementById('compareModal').style.display = "none";
    });

    if (typeof setGreeting === 'function') setGreeting();
    
    // Startowe przeliczenie
    calculate();
}); // TU SIĘ KOŃCZY DOMContentLoaded

// Funkcje globalne (dostępne dla atrybutów onclick w HTML)
function toggleInfoModal() {
    const modal = document.getElementById('infoModal');
    if (!modal) return;
    if (modal.style.display === "flex") {
        modal.style.opacity = "0";
        setTimeout(() => modal.style.display = "none", 300);
    } else {
        modal.style.display = "flex";
        setTimeout(() => modal.style.opacity = "1", 10);
    }
}


/**
 * 5. SCROLL REVEAL
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
