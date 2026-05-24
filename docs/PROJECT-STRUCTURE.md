# Struktura projektu Car All Detailing

```
Car All Detailing/
├── index.html              ← strona www (GitHub Pages — musi być w korzeniu)
├── config.js               ← wspólna konfig (strona + apki)
├── sw.js                   ← cache strony www (nie mylić z app/sw.js)
├── README.md
│
├── site/                   ← kod strony www
│   ├── css/style.css
│   └── js/
│       ├── app.js          ← kalkulator, tłumaczenia strony
│       ├── script.js       ← interakcje landing
│       └── fun.js
│
├── assets/                 ← pliki statyczne (obrazy, PDF, wideo)
│   ├── logo1.png, tlo.jpg
│   ├── video1.mp4, video2.mp4
│   ├── regulamin.pdf, protokol-wzor.pdf
│   ├── kontakt-car-all-detailing.vcf
│   └── logos/              ← logotypy partnerów
│
├── app/                    ← PWA klienta + admin
│   ├── index.html
│   ├── admin/index.html
│   ├── js/, css/, icons/
│   ├── admin/icons/
│   ├── sw.js               ← SW klienta (nie obejmuje /admin/)
│   └── admin/sw.js         ← SW admina
│
├── docs/cad-app/           ← instrukcje Firebase, wdrożenie
├── tools/                  ← skrypty lokalne (PDF, ikony PWA)
├── wizytowka/, qr/
│
├── firebase.json           ← Firebase CLI (reguły, functions)
├── firestore.indexes.json
└── .firebaserc
```

## Adresy na GitHub Pages

| Usługa | URL |
|--------|-----|
| Strona | `https://cjaab.github.io/cennik.github.io/` |
| Apka klienta | `…/app/` |
| Admin | `…/app/admin/` |

## Co wgrać przy aktualizacji

- **Strona + apki:** `index.html`, `config.js`, `sw.js`, cały `site/`, cały `assets/`, cały `app/`
