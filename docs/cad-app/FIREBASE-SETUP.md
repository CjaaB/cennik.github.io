# Firebase — szybka checklista (chat)

Jeśli **wiadomości się nie wysyłają** (klient ani admin), zrób to w [Firebase Console](https://console.firebase.google.com) → projekt **carall-detailing-app**:

## 1. Authentication
- **Sign-in method** → włącz **Anonymous** (dla klienta w apce)
- **Sign-in method** → włącz **Email/Password** (dla admina)
- **Users** → konto admina (Twój e-mail + hasło)

## 2. Authorized domains
- **Authentication** → **Settings** → **Authorized domains**
- Dodaj: `cjaab.github.io` (i `localhost` do testów)

## 3. Firestore Rules
- **Firestore** → **Rules**
- Wklej całą zawartość pliku `app/firestore.rules` z tego repozytorium
- Kliknij **Publish**

## 4. (Opcjonalnie) Powiadomienia push
- **Project settings** → **Cloud Messaging** → Web Push → klucz VAPID → `vapidKey` w `firebase-config.js`

Po Publish odczekaj ~30 s i odśwież aplikację na telefonie.

## 5. Ustawienia aplikacji (cennik, godziny, Calendly)

- Kolekcja **`settings`** → dokument **`app`** (tworzy admin z panelu **Ustawienia** lub przycisk „Wgraj domyślny cennik”).
- Klient i wycena **czytają** ten dokument (wymaga zalogowania anonimowego + reguły `read: signedIn`).

## 6. Historia klienta (admin)

- Przy pierwszym użyciu **Historia klienta** Firebase może poprosić o **indeks złożony**: `conversations` → `clientId` + `lastMessageAt` (desc). Kliknij link w błędzie w konsoli przeglądarki i utwórz indeks.

## 7. Powiadomienia push — co naprawdę działa

| Sytuacja | Klient (odpowiedź Karola) | Admin (nowa wiadomość klienta) |
|----------|---------------------------|--------------------------------|
| Apka **otwarta** na czacie / w tle na tej samej karcie | Tak — dźwięk/wiadomość z przeglądarki (po „Włącz powiadomienia”) | Tak — to samo + dzwonek w panelu |
| Apka **zamknięta** (ikona na ekranie, PWA w tle) | **Tylko po wdrożeniu** `app/functions/` + włączone powiadomienia w apce klienta | **Tylko po wdrożeniu** `app/functions/` + dzwonek w CAD Admin |
| Bez Cloud Functions | Nie ma push z serwera — tylko gdy Firestore odświeży otwartą apkę | To samo |

### Wdrożenie push (opcjonalne, ale pełne powiadomienia)

1. Zainstaluj [Firebase CLI](https://firebase.google.com/docs/cli), w folderze projektu: `cd app/functions` → `npm install`
2. Z katalogu głównego projektu: `firebase deploy --only functions` (projekt `carall-detailing-app`)
3. W apce **klienta**: chat → **Włącz powiadomienia**
4. W **CAD Admin**: zaloguj e-mailem → ikona **dzwonka** → włącz powiadomienia

Funkcje w `app/functions/index.js`:
- `notifyAdminOnClientMessage` — push do admina
- `notifyClientOnAdminMessage` — push do klienta

Bez deploy funkcji nadal działają **powiadomienia przeglądarki**, gdy aplikacja jest uruchomiona i masz zgodę na powiadomienia.

## Usuwanie rozmów (admin)

- Zaloguj się w **CAD Admin** e-mailem i hasłem z Firebase Authentication (nie anonimowo).
- Reguły muszą pozwalać adminowi na **delete** dokumentów i wiadomości (`app/firestore.rules`).
- Po usunięciu rozmowa znika z listy admina; u klienta chat się resetuje (nowa wiadomość = nowa rozmowa).
- Jeśli widzisz toast o braku uprawnień — reguły w konsoli Firebase **nie są opublikowane** lub są stare.
