# Car All Detailing — strona + PWA

| Co | URL |
|----|-----|
| Strona www | https://cjaab.github.io/cennik.github.io/ |
| Apka klienta | …/app/ |
| CAD Admin | …/app/admin/ |

## Struktura folderów

| Folder | Wgrywać na GitHub? |
|--------|---------------------|
| `index.html`, `config.js`, `sw.js` | ✅ tak (korzeń) |
| `site/` | ✅ tak |
| `assets/` | ✅ tak |
| `app/` | ✅ tak (cały folder) |
| `docs/` | opcjonalnie |
| `extras/` | ❌ nie (QR, wizytówki) |
| `firebase/` | ❌ nie (CLI lokalnie) |
| `tools/` | ❌ nie |

Pełna mapa: **[docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md)**  
Kolejność uploadu: **[docs/cad-app/WGRAJ-NA-GITHUB.md](docs/cad-app/WGRAJ-NA-GITHUB.md)**

## Wersje cache

Strona `cad-static-v121` · klient `cad-app-v59` · admin `cad-admin-v20`

## Firebase

```bash
firebase deploy --only firestore:rules,storage --config firebase/firebase.json
```

Reguły Firestore: `app/firestore.rules` → Publish w Firebase Console.
