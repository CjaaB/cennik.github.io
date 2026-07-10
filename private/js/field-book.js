(function () {
    "use strict";

    const PIN_KEY = "cad_field_book_pin_hash";
    const UNLOCK_KEY = "cad_field_book_unlocked";
    const PHOTO_SECTIONS = [
        { id: "paint", label: "Lakier i elementy zewnętrzne" },
        { id: "bumpers", label: "Zderzaki / progi / listwy" },
        { id: "wheels", label: "Felgi / opony" },
        { id: "glass", label: "Szyby / lampy" },
        { id: "interior", label: "Wnętrze / tapicerka" },
        { id: "leather", label: "Skóra / plastiki / piano black" },
        { id: "sensitive", label: "Elementy wrażliwe / wcześniejsze naprawy" },
        { id: "damage", label: "Rysy, odpryski, plamy, zapachy" }
    ];

    const SERVICE_ITEMS = [
        ["extWash", "Mycie / detailing zewnętrzny"],
        ["interior", "Czyszczenie wnętrza"],
        ["fabric", "Pranie tapicerki materiałowej"],
        ["wax", "Wosk / zabezpieczenie lakieru"],
        ["leather", "Czyszczenie skóry / kierownicy"],
        ["decon", "Dekontaminacja / oczyszczanie lakieru"],
        ["petHair", "Usuwanie sierści / mocnych zabrudzeń"],
        ["other", "Inne ustalenia"]
    ];

    const ITEM_CHECKS = [
        ["valuablesRemoved", "Klient zabrał dokumenty, pieniądze i wartościowe rzeczy"],
        ["itemsLeft", "W aucie pozostają rzeczy wskazane wykonawcy"],
        ["seatsRemoved", "Foteliki / akcesoria / bagaż wymagają wyjęcia przed usługą"]
    ];

    const CONSENT_CHECKS = [
        ["weather", "Klient wie, że część usług może być na zewnątrz — pogoda może zmienić termin"],
        ["price", "Klient wie, że cena z kalkulatora jest orientacyjna"],
        ["limits", "Klient wie, że nie każda plama / rysa / zapach da się usunąć w 100%"],
        ["photos", "Klient zgadza się na zdjęcia dokumentacyjne przed i po usłudze"]
    ];

    const REGULAMIN_SECTIONS = [
        ["§1 Zakres usług", "Zakres obejmuje wyłącznie czynności ustalone przed rozpoczęciem pracy lub zaakceptowane w trakcie realizacji."],
        ["§2 Wycena", "Ceny z kalkulatora i strony są orientacyjne. Ostateczna cena po oględzinach auta."],
        ["§3 Protokół", "Przed pracą może powstać protokół przyjęcia pojazdu ze stanem auta i zakresem usługi."],
        ["§4 Stan auta", "Wykonawca nie odpowiada za ukryte wady, wcześniejsze naprawy i naturalne zużycie."],
        ["§5 Efekt", "Efekt zależy od stanu lakieru, tapicerki i rodzaju zabrudzeń."],
        ["§6 Pogoda", "Mycie zewnętrzne może wymagać zmiany godziny lub terminu przy złej pogodzie."],
        ["§7 Rzeczy w aucie", "Klient usuwa wartościowe przedmioty. Rzeczy pozostawione — tylko jeśli opisane."],
        ["§10 Reklamacje", "Uwagi najlepiej zgłosić przy odbiorze auta lub zaraz po nim."]
    ];

    let current = null;
    let saveTimer = null;
    let activePhotoSection = null;
    let fileInput = null;

    const $ = (sel, root = document) => root.querySelector(sel);

    function toast(msg) {
        const el = $("#fb-toast");
        if (!el) return;
        el.textContent = msg;
        el.classList.add("is-visible");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => el.classList.remove("is-visible"), 2200);
    }

    function hashPin(pin) {
        return btoa(`cad:${pin}`);
    }

    function isUnlocked() {
        return sessionStorage.getItem(UNLOCK_KEY) === "1";
    }

    function setUnlocked() {
        sessionStorage.setItem(UNLOCK_KEY, "1");
    }

    function hasPin() {
        return Boolean(localStorage.getItem(PIN_KEY));
    }

    function savePin(pin) {
        localStorage.setItem(PIN_KEY, hashPin(pin));
    }

    function checkPin(pin) {
        return localStorage.getItem(PIN_KEY) === hashPin(pin);
    }

    function createEmptyProtocol() {
        const now = new Date().toISOString();
        return {
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
            status: "draft",
            client: { name: "", phone: "", email: "" },
            vehicle: { make: "", plate: "", vin: "", mileage: "", color: "" },
            dates: { received: new Date().toISOString().slice(0, 16), pickup: "" },
            services: {},
            condition: {},
            photos: {},
            items: {},
            consents: {},
            notes: "",
            extraPhotos: [],
            regulamin: { acknowledged: false, acknowledgedAt: "" },
            signatures: { place: "Maarssen", dateReceived: "", datePickup: "", clientName: "" }
        };
    }

    function displayVehicle(record) {
        const make = record.vehicle?.make?.trim();
        const plate = record.vehicle?.plate?.trim();
        if (make && plate) return `${make} · ${plate}`;
        return make || plate || "Pojazd";
    }

    function formatDateLong(iso) {
        if (!iso) return "—";
        try {
            return new Date(iso).toLocaleString("pl-PL", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch (_) {
            return iso;
        }
    }

    function updateEditorHeader(record) {
        const title = $("#fb-edit-title");
        const subtitle = $("#fb-edit-subtitle");
        if (title) title.textContent = formatDateLong(record.dates?.received || record.createdAt);
        if (subtitle) subtitle.textContent = displayVehicle(record);
    }

    async function compressImage(file) {
        const bitmap = await createImageBitmap(file);
        const maxW = 1600;
        const scale = Math.min(1, maxW / bitmap.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.82);
    }

    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            if (!current) return;
            current.updatedAt = new Date().toISOString();
            window.CAD_FieldBookDb.saveProtocol(current).then(() => toast("Zapisano lokalnie"));
        }, 700);
    }

    function bindLockScreen() {
        const lock = $("#fb-lock");
        const app = $("#fb-app");
        const setup = $("#fb-pin-setup");
        const login = $("#fb-pin-login");
        const inputs = [...document.querySelectorAll(".fb-pin input")];

        const readPin = () => inputs.map((i) => i.value).join("");

        const tryUnlock = () => {
            const pin = readPin();
            if (pin.length < 4) return;
            if (!hasPin()) {
                savePin(pin);
                setUnlocked();
            } else if (checkPin(pin)) {
                setUnlocked();
            } else {
                toast("Nieprawidłowy PIN");
                inputs.forEach((i) => {
                    i.value = "";
                });
                inputs[0]?.focus();
                return;
            }
            lock.classList.add("fb-hidden");
            app.classList.remove("fb-hidden");
            showList();
        };

        inputs.forEach((input, idx) => {
            input.addEventListener("input", () => {
                input.value = input.value.replace(/\D/g, "").slice(0, 1);
                if (input.value && inputs[idx + 1]) inputs[idx + 1].focus();
                if (readPin().length === 4) tryUnlock();
            });
        });

        if (hasPin()) {
            setup.classList.add("fb-hidden");
            login.classList.remove("fb-hidden");
        } else {
            setup.classList.remove("fb-hidden");
            login.classList.add("fb-hidden");
        }

        if (isUnlocked()) {
            lock.classList.add("fb-hidden");
            app.classList.remove("fb-hidden");
        }
    }

    async function showList() {
        $("#fb-list-screen").classList.remove("fb-hidden");
        $("#fb-edit-screen").classList.add("fb-hidden");
        const list = $("#fb-protocol-list");
        const items = await window.CAD_FieldBookDb.listProtocols();
        if (!items.length) {
            list.innerHTML = '<div class="fb-empty">Brak zapisanych protokołów.<br>Utwórz pierwszy przy przyjęciu auta.</div>';
            return;
        }
        list.innerHTML = items
            .map((item) => {
                const photos = countPhotos(item);
                return `<button type="button" class="fb-card" data-open-id="${item.id}">
                    <p class="fb-card__datetime">${escapeHtml(formatDateLong(item.dates?.received || item.createdAt))}</p>
                    <p class="fb-card__vehicle">${escapeHtml(displayVehicle(item))}</p>
                    <p class="fb-card__client">${escapeHtml(item.client?.name || "Bez nazwiska klienta")}</p>
                    <div class="fb-card__meta">
                        <span class="fb-badge">${item.status === "done" ? "Zamknięty" : "Szkic"}</span>
                        <span class="fb-badge fb-badge--muted">${photos} zdjęć</span>
                    </div>
                </button>`;
            })
            .join("");

        list.querySelectorAll("[data-open-id]").forEach((btn) => {
            btn.addEventListener("click", () => openProtocol(btn.dataset.openId));
        });
    }

    function countPhotos(record) {
        let n = (record.extraPhotos || []).length;
        Object.values(record.photos || {}).forEach((arr) => {
            n += (arr || []).length;
        });
        return n;
    }

    function formatDate(iso) {
        if (!iso) return "—";
        try {
            return new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
        } catch (_) {
            return iso;
        }
    }

    function escapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    async function openProtocol(id) {
        current = (await window.CAD_FieldBookDb.getProtocol(id)) || createEmptyProtocol();
        renderEditor();
        $("#fb-list-screen").classList.add("fb-hidden");
        $("#fb-edit-screen").classList.remove("fb-hidden");
    }

    async function newProtocol() {
        current = createEmptyProtocol();
        await window.CAD_FieldBookDb.saveProtocol(current);
        renderEditor();
        $("#fb-list-screen").classList.add("fb-hidden");
        $("#fb-edit-screen").classList.remove("fb-hidden");
    }

    function val(path, value) {
        const parts = path.split(".");
        let obj = current;
        for (let i = 0; i < parts.length - 1; i++) {
            obj[parts[i]] = obj[parts[i]] || {};
            obj = obj[parts[i]];
        }
        if (value === undefined) return obj[parts[parts.length - 1]] ?? "";
        obj[parts[parts.length - 1]] = value;
        scheduleSave();
    }

    function renderEditor() {
        const root = $("#fb-editor");
        const r = current;
        updateEditorHeader(r);

        root.innerHTML = `
            ${section("Dane klienta i pojazdu", `
                <div class="fb-field"><label>Imię i nazwisko / firma</label><input data-path="client.name" value="${attr(r.client?.name)}"></div>
                <div class="fb-field"><label>Telefon</label><input data-path="client.phone" inputmode="tel" value="${attr(r.client?.phone)}"></div>
                <div class="fb-field"><label>E-mail</label><input data-path="client.email" inputmode="email" value="${attr(r.client?.email)}"></div>
                <div class="fb-field"><label>Marka i model</label><input data-path="vehicle.make" value="${attr(r.vehicle?.make)}"></div>
                <div class="fb-field"><label>Nr rejestracyjny</label><input data-path="vehicle.plate" value="${attr(r.vehicle?.plate)}"></div>
                <div class="fb-field"><label>VIN</label><input data-path="vehicle.vin" value="${attr(r.vehicle?.vin)}"></div>
                <div class="fb-field"><label>Przebieg (km)</label><input data-path="vehicle.mileage" inputmode="numeric" value="${attr(r.vehicle?.mileage)}"></div>
                <div class="fb-field"><label>Kolor lakieru</label><input data-path="vehicle.color" value="${attr(r.vehicle?.color)}"></div>
                <div class="fb-field"><label>Data i godzina przyjęcia</label><input data-path="dates.received" type="datetime-local" value="${attr(r.dates?.received)}"></div>
                <div class="fb-field"><label>Planowany odbiór</label><input data-path="dates.pickup" type="datetime-local" value="${attr(r.dates?.pickup)}"></div>
            `, true)}
            ${section("Zakres usług", checksHtml("services", SERVICE_ITEMS, r.services))}
            ${section("Stan pojazdu + zdjęcia", conditionHtml(r))}
            ${section("Rzeczy klienta", `
                ${checksHtml("items", ITEM_CHECKS, r.items)}
                <div class="fb-field"><label>Uwagi do wyposażenia</label><textarea data-path="items.note">${escapeHtml(r.items?.note || "")}</textarea></div>
            `)}
            ${section("Zgody i warunki", checksHtml("consents", CONSENT_CHECKS, r.consents))}
            ${section("Uwagi dodatkowe", `
                <div class="fb-field"><label>Notatki</label><textarea data-path="notes">${escapeHtml(r.notes || "")}</textarea></div>
                ${photoZone("extra", "Zdjęcia ogólne", r.extraPhotos || [], true)}
            `)}
            ${section("Regulamin", regulaminHtml(r))}
            ${section("Podpisy / odbiór", `
                <div class="fb-field"><label>Miejsce</label><input data-path="signatures.place" value="${attr(r.signatures?.place)}"></div>
                <div class="fb-field"><label>Data przyjęcia (tekst)</label><input data-path="signatures.dateReceived" value="${attr(r.signatures?.dateReceived)}"></div>
                <div class="fb-field"><label>Klient (imię i nazwisko)</label><input data-path="signatures.clientName" value="${attr(r.signatures?.clientName)}"></div>
                <div class="fb-field"><label>Data odbioru</label><input data-path="signatures.datePickup" type="datetime-local" value="${attr(r.signatures?.datePickup)}"></div>
            `)}
        `;

        root.querySelectorAll(".fb-section__head").forEach((btn) => {
            btn.addEventListener("click", () => btn.closest(".fb-section").classList.toggle("is-open"));
        });

        root.querySelectorAll("[data-path]").forEach((el) => {
            const eventName = el.type === "checkbox" ? "change" : "input";
            el.addEventListener(eventName, () => {
                const path = el.dataset.path;
                if (el.type === "checkbox") val(path, el.checked);
                else val(path, el.value);
                if (path === "vehicle.make" || path === "vehicle.plate" || path === "dates.received") {
                    updateEditorHeader(current);
                }
            });
        });

        root.querySelectorAll("[data-check-group]").forEach((el) => {
            el.addEventListener("change", () => {
                const [group, key] = el.dataset.checkGroup.split(".");
                current[group] = current[group] || {};
                current[group][key] = el.checked;
                scheduleSave();
            });
        });

        root.querySelectorAll("[data-add-photo]").forEach((btn) => {
            btn.addEventListener("click", () => openPhotoPicker(btn.dataset.addPhoto));
        });

        root.querySelectorAll("[data-del-photo]").forEach((btn) => {
            btn.addEventListener("click", () => deletePhoto(btn.dataset.delPhoto, btn.dataset.photoId));
        });

        root.querySelectorAll("[data-photo-note]").forEach((input) => {
            input.addEventListener("input", () => updatePhotoNote(input.dataset.photoNote, input.dataset.photoId, input.value));
        });

        const ack = $("#fb-regulamin-ack");
        if (ack) {
            ack.checked = Boolean(r.regulamin?.acknowledged);
            ack.addEventListener("change", () => {
                current.regulamin.acknowledged = ack.checked;
                current.regulamin.acknowledgedAt = ack.checked ? new Date().toISOString() : "";
                scheduleSave();
            });
        }
    }

    function attr(v) {
        return escapeHtml(v || "").replace(/"/g, "&quot;");
    }

    function section(title, body, open = false) {
        return `<section class="fb-section${open ? " is-open" : ""}">
            <button type="button" class="fb-section__head">${escapeHtml(title)}</button>
            <div class="fb-section__body">${body}</div>
        </section>`;
    }

    function checksHtml(group, items, state = {}) {
        return `<div class="fb-checks">${items
            .map(
                ([key, label]) => `<label class="fb-check">
                <input type="checkbox" data-check-group="${group}.${key}" ${state[key] ? "checked" : ""}>
                <span>${escapeHtml(label)}</span>
            </label>`
            )
            .join("")}</div>`;
    }

    function conditionHtml(r) {
        const fields = PHOTO_SECTIONS.map(
            (s) => `
            <div class="fb-field">
                <label>${escapeHtml(s.label)}</label>
                <textarea data-path="condition.${s.id}">${escapeHtml(r.condition?.[s.id] || "")}</textarea>
                ${photoZone(s.id, "Zdjęcia", r.photos?.[s.id] || [])}
            </div>`
        );
        return fields.join("");
    }

    function photoZone(sectionId, label, photos, isExtra = false) {
        const grid = (photos || [])
            .map(
                (p) => `<div class="fb-photo">
                <div class="fb-photo__frame">
                    <img src="${p.dataUrl}" alt="">
                    <button type="button" data-del-photo="${sectionId}" data-photo-id="${p.id}" aria-label="Usuń">Usuń</button>
                </div>
                <input class="fb-photo__note" data-photo-note="${sectionId}" data-photo-id="${p.id}" value="${attr(p.note)}" placeholder="Opis uszkodzenia">
            </div>`
            )
            .join("");
        return `<div class="fb-photo-zone">
            <div class="fb-photo-zone__head">
                <strong>${escapeHtml(label)}</strong>
                <button type="button" class="fb-btn" data-add-photo="${sectionId}">Dodaj zdjęcie</button>
            </div>
            <div class="fb-photo-grid">${grid}</div>
        </div>`;
    }

    function regulaminHtml(r) {
        const body = REGULAMIN_SECTIONS.map(([t, p]) => `<h3>${escapeHtml(t)}</h3><p>${escapeHtml(p)}</p>`).join("");
        return `
            <div class="fb-regulamin">${body}</div>
            <label class="fb-check" style="margin-top:14px">
                <input type="checkbox" id="fb-regulamin-ack" ${r.regulamin?.acknowledged ? "checked" : ""}>
                <span>Klient zapoznał się z regulaminem (${r.regulamin?.acknowledgedAt ? formatDate(r.regulamin.acknowledgedAt) : "niepotwierdzone"})</span>
            </label>`;
    }

    function ensureFileInput() {
        if (fileInput) return fileInput;
        fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.capture = "environment";
        fileInput.className = "fb-file-input";
        fileInput.addEventListener("change", async () => {
            const file = fileInput.files?.[0];
            fileInput.value = "";
            if (!file || !current || !activePhotoSection) return;
            try {
                const dataUrl = await compressImage(file);
                const photo = { id: crypto.randomUUID(), dataUrl, note: "", createdAt: new Date().toISOString() };
                if (activePhotoSection === "extra") {
                    current.extraPhotos = current.extraPhotos || [];
                    current.extraPhotos.push(photo);
                } else {
                    current.photos = current.photos || {};
                    current.photos[activePhotoSection] = current.photos[activePhotoSection] || [];
                    current.photos[activePhotoSection].push(photo);
                }
                scheduleSave();
                renderEditor();
                toast("Zdjęcie dodane");
            } catch (err) {
                console.error(err);
                toast("Nie udało się dodać zdjęcia");
            }
        });
        document.body.appendChild(fileInput);
        return fileInput;
    }

    function openPhotoPicker(sectionId) {
        activePhotoSection = sectionId;
        ensureFileInput().click();
    }

    function deletePhoto(sectionId, photoId) {
        if (!current) return;
        if (sectionId === "extra") {
            current.extraPhotos = (current.extraPhotos || []).filter((p) => p.id !== photoId);
        } else {
            current.photos[sectionId] = (current.photos[sectionId] || []).filter((p) => p.id !== photoId);
        }
        scheduleSave();
        renderEditor();
    }

    function updatePhotoNote(sectionId, photoId, note) {
        const list = sectionId === "extra" ? current.extraPhotos : current.photos?.[sectionId];
        const photo = (list || []).find((p) => p.id === photoId);
        if (!photo) return;
        photo.note = note;
        scheduleSave();
    }

    const PROTOCOL_SERVICE_ITEMS = [
        ["extWash", "Mycie / detailing zewnętrzny"],
        ["interior", "Czyszczenie wnętrza"],
        ["fabric", "Pranie tapicerki materiałowej"],
        ["wax", "Wosk / zabezpieczenie lakieru"],
        ["leather", "Czyszczenie skóry / kierownicy"],
        ["decon", "Dekontaminacja lakieru"],
        ["petHair", "Usuwanie sierści / mocnych zabrudzeń"],
        ["other", "Inne ustalenia"]
    ];

    const PROTOCOL_ITEM_CHECKS = [
        ["valuablesRemoved", "Klient zabrał dokumenty, pieniądze i wartościowe rzeczy"],
        ["itemsLeft", "W aucie pozostają rzeczy wskazane wykonawcy"],
        ["seatsRemoved", "Foteliki / bagaż wymagają wyjęcia przed usługą"]
    ];

    const PROTOCOL_CONSENT_CHECKS = [
        ["weather", "Część usług może być wykonywana na zewnątrz — pogoda może wpłynąć na termin."],
        ["price", "Cena z kalkulatora jest orientacyjna; ostateczna wycena po oględzinach."],
        ["limits", "Nie każda plama, rysa lub zapach może zostać usunięta w 100%."],
        ["photos", "Zgoda na zdjęcia dokumentacyjne przed i po usłudze."]
    ];

    function exportFieldValue(label, value) {
        const text = String(value || "").trim();
        return `<div class="cad-doc__field"><label>${escapeHtml(label)}</label><div class="cad-doc__field-line">${text ? escapeHtml(text) : ""}</div></div>`;
    }

    function exportChecksHtml(items, group, record, twoCol) {
        const colClass = twoCol ? " cad-doc__checks--2col" : "";
        return `<div class="cad-doc__checks${colClass}">${items
            .map(([key, label]) => {
                const on = Boolean(record[group]?.[key]);
                return `<div class="cad-doc__check"><span class="cad-doc__check-box${on ? " cad-doc__check-box--on" : ""}"></span><span>${escapeHtml(label)}</span></div>`;
            })
            .join("")}</div>`;
    }

    function exportPhotoGrid(photos) {
        if (!photos?.length) return "";
        return `<div class="cad-doc__photos">${photos
            .map(
                (p) => `<figure class="cad-doc__photo">
                <img src="${p.dataUrl}" alt="">
                ${p.note ? `<figcaption>${escapeHtml(p.note)}</figcaption>` : ""}
            </figure>`
            )
            .join("")}</div>`;
    }

    function exportSignField(label, value) {
        const text = String(value || "").trim();
        if (text) {
            return `<div class="cad-doc__sign-field"><label>${escapeHtml(label)}</label><div class="cad-doc__field-line">${escapeHtml(text)}</div></div>`;
        }
        return `<div class="cad-doc__sign-field"><label>${escapeHtml(label)}</label><div class="cad-doc__sign-line"></div></div>`;
    }

    function buildExportHtml(record) {
        const docDate = formatDateLong(record.dates?.received || record.createdAt);
        const logoSrc = "../assets/logo1.png";
        const conditionFields = PHOTO_SECTIONS.map((s) => {
            const text = record.condition?.[s.id];
            const photos = record.photos?.[s.id] || [];
            return `${exportFieldValue(s.label, text)}${exportPhotoGrid(photos)}`;
        }).join("");
        const extraPhotos = exportPhotoGrid(record.extraPhotos || []);
        const notesBlock = record.notes
            ? `<div class="cad-doc__note-box cad-doc__note-box--tall">${escapeHtml(record.notes)}</div>`
            : `<div class="cad-doc__note-box cad-doc__note-box--tall"></div>`;

        return `<article class="cad-doc cad-doc--protocol">
<header class="cad-doc__masthead cad-doc__masthead--split">
    <div class="cad-doc__masthead-brand">
        <img class="cad-doc__logo" src="${logoSrc}" alt="" width="56" height="56">
        <div>
            <p class="cad-doc__brand-name">CAR ALL DETAILING</p>
            <p class="cad-doc__brand-sub">Karol Zagórski · Maarssen</p>
        </div>
    </div>
    <div class="cad-doc__masthead-meta">
        <span class="cad-doc__meta-label">Data dokumentu</span>
        <time class="cad-doc__datetime">${escapeHtml(docDate)}</time>
    </div>
</header>

<div class="cad-doc__body">
    <section class="cad-doc__section cad-doc__section--lead">
        <p class="cad-doc__intro">Protokół stanu pojazdu, zakresu usługi i ustaleń przed rozpoczęciem prac.</p>
    </section>

    <section class="cad-doc__section">
        <h2>1. Dane klienta i pojazdu</h2>
        <div class="cad-doc__field-grid cad-doc__field-grid--2">
            ${exportFieldValue("Imię i nazwisko / firma", record.client?.name)}
            ${exportFieldValue("Telefon", record.client?.phone)}
            ${exportFieldValue("E-mail", record.client?.email)}
            ${exportFieldValue("Marka i model", record.vehicle?.make)}
            ${exportFieldValue("Nr rejestracyjny", record.vehicle?.plate)}
            ${exportFieldValue("VIN", record.vehicle?.vin)}
            ${exportFieldValue("Przebieg (km)", record.vehicle?.mileage)}
            ${exportFieldValue("Kolor lakieru", record.vehicle?.color)}
            ${exportFieldValue("Data i godzina przyjęcia", formatDate(record.dates?.received))}
            ${exportFieldValue("Planowany odbiór", formatDate(record.dates?.pickup))}
        </div>
    </section>

    <section class="cad-doc__section">
        <h2>2. Zakres zamówionych usług</h2>
        ${exportChecksHtml(PROTOCOL_SERVICE_ITEMS, "services", record, true)}
        <div class="cad-doc__field cad-doc__field--full"><label>Szczegóły innych ustaleń</label><div class="cad-doc__field-line"></div></div>
    </section>

    <section class="cad-doc__section">
        <h2>3. Stan pojazdu przed usługą</h2>
        <div class="cad-doc__field-grid cad-doc__field-grid--2">
            ${conditionFields}
        </div>
    </section>

    <section class="cad-doc__section">
        <h2>4. Rzeczy klienta i wyposażenie</h2>
        ${exportChecksHtml(PROTOCOL_ITEM_CHECKS, "items", record, false)}
        <div class="cad-doc__field cad-doc__field--full"><label>Uwagi do wyposażenia</label><div class="cad-doc__field-line">${escapeHtml(record.items?.note || "")}</div></div>
    </section>

    <section class="cad-doc__section">
        <h2>5. Warunki wykonania i zgody</h2>
        ${exportChecksHtml(PROTOCOL_CONSENT_CHECKS, "consents", record, false)}
    </section>

    <section class="cad-doc__section">
        <h2>6. Uwagi dodatkowe</h2>
        ${notesBlock}
        ${extraPhotos}
    </section>

    <section class="cad-doc__section">
        <h2>7. Potwierdzenie odbioru</h2>
        <p class="cad-doc__section-note">Klient odbiera pojazd w uzgodnionym terminie. Uwagi do zakresu lub efektu prac — najlepiej podczas odbioru.</p>
    </section>

    <div class="cad-doc__signatures">
        <div class="cad-doc__sign-row">
            ${exportSignField("Miejsce", record.signatures?.place)}
            ${exportSignField("Data przyjęcia", record.signatures?.dateReceived || formatDate(record.dates?.received))}
        </div>
        <div class="cad-doc__sign-row">
            ${exportSignField("Podpis klienta", record.signatures?.clientName)}
            <div class="cad-doc__sign-field"><label>Podpis wykonawcy</label><div class="cad-doc__sign-line"></div></div>
        </div>
        <div class="cad-doc__sign-row">
            ${exportSignField("Data odbioru", formatDate(record.signatures?.datePickup))}
            <div class="cad-doc__sign-field"><label>Podpis klienta przy odbiorze</label><div class="cad-doc__sign-line"></div></div>
        </div>
    </div>

    <footer class="cad-doc__footer">caralldetailing.nl · +48 731 693 089</footer>
</div>
</article>`;
    }

    function printHtmlDocument(html) {
        const iframe = document.createElement("iframe");
        iframe.setAttribute("aria-hidden", "true");
        iframe.style.cssText =
            "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
        document.body.appendChild(iframe);
        const docHtml = String(html).includes("<!DOCTYPE")
            ? html
            : `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><title>Car All Detailing</title></head><body>${html}</body></html>`;
        const win = iframe.contentWindow;
        win.document.open();
        win.document.write(docHtml);
        win.document.close();
        return new Promise((resolve) => {
            window.setTimeout(() => {
                win.focus();
                win.print();
                window.setTimeout(() => iframe.remove(), 600);
                resolve(true);
            }, 400);
        });
    }

    async function exportPrint() {
        if (!current) return;
        await window.CAD_FieldBookDb.saveProtocol(current);
        const html = buildExportHtml(current);
        const ok = window.CAD_printHtml
            ? await window.CAD_printHtml(html, "Car All Detailing — protokół")
            : await printHtmlDocument(html);
        if (ok) toast("Otwarto okno druku");
    }

    function bindApp() {
        $("#fb-new-btn")?.addEventListener("click", newProtocol);
        $("#fb-back-btn")?.addEventListener("click", showList);
        $("#fb-save-btn")?.addEventListener("click", async () => {
            if (!current) return;
            current.updatedAt = new Date().toISOString();
            await window.CAD_FieldBookDb.saveProtocol(current);
            toast("Zapisano");
        });
        $("#fb-done-btn")?.addEventListener("click", async () => {
            if (!current) return;
            current.status = "done";
            current.updatedAt = new Date().toISOString();
            await window.CAD_FieldBookDb.saveProtocol(current);
            toast("Oznaczono jako zamknięty");
            showList();
        });
        $("#fb-export-btn")?.addEventListener("click", exportPrint);
        $("#fb-delete-btn")?.addEventListener("click", async () => {
            if (!current) return;
            if (!confirm("Usunąć ten protokół z telefonu?")) return;
            await window.CAD_FieldBookDb.deleteProtocol(current.id);
            current = null;
            toast("Usunięto");
            showList();
        });
        $("#fb-change-pin")?.addEventListener("click", () => {
            if (!confirm("Wylogować i ustawić nowy PIN?")) return;
            localStorage.removeItem(PIN_KEY);
            sessionStorage.removeItem(UNLOCK_KEY);
            location.reload();
        });
    }

    function init() {
        bindLockScreen();
        bindApp();
        if (isUnlocked()) showList();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
