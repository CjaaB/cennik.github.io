# Struktura projektu Car All Detailing

Uporządkowana pod **ręczne wgrywanie na GitHub** (folder po folderze).

```
Car All Detailing/
│
├── 🟢 WDROŻENIE (GitHub Pages — wgraj na repo)
│   ├── index.html              ← strona www (musi być w korzeniu)
│   ├── config.js               ← pogoda, kurs EUR (wspólny dla www + app)
│   ├── sw.js                   ← cache strony www
│   ├── site/                   ← CSS + JS strony www
│   │   ├── css/style.css
│   │   └── js/
│   │       ├── app.js          ← kalkulator, tłumaczenia
│   │       ├── script.js       ← interakcje landing
│   │       ├── lang-switch.js
│   │       └── fun.js
│   ├── assets/                 ← obrazy, PDF, wideo, vCard
│   │   ├── logo1.png, tlo.jpg
│   │   ├── video1.mp4, video2.mp4
│   │   ├── regulamin.pdf, protokol-wzor.pdf
│   │   ├── kontakt-car-all-detailing.vcf
│   │   └── logos/              ← logotypy marek
│   └── app/                    ← PWA klient + admin
│       ├── index.html, quote.html, admin.html
│       ├── manifest.json, sw.js
│       ├── icons/              ← PWA klient (192, 512, apple)
│       ├── css/, js/
│       ├── firestore.rules     ← kopia (publikacja w Firebase Console)
│       ├── admin/
│       │   ├── index.html, sw.js, manifest.webmanifest
│       │   └── icons/
│       └── functions/          ← opcjonalnie (push w chmurze)
│
├── 🟡 OPCJONALNIE na GitHub (dokumentacja, nie psuje strony)
│   ├── docs/                   ← instrukcje wdrożenia
│   └── README.md
│
├── ⚪ NIE wgrywaj na GitHub Pages (lokalne / dev)
│   ├── extras/
│   │   ├── qr/                 ← kod QR do wizytówek
│   │   └── wizytowka/          ← projekty wizytówek SVG
│   ├── firebase/               ← Firebase CLI (.firebaserc, reguły storage)
│   └── tools/                  ← skrypty PDF, ikony PWA
│
└── .gitignore
```

## Kolejność wgrywania (GitHub → Upload files)

| Krok | Folder / plik | Uwagi |
|------|----------------|--------|
| 1 | `assets/` | Cały folder (wideo może trwać dłużej) |
| 2 | `site/` | Cały folder |
| 3 | `app/` | **Cały** folder (w tym `icons/` i `admin/icons/`) |
| 4 | `config.js` | W korzeniu repo |
| 5 | `sw.js` | W korzeniu repo |
| 6 | `index.html` | W korzeniu repo |

Szczegóły: [cad-app/WGRAJ-NA-GITHUB.md](cad-app/WGRAJ-NA-GITHUB.md)

## Adresy produkcyjne

| Usługa | URL |
|--------|-----|
| Strona | https://cjaab.github.io/cennik.github.io/ |
| Apka klienta | …/app/ |
| CAD Admin | …/app/admin/ |

## Firebase CLI (po przeniesieniu do `firebase/`)

Z katalogu projektu:

```bash
firebase deploy --only firestore:rules,storage --config firebase/firebase.json
```

Reguły Firestore publikuj też ręcznie z `app/firestore.rules` w konsoli Firebase.
