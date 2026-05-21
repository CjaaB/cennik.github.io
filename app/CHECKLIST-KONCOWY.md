# Checklist końcowy — wszystko ma działać (PC + telefon)

## 1. Wgranie na GitHub (obowiązkowe)

Wgraj **cały folder `app/`** (wszystkie pliki, w tym `icons/`, `admin/`, `js/`, `functions/`).

W **korzeniu** repozytorium (obok `index.html` strony www):

| Plik | Po co |
|------|--------|
| **`config.js`** | Kalkulator i pogoda w apce klienta |

Opcjonalnie wgraj też `firestore.indexes.json` i `firebase.json` z korzenia projektu (indeks historii klienta).

### Test po wgraniu (otwórz w przeglądarce)

Te adresy muszą dać **200**, nie 404:

- `…/app/js/cad-data.js`
- `…/app/js/admin-panel.js`
- `…/app/js/chat-admin.js`
- `…/app/icons/icon-192.png`

---

## 2. Firebase Console (jednorazowo)

| Ustawienie | Gdzie |
|------------|--------|
| **Firestore Rules** | Wklej `app/firestore.rules` → **Publish** |
| **Anonymous** | Authentication → Sign-in → włączone |
| **Email/Password** | Authentication → włączone |
| **Konto admina** | Authentication → Users (e-mail + hasło) |
| **Domena** | Authentication → Settings → `cjaab.github.io` |
| **VAPID** (push) | Project settings → Cloud Messaging → klucz w `firebase-config.js` |

### Indeks Firestore (historia klienta w adminie)

Przy pierwszym użyciu „Historia klienta” Firebase może pokazać link do utworzenia indeksu — **kliknij i utwórz**.  
Albo: `firebase deploy --only firestore:indexes` (jeśli masz Firebase CLI).

---

## 3. Adresy — używaj tych

| Co | URL |
|----|-----|
| Apka klienta | https://cjaab.github.io/cennik.github.io/app/ |
| **CAD Admin (PC i telefon)** | https://cjaab.github.io/cennik.github.io/app/admin/ |
| Strona www | https://cjaab.github.io/cennik.github.io/ |

**Nie** otwieraj plików z dysku (`file://`) — Firebase i PWA nie zadziałają.

---

## 4. CAD Admin — PC

1. Chrome lub Edge → link **/app/admin/**
2. **Zaloguj e-mailem i hasłem** z Firebase (u góry widać Twój e-mail)
3. Lewa kolumna = rozmowy, prawa = czat
4. Jeśli wcześniej otwierałeś apkę klienta w tej samej przeglądarce → **Wyloguj** w adminie i zaloguj się ponownie e-mailem
5. Dolne menu: Wiadomości | Statystyki | Ustawienia

---

## 5. CAD Admin — telefon

1. Ten sam link w **Chrome (Android)** lub **Safari (iPhone)**
2. Zaloguj e-mailem
3. Lista rozmów → dotknij klienta → pełny ekran czatu → strzałka wraca do listy
4. Opcjonalnie: ikona pobierania → „Dodaj do ekranu” (osobna ikona **CAD Admin**)

---

## 6. Apka klienta — telefon / PC

1. Link **/app/**
2. Chat → imię + wiadomość → działa bez konta (Anonymous)
3. Opcjonalnie: „Włącz powiadomienia” w czacie
4. Wycena, termin (Calendly), pogoda — po wgraniu `config.js`

---

## 7. Co działa BEZ Cloud Functions (dziś)

- Chat obustronny (admin **e-mailem**)
- Status rozmowy, „pisze…”, archiwum, usuwanie
- Wycena, ustawienia cennika (admin → Ustawienia)
- Statystyki, eksport CSV
- Powiadomienia **gdy apka/panel jest otwarty** (po zezwoleniu w przeglądarce)

---

## 8. Co wymaga osobnego kroku (później)

| Funkcja | Co zrobić |
|---------|-----------|
| Push przy **zamkniętej** apce | Plan Blaze + `firebase deploy --only functions` |
| E-mail przy nowej wiadomości | To samo + `smtp.*` w Functions (instrukcja: `app/functions/README.md`) |

Kod Functions jest już w `app/functions/` — nie musisz go dziś wdrażać.

---

## 9. Szybki test końcowy (5 min)

- [ ] Klient wysyła wiadomość z **/app/**
- [ ] Admin (e-mail) widzi ją w **/app/admin/**
- [ ] Admin odpowiada — klient widzi odpowiedź
- [ ] Przy wpisywaniu widać „pisze…”
- [ ] Na PC widać listę + czat obok siebie
- [ ] Na telefonie admin: lista → rozmowa → odpowiedź

Jeśli wszystko tak jest — **projekt jest kompletny** na GitHub + Firebase. Push/e-mail to dodatek na później.
