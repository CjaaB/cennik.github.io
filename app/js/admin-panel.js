(function () {
    function $(id) {
        return document.getElementById(id);
    }

    function toast(msg, err) {
        window.CAD_Admin?.toast?.(msg, err);
    }

    function showScreen(name) {
        document.querySelectorAll(".admin-screen-view").forEach((el) => {
            el.hidden = el.dataset.screen !== name;
        });
        document.querySelectorAll(".admin-nav-btn").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.screen === name);
        });
        if (name !== "inbox") {
            window.CAD_Admin?.closeThread?.();
        }
        if (name === "stats") renderStats();
        if (name === "settings") fillSettingsForm();
        if (name === "clients") listenClients();
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

    function renderClientsList(snap) {
        const list = $("admin-clients-list");
        if (!list) return;
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!docs.length) {
            list.innerHTML =
                '<li class="admin-empty">Brak wpisów — pojawią się, gdy ktoś napisze na czacie (z e-mailem).</li>';
            return;
        }
        list.innerHTML = docs
            .map((c) => {
                const idShort = (c.id || "").slice(0, 10);
                const email = c.email || "Brak e-mail";
                const name = c.displayName || "Klient";
                const when = formatClientTime(c.lastSeenAt);
                const convBtn = c.lastConvId
                    ? `<button type="button" class="btn btn-sm btn-outline admin-client-open" data-conv="${escapeHtml(c.lastConvId)}">Rozmowa</button>`
                    : "";
                return `<li class="admin-client-item">
                    <div class="admin-client-item__main">
                        <strong>${escapeHtml(name)}</strong>
                        <span class="${c.email ? "" : "admin-client-item__warn"}">${escapeHtml(email)}</span>
                        <small>ID urządzenia: ${escapeHtml(idShort)}… · ostatnio: ${escapeHtml(when)}</small>
                    </div>
                    ${convBtn}
                </li>`;
            })
            .join("");
        list.querySelectorAll(".admin-client-open").forEach((btn) => {
            btn.addEventListener("click", () => {
                const convId = btn.getAttribute("data-conv");
                if (!convId) return;
                window.CAD_Admin?.openConversation?.(convId);
                showScreen("inbox");
            });
        });
    }

    function listenClients() {
        const db = window.CAD_Admin?.getDb?.();
        if (!db) return;
        if (clientsUnsub) return;
        clientsUnsub = db
            .collection("clients")
            .orderBy("lastSeenAt", "desc")
            .limit(200)
            .onSnapshot(
                (snap) => renderClientsList(snap),
                () => toast("Nie wczytano listy klientów (reguły Firestore?).", true)
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
    }

    function fillSettingsForm() {
        const s = window.CAD_DATA?.getSettings?.() || {};
        const hours = $("settings-hours-pl");
        const cal = $("settings-calendly");
        const prices = $("settings-prices-json");
        if (hours) hours.value = s.businessHours?.pl || "";
        if (cal) cal.value = s.calendlyUrl || "";
        if (prices) {
            prices.value = JSON.stringify({ catalog: s.catalog, sizes: s.sizes }, null, 2);
        }
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
                    nl: $("settings-hours-pl")?.value?.trim() || "",
                    en: $("settings-hours-pl")?.value?.trim() || ""
                },
                calendlyUrl: $("settings-calendly")?.value?.trim() || "",
                catalog: catalog || undefined,
                sizes: sizes || undefined
            });
            toast("Ustawienia zapisane w Firebase.");
        } catch (e) {
            toast("Nie zapisano ustawień. Sprawdź reguły Firestore.", true);
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
        $("settings-save-btn")?.addEventListener("click", saveSettingsForm);
        $("export-csv-btn")?.addEventListener("click", exportCsv);
        $("seed-settings-btn")?.addEventListener("click", async () => {
            const db = window.CAD_Admin?.getDb?.();
            if (!db) return;
            try {
                await window.CAD_DATA.saveSettings(db, window.CAD_DATA.DEFAULT_APP_SETTINGS);
                fillSettingsForm();
                toast("Wgrano domyślny cennik do Firebase.");
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
        showScreen
    };
})();
