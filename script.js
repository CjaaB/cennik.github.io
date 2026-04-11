/**
 * FUNKCJA MODALA (SŁOWNICZKA)
 * Musi być poza głównym blokiem, aby przycisk w HTML mógł ją wywołać przez onclick
 */
function toggleInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        // Przełączanie między widoczny (flex) a ukryty (none)
        if (modal.style.display === "flex") {
            modal.style.display = "none";
        } else {
            modal.style.display = "flex";
        }
    }
}

/**
 * GŁÓWNA LOGIKA KALKULATORA
 */
document.addEventListener('DOMContentLoaded', () => {
    const sizeSelect = document.getElementById('car-size');
    const services = document.querySelectorAll('.service');

    // Pobranie elementów do logiki wykluczeń (aby pakiety się nie nakładały)
    const extBasic = document.getElementById('ext-basic');
    const intBasic = document.getElementById('int-basic');
    const fullCombo = document.getElementById('full-combo');
    const deepClean = document.getElementById('deep-clean');
    const showroom = document.getElementById('showroom');
    const leatherClean = document.getElementById('leather-clean');
    const bonetingSeats = document.getElementById('boneting-seats');
    const bonetingFull = document.getElementById('boneting-full');

    // Funkcja zarządzająca wykluczeniami (logika: co odznaczyć, gdy kliknę coś innego)
    function handleExclusions(e) {
        const target = e.target;

        // Jeśli wybierzesz MAX (Showroom Ready), odznacz wszystko inne
        if (target === showroom && showroom.checked) {
            [extBasic, intBasic, fullCombo, deepClean, leatherClean, bonetingSeats, bonetingFull].forEach(el => {
                if (el) el.checked = false;
            });
        }

        // Jeśli wybierzesz Leather Clean, odznacz inne prania tapicerki
        if (target === leatherClean && leatherClean.checked) {
            [deepClean, bonetingSeats, bonetingFull, showroom].forEach(el => {
                if (el) el.checked = false;
            });
        }

        // Pranie/Bonetowanie odznacza czyszczenie skóry
        if ((target === deepClean || target === bonetingSeats || target === bonetingFull) && target.checked) {
            if (leatherClean) leatherClean.checked = false;
            if (showroom) showroom.checked = false;
        }

        // Deep Clean (Pranie) odznacza podstawowe wnętrze i showroom
        if (target === deepClean && deepClean.checked) {
            [intBasic, fullCombo, showroom, bonetingSeats, bonetingFull].forEach(el => {
                if (el) el.checked = false;
            });
        }

        // Bonetowanie Full odznacza bonetowanie samych foteli
        if (target === bonetingFull && bonetingFull.checked) {
            if (bonetingSeats) bonetingSeats.checked = false;
            if (deepClean) deepClean.checked = false;
        }

        if (target === bonetingSeats && bonetingSeats.checked) {
            if (bonetingFull) bonetingFull.checked = false;
            if (deepClean) deepClean.checked = false;
        }

        // Full Combo odznacza pojedyncze pakiety basic
        if (target === fullCombo && fullCombo.checked) {
            [extBasic, intBasic, deepClean, showroom].forEach(el => {
                if (el) el.checked = false;
            });
        }

        // Basic odznacza Combo i Showroom
        if ((target === extBasic || target === intBasic) && target.checked) {
            if (fullCombo) fullCombo.checked = false;
            if (showroom) showroom.checked = false;
        }
    }

    // Funkcja obliczająca sumę
    function calculate() {
        const currentSize = sizeSelect.value; // Pobiera S, M, L, XL lub XXL
        let total = 0;

        services.forEach(checkbox => {
            if (checkbox.checked) {
                // Pobiera cenę dla wybranego rozmiaru (data-s, data-m itd.)
                const sizePrice = checkbox.getAttribute(`data-${currentSize.toLowerCase()}`);
                // Pobiera cenę stałą (jeśli usługa nie zależy od rozmiaru)
                const staticPrice = checkbox.getAttribute('data-static');

                if (sizePrice) {
                    total += parseFloat(sizePrice);
                } else if (staticPrice) {
                    total += parseFloat(staticPrice);
                }
            }
        });

        // Wyświetlenie wyniku
        const resultElement = document.getElementById('res-gross');
        if (resultElement) {
            resultElement.innerText = total;
        }
    }

    // Obsługa zamknięcia modala przez kliknięcie w ciemne tło
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('infoModal');
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Eventy: zmiana rozmiaru auta lub kliknięcie w usługę
    sizeSelect.addEventListener('change', calculate);
    services.forEach(s => {
        s.addEventListener('change', (e) => {
            handleExclusions(e); 
            calculate();        
        });
    });

    // Uruchomienie przeliczenia na starcie
    calculate();
});

function closeWelcomeModal() {
    document.getElementById('welcomeModal').style.display = 'none';
}
