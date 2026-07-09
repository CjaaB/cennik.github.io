(function () {
    function $(id) {
        return document.getElementById(id);
    }

    function toast(msg, err) {
        window.CAD_Admin?.toast?.(msg, err);
    }

    const SCREEN_META = {
        inbox: { title: "Wiadomości", subtitle: "Skrzynka i odpowiedzi klientów" },
        clients: { title: "Klienci", subtitle: "Urządzenia i kontakt" },
        stats: { title: "Przegląd", subtitle: "Statystyki i eksport" },
        settings: { title: "Ustawienia", subtitle: "Cennik, godziny, szablony" }
    };

    let clientsCache = [];

    function showScreen(name) {
        if (!SCREEN_META[name]) name = "inbox";
        document.querySelectorAll(".admin-screen-view").forEach((el) => {
            el.hidden = el.dataset.screen !== name;
        });
        document.querySelectorAll(".admin-nav-btn").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.screen === name);
        });
        const meta = SCREEN_META[name];
        const barLabel = $("admin-user-label");
        if (barLabel && meta) {
            const email = barLabel.dataset.adminEmail;
            barLabel.textContent = email ? `${email} · ${meta.subtitle}` : meta.subtitle;
        }
        if (name !== "inbox") {
            window.CAD_Admin?.closeThread?.();
        }
        if (name === "stats") renderStats();
        if (name === "settings") fillSettingsForm();
        if (name === "clients") listenClients();
    }

    function updateNavBadges(unread) {
        const badge = $("admin-nav-badge");
        if (!badge) return;
        const n = typeof unread === "number" ? unread : 0;
        badge.hidden = n <= 0;
        badge.textContent = n > 99 ? "99+" : String(n);
    }

    let clientsUnsub = null;

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function formatClientTime(ts) {
        if (!ts?.toDate) return "—";
        return ts.toDate().toLocaleString("pl-PL", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function findConvIdForClient(clientId, lastConvId) {
        if (lastConvId) return lastConvId;
        if (!clientId) return null;
        const docs = window.CAD_Admin?.getAllConversations?.() || [];
        let bestId = null;
        let bestTs = 0;
        docs.forEach((d) => {
            const data = d.data();
            if (data.deleted || data.clientId !== clientId) return;
            const ts = data.lastMessageAt?.toDate?.()?.getTime() || 0;
            if (ts >= bestTs) {
                bestTs = ts;
                bestId = d.id;
            }
        });
        return bestId;
    }

    function openClientConversation(clientId, lastConvId) {
        const convId = findConvIdForClient(clientId, lastConvId);
        if (!convId) {
            toast("Brak rozmowy z tym klientem.", true);
            return;
        }
        window.CAD_Admin?.openConversation?.(convId);
        showScreen("inbox");
    }

    async function deleteClientProfile(clientId, displayName) {
        const db = window.CAD_Admin?.getDb?.();
        if (!db || !clientId) return;
        const label = displayName || "klienta";
        if (
            !window.confirm(
                `Usunąć wpis „${label}” z listy klientów?\n\nRozmowy w czacie zostają — zniknie tylko ten wpis (to urządzenie).`
            )
        ) {
            return;
        }
        try {
            await db.collection("clients").doc(clientId).delete();
            toast("Wpis klienta usunięty.");
        } catch (e) {
            toast("Nie udało się usunąć wpisu.", true);
        }
    }

    function filterClients(docs) {
        const q = ($("clients-search")?.value || "").trim().toLowerCase();
        if (!q) return docs;
        return docs.filter((c) => {
            const hay = [c.displayName, c.email, c.id, c.lang].filter(Boolean).join(" ").toLowerCase();
            return hay.includes(q);
        });
    }

    function paintClientsList(items) {
        const list = $("admin-clients-list");
        if (!list) return;
        if (!items.length) {
            list.innerHTML =
                clientsCache.length > 0
                    ? '<li class="admin-empty">Brak wyników dla tego wyszukiwania.</li>'
                    : '<li class="admin-empty">Brak wpisów — pojawią się, gdy ktoś napisze na czacie (z e-mailem).</li>';
            return;
        }
        list.innerHTML = items
            .map((c) => {
                const idShort = (c.id || "").slice(0, 10);
                const email = c.email || "Brak e-mail";
                const name = c.displayName || "Klient";
                const when = formatClientTime(c.lastSeenAt);
                const lang = c.lang ? String(c.lang).toUpperCase() : "";
                const convId = findConvIdForClient(c.id, c.lastConvId);
                const convHint = convId
                    ? ""
                    : `<small class="admin-client-item__note">Brak aktywnej rozmowy</small>`;
                const langLine = lang ? `<small>Język: ${escapeHtml(lang)}</small>` : "";
                return `<li class="admin-client-item">
                    <button type="button" class="admin-client-item__tap" data-client="${escapeHtml(c.id)}" data-conv="${escapeHtml(convId || "")}" aria-label="Otwórz rozmowę z ${escapeHtml(name)}">
                    <div class="admin-client-item__main">
                        <strong>${escapeHtml(name)}</strong>
                        <span class="${c.email ? "" : "admin-client-item__warn"}">${escapeHtml(email)}</span>
                        <small>ID urządzenia: ${escapeHtml(idShort)}… · ostatnio: ${escapeHtml(when)}</small>
                        ${langLine}
                        ${convHint}
                    </div>
                    </button>
                    <div class="admin-client-actions">
                        <button type="button" class="admin-btn admin-btn--gold admin-btn--sm admin-client-open" data-client="${escapeHtml(c.id)}" data-conv="${escapeHtml(convId || "")}"${convId ? "" : " disabled"}>Otwórz rozmowę</button>
                        <button type="button" class="admin-btn admin-btn--outline admin-btn--sm admin-client-delete" data-client="${escapeHtml(c.id)}" data-name="${escapeHtml(name)}">Usuń wpis</button>
                    </div>
                </li>`;
            })
            .join("");
        list.querySelectorAll(".admin-client-item__tap, .admin-client-open").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                if (btn.disabled) return;
                e.preventDefault();
                openClientConversation(
                    btn.getAttribute("data-client"),
                    btn.getAttribute("data-conv") || null
                );
            });
        });
        list.querySelectorAll(".admin-client-delete").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteClientProfile(btn.getAttribute("data-client"), btn.getAttribute("data-name"));
            });
        });
    }

    function renderClientsFromCache() {
        paintClientsList(filterClients(clientsCache));
    }

    function renderClientsList(snap) {
        clientsCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderClientsFromCache();
    }

    function listenClients() {
        const db = window.CAD_Admin?.getDb?.();
        if (!db) return;
        if (clientsUnsub) {
            db.collection("clients")
                .orderBy("lastSeenAt", "desc")
                .limit(200)
                .get()
                .then((snap) => renderClientsList(snap))
                .catch(() => toast("Nie udało się wczytać listy klientów.", true));
            return;
        }
        clientsUnsub = db
            .collection("clients")
            .orderBy("lastSeenAt", "desc")
            .limit(200)
            .onSnapshot(
                (snap) => renderClientsList(snap),
                () => toast("Nie udało się wczytać listy klientów.", true)
            );
    }

    function getDocs() {
        return window.CAD_Admin?.getAllConversations?.() || [];
    }

    function renderStats() {
        const docs = getDocs();
        const now = Date.now();
        const week = 7 * 24 * 60 * 60 * 1000;
        let active = 0;
        let archived = 0;
        let unread = 0;
        let weekCount = 0;
        let clients = new Set();

        docs.forEach((d) => {
            const data = d.data();
            if (data.deleted) return;
            if (data.archived) archived++;
            else active++;
            if (data.unreadAdmin && !data.archived) unread++;
            const ts = data.createdAt?.toDate?.()?.getTime?.() || 0;
            if (ts && now - ts < week) weekCount++;
            if (data.clientId) clients.add(data.clientId);
        });

        const set = (id, val) => {
            const el = $(id);
            if (el) el.textContent = String(val);
        };
        set("stat-active", active);
        set("stat-archived", archived);
        set("stat-unread", unread);
        set("stat-week", weekCount);
        set("stat-clients", clients.size);
        set("stat-total", docs.filter((d) => !d.data().deleted).length);

        const unreadCard = $("stat-card-unread");
        if (unreadCard) unreadCard.classList.toggle("admin-stat-card--pulse", unread > 0);
        updateNavBadges(unread);
    }

    function getCatalogFromForm() {
        try {
            const parsed = JSON.parse($("settings-prices-json")?.value || "{}");
            return {
                catalog: parsed.catalog || window.CAD_DATA?.getSettings?.()?.catalog,
                sizes: parsed.sizes || window.CAD_DATA?.getSettings?.()?.sizes
            };
        } catch (e) {
            const s = window.CAD_DATA?.getSettings?.() || {};
            return { catalog: s.catalog, sizes: s.sizes };
        }
    }

    function renderCatalogQuickEdit() {
        const box = $("catalog-quick-edit");
        if (!box) return;
        const { catalog, sizes } = getCatalogFromForm();
        const sizeIds = (sizes || []).map((s) => s.id).filter(Boolean);
        const rows = [];
        (catalog || []).forEach((group) => {
            (group.items || []).forEach((item) => {
                if (!item?.id) return;
                const name = item.name?.pl || item.id;
                if (item.static != null) {
                    rows.push(
                        `<div class="catalog-quick-row" data-id="${escapeHtml(item.id)}" data-mode="static">
                        <div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(item.id)}</small></div>
                        <div class="catalog-quick-prices"><label>€<input type="number" data-field="static" value="${Number(item.static) || 0}" min="0" step="1"></label></div>
                    </div>`
                    );
                } else if (item.prices) {
                    const inputs = sizeIds
                        .map(
                            (sid) =>
                                `<label>${escapeHtml(sid)}<input type="number" data-size="${escapeHtml(sid)}" value="${Number(item.prices[sid]) || 0}" min="0" step="1"></label>`
                        )
                        .join("");
                    rows.push(
                        `<div class="catalog-quick-row" data-id="${escapeHtml(item.id)}" data-mode="sizes">
                        <div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(item.id)}</small></div>
                        <div class="catalog-quick-prices">${inputs}</div>
                    </div>`
                    );
                }
            });
        });
        box.innerHTML =
            rows.join("") || '<p class="admin-empty">Brak pozycji — wgraj domyślny cennik lub popraw JSON.</p>';
    }

    function applyCatalogQuickEdit() {
        const pricesEl = $("settings-prices-json");
        if (!pricesEl) return;
        let parsed;
        try {
            parsed = JSON.parse(pricesEl.value || "{}");
        } catch (e) {
            toast("Najpierw popraw JSON lub wgraj domyślny cennik.", true);
            return;
        }
        if (!Array.isArray(parsed.catalog)) {
            toast("Brak cennika w JSON.", true);
            return;
        }
        document.querySelectorAll(".catalog-quick-row").forEach((row) => {
            const id = row.dataset.id;
            const mode = row.dataset.mode;
            parsed.catalog.forEach((group) => {
                const item = (group.items || []).find((it) => it.id === id);
                if (!item) return;
                if (mode === "static") {
                    const inp = row.querySelector('[data-field="static"]');
                    if (inp) item.static = Number(inp.value) || 0;
                } else {
                    row.querySelectorAll("input[data-size]").forEach((inp) => {
                        if (!item.prices) item.prices = {};
                        item.prices[inp.dataset.size] = Number(inp.value) || 0;
                    });
                }
            });
        });
        pricesEl.value = JSON.stringify(parsed, null, 2);
    }

    function switchHoursTab(lang) {
        document.querySelectorAll(".admin-hours-tab").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.hoursLang === lang);
        });
        document.querySelectorAll(".admin-hours-panel").forEach((panel) => {
            const on = panel.dataset.hoursPanel === lang;
            panel.hidden = !on;
            panel.classList.toggle("active", on);
        });
    }

    async function saveAllSettings() {
        applyCatalogQuickEdit();
        const db = window.CAD_Admin?.getDb?.();
        if (!db) return;

        const tplText = $("settings-admin-templates")?.value || "";
        const tplLines = tplText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        if (tplLines.length) {
            try {
                const tplOk = await window.CAD_Admin?.saveReplyTemplatesFromText?.(tplText);
                if (!tplOk) {
                    toast("Nie zapisano szablonów.", true);
                    return;
                }
                window.CAD_Admin?.renderAdminTemplates?.();
            } catch (e) {
                toast("Nie zapisano szablonów.", true);
                return;
            }
        }

        let catalog = null;
        let sizes = null;
        try {
            const parsed = JSON.parse($("settings-prices-json")?.value || "{}");
            catalog = parsed.catalog;
            sizes = parsed.sizes;
        } catch (e) {
            toast("Błędny JSON cennika — popraw w sekcji zaawansowanej.", true);
            return;
        }

        try {
            await window.CAD_DATA.saveSettings(db, {
                businessHours: {
                    pl: $("settings-hours-pl")?.value?.trim() || "",
                    nl: $("settings-hours-nl")?.value?.trim() || "",
                    en: $("settings-hours-en")?.value?.trim() || ""
                },
                calendlyUrl: $("settings-calendly")?.value?.trim() || "",
                catalog: catalog || undefined,
                sizes: sizes || undefined
            });
            toast("Wszystko zapisane — apka klienta ma już nowe dane.");
            renderCatalogQuickEdit();
        } catch (e) {
            toast("Nie zapisano ustawień. Spróbuj ponownie.", true);
        }
    }

    function fillSettingsForm() {
        const s = window.CAD_DATA?.getSettings?.() || {};
        const hoursPl = $("settings-hours-pl");
        const hoursNl = $("settings-hours-nl");
        const hoursEn = $("settings-hours-en");
        const cal = $("settings-calendly");
        const prices = $("settings-prices-json");
        const tpl = $("settings-admin-templates");
        if (hoursPl) hoursPl.value = s.businessHours?.pl || "";
        if (hoursNl) hoursNl.value = s.businessHours?.nl || "";
        if (hoursEn) hoursEn.value = s.businessHours?.en || "";
        if (cal) cal.value = s.calendlyUrl || "";
        if (prices) {
            prices.value = JSON.stringify({ catalog: s.catalog, sizes: s.sizes }, null, 2);
        }
        if (tpl) {
            const templates = window.CAD_Admin?.getReplyTemplates?.() || [];
            tpl.value = templates.join("\n");
        }
        renderCatalogQuickEdit();
    }

    async function saveSettingsForm() {
        const db = window.CAD_Admin?.getDb?.();
        if (!db) return;
        let catalog = null;
        let sizes = null;
        try {
            const parsed = JSON.parse($("settings-prices-json")?.value || "{}");
            catalog = parsed.catalog;
            sizes = parsed.sizes;
        } catch (e) {
            toast("Błędny JSON cen — popraw format.", true);
            return;
        }
        try {
            await window.CAD_DATA.saveSettings(db, {
                businessHours: {
                    pl: $("settings-hours-pl")?.value?.trim() || "",
                    nl: $("settings-hours-nl")?.value?.trim() || "",
                    en: $("settings-hours-en")?.value?.trim() || ""
                },
                calendlyUrl: $("settings-calendly")?.value?.trim() || "",
                catalog: catalog || undefined,
                sizes: sizes || undefined
            });
            toast("Ustawienia zapisane — widoczne w apce klienta.");
            renderCatalogQuickEdit();
        } catch (e) {
            toast("Nie zapisano ustawień. Spróbuj ponownie.", true);
        }
    }

    function exportCsv() {
        const docs = getDocs().filter((d) => !d.data().deleted);
        const rows = [
            [
                "id",
                "clientName",
                "clientId",
                "clientEmail",
                "status",
                "archived",
                "lastMessage",
                "lastMessageAt",
                "lang"
            ].join(",")
        ];
        docs.forEach((d) => {
            const data = d.data();
            const st = window.CAD_DATA?.convStatusLabel?.(data)?.pl || "";
            const line = [
                d.id,
                csvCell(data.clientName),
                csvCell(data.clientId),
                csvCell(data.clientEmail),
                csvCell(st),
                data.archived ? "yes" : "no",
                csvCell((data.lastMessage || "").slice(0, 200)),
                csvCell(formatCsvTime(data.lastMessageAt)),
                csvCell(data.clientLang)
            ].join(",");
            rows.push(line);
        });
        const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `cad-rozmowy-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast("Plik CSV pobrany.");
    }

    function csvCell(v) {
        const s = String(v ?? "").replace(/"/g, '""');
        return `"${s}"`;
    }

    function formatCsvTime(ts) {
        if (!ts?.toDate) return "";
        return ts.toDate().toISOString();
    }

    let uiBound = false;

    function bind() {
        if (uiBound) return;
        uiBound = true;
        document.querySelectorAll(".admin-nav-btn").forEach((btn) => {
            btn.addEventListener("click", () => showScreen(btn.dataset.screen || "inbox"));
        });
        $("settings-save-all-btn")?.addEventListener("click", saveAllSettings);
        $("catalog-quick-apply")?.addEventListener("click", applyCatalogQuickEdit);
        $("settings-prices-json")?.addEventListener("change", renderCatalogQuickEdit);
        $("export-csv-btn")?.addEventListener("click", exportCsv);
        $("stats-goto-inbox")?.addEventListener("click", () => showScreen("inbox"));
        $("stats-goto-clients")?.addEventListener("click", () => showScreen("clients"));
        $("clients-search")?.addEventListener("input", renderClientsFromCache);
        document.querySelectorAll(".admin-hours-tab").forEach((btn) => {
            btn.addEventListener("click", () => switchHoursTab(btn.dataset.hoursLang || "pl"));
        });
        $("seed-settings-btn")?.addEventListener("click", async () => {
            const db = window.CAD_Admin?.getDb?.();
            if (!db) return;
            try {
                await window.CAD_DATA.saveSettings(db, window.CAD_DATA.DEFAULT_APP_SETTINGS);
                fillSettingsForm();
                toast("Wgrano domyślny cennik.");
            } catch (e) {
                toast("Błąd zapisu cennika.", true);
            }
        });
    }

    window.CAD_AdminPanel = {
        init() {
            bind();
            showScreen("inbox");
        },
        refreshStats: renderStats,
        updateNavBadges,
        showScreen
    };
})();
