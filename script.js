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

/**
 * 4. GŁÓWNA LOGIKA PO ZAŁADOWANIU DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    setGreeting();

    const sizeSelect = document.getElementById('car-size');
    const services = document.querySelectorAll('.service');
    let currentTotal = 0;

    // Referencje do usług dla wykluczeń
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

    function handleExclusions(e) {
        const target = e.target;
        if (target === showroom && showroom.checked) {
            [extBasic, intBasic, fullCombo, deepClean, leatherClean, bonetingSeats, bonetingFull, premiumWax, quickWax].forEach(el => { if (el) el.checked = false; });
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
        if (target === premiumWax && premiumWax.checked) {
            if (quickWax) quickWax.checked = false;
        }
        if (target === quickWax && quickWax.checked) {
            if (premiumWax) premiumWax.checked = false;
        }
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
        animatePrice(total);
    }

    // --- MAGNETYCZNE PRZYCISKI ---
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

    // --- TILT EFEKT (3D) DLA KART ---
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

    // --- SUWAK BEFORE/AFTER ---
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

    // --- TYPEWRITER ---
    const tagline = document.querySelector('.tagline');
    if (tagline) {
        const words = ["Premium Car Care", "Showroom Excellence", "Passion for Perfection"];
        let wordIdx = 0, charIdx = 0, isDeleting = false;

        function typeEffect() {
            const currentWord = words[wordIdx];
            const visibleText = currentWord.substring(0, charIdx);
            const invisibleText = currentWord.substring(charIdx);
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

    if (sizeSelect) sizeSelect.addEventListener('change', calculate);
    services.forEach(s => {
        s.addEventListener('change', (e) => {
            handleExclusions(e); 
            calculate();         
        });
    });

    // Podpięcie przycisku pobierania
    const downloadBtn = document.getElementById('download-offer-btn');
    if (downloadBtn) downloadBtn.addEventListener('click', generateOfferPDF);

    window.addEventListener('click', (e) => {
        const infoM = document.getElementById('infoModal');
        const compareM = document.getElementById('compareModal');
        if (e.target === infoM) infoM.style.display = "none";
        if (e.target === compareM) compareM.style.display = "none";
    });

    calculate(); 
});

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
