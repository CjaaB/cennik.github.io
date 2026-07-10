# Car All Detailing — strona + PWA

| Co | URL |
|----|-----|
| Strona www | https://cjaab.github.io/cennik.github.io/ |
| Apka klienta | …/app/ |
| CAD Admin | …/app/admin/ |
| Protokół | …/private/ |

## Struktura projektu

```
Car All Detailing/
├── index.html, config.js, sw.js   ← strona www (korzeń — na GitHub)
├── site/                          ← CSS + JS strony
├── assets/                        ← obrazy, PDF, wideo, galeria
├── app/                           ← PWA klient + admin
├── private/                       ← aplikacja protokołu
├── podglad-mobile.bat             ← skrót do podglądu telefonu
├── CO-WRZUCIC-NA-GITHUB.md        ← co wgrać / czego nie wgrać
└── local/                         ← NIE wgrywaj na GitHub (patrz niżej)
    ├── tools/                     ← serwer lokalny, PDF, ikony, galeria
    ├── extras/                    ← wizytówki, QR, ogłoszenia
    ├── firebase/                  ← Firebase CLI
    ├── unsplash/                  ← zdjęcia źródłowe
    ├── scripts/                   ← skrypty budujące pliki JS
    └── docs/                      ← dokumentacja deweloperska
```

## Co wgrywać na GitHub?

| Folder / plik | GitHub? |
|---------------|---------|
| `index.html`, `config.js`, `sw.js` | ✅ tak |
| `site/`, `assets/`, `app/`, `private/` | ✅ tak |
| `local/` (cały folder) | ❌ nie |
| `README.md`, `CO-WRZUCIC-NA-GITHUB.md` | opcjonalnie |

Pełna instrukcja: **[CO-WRZUCIC-NA-GITHUB.md](CO-WRZUCIC-NA-GITHUB.md)**  
Mapa folderów: **[local/docs/PROJECT-STRUCTURE.md](local/docs/PROJECT-STRUCTURE.md)**

## Podgląd mobile (laptop)

Dwuklik **`podglad-mobile.bat`** w korzeniu projektu — ramka telefonu w przeglądarce, bez wgrywania na GitHub.

## Wersje cache

Strona `cad-static-v121` · klient `cad-app-v59` · admin `cad-admin-v20`

## Firebase

```bash
firebase deploy --only firestore:rules,storage --config local/firebase/firebase.json
```

Reguły Firestore: `app/firestore.rules` → Publish w Firebase Console.
