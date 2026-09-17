# Car All Detailing

Strona prezentacyjna (v2) — Karol Zagórski · Maarssen.

## Uruchomienie

1. Wrzuć cały folder na GitHub Pages / Netlify / dowolny hosting statyczny.
2. Albo otwórz lokalnie: serwuj folder (`npx serve .`) i wejdź na `index.html`.

> Pliki HTML z linkami względnymi działają też po prostym otwarciu pliku, ale dokumenty/druk i część skryptów wolą lokalny serwer HTTP.

## Struktura

- `index.html` — strona główna
- `biblioteka.html` — biblioteka pojęć
- `css/` — style (`styles.css`, `cad-documents.css`)
- `js/` — wycena, animacje, druk dokumentów
- `assets/` — logo, wideo, galeria, marki
- `documents/` — protokół i regulamin (podgląd + druk / PDF)

## Uwagi

- Wideo hero (`assets/video2.mp4`) ma ok. 8–9 MB — GitHub to przyjmie; przy wolnym pushu poczekaj na upload.
- Na telefonie nawigacja jest przewijana w poziomie; ciężkie animacje GSAP/Lenis są wyłączone na wąskich ekranach.
