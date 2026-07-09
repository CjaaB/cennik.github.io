# Firebase CLI (lokalnie)

| Plik | Opis |
|------|------|
| `firebase.json` | Konfiguracja deploy (Firestore, Storage, Functions) |
| `.firebaserc` | ID projektu Firebase |
| `firestore.indexes.json` | Indeksy Firestore |
| `storage.rules` | Reguły Storage |

Deploy z katalogu głównego projektu:

```bash
firebase deploy --only firestore:rules,storage --config firebase/firebase.json
```

Reguły Firestore na produkcji: skopiuj z `app/firestore.rules` do Firebase Console.
