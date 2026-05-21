(function () {
    const STORAGE_KEY = "cad_calculator_state_v2";
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

    function formatTotal(eur) {
        const lang = window.CAD_APP?.locale || "pl";
        const rate = 4.32;
        const cur = localStorage.getItem("cad_currency_v1") || "EUR";
        if (cur === "PLN") {
            const pln = Math.round(eur * rate);
            return `${pln} zł`;
        }
        return `${eur} €`;
    }

    function readQuoteState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const state = JSON.parse(raw);
            if (!state?.selectedServiceIds?.length) return null;
            if (state.ts && Date.now() - state.ts > MAX_AGE_MS) return null;
            return state;
        } catch (e) {
            return null;
        }
    }

    function buildChatMessage(state) {
        const lang = window.CAD_APP?.locale || "pl";
        const total = formatTotal(state.totalEur || 0);
        const count = state.selectedServiceIds.length;
        const car = state.carModel ? `\n${appT("quoteResumeCar")}: ${state.carModel}` : "";
        const size = state.size || "M";

        if (lang === "nl") {
            return `Hoi Karol! Ik heb een offerte in de calculator:\nKlasse: ${size}${car}\n${count} diensten geselecteerd\nTotaal: ${total}\nKan ik een datum afspreken?`;
        }
        if (lang === "en") {
            return `Hi Karol! I built a quote in the calculator:\nClass: ${size}${car}\n${count} services selected\nTotal: ${total}\nCan we schedule a date?`;
        }
        return `Cześć Karol! Mam wycenę z kalkulatora:\nKlasa: ${size}${car}\nWybrane usługi: ${count}\nSuma: ${total}\nCzy możemy ustalić termin?`;
    }

    function updateGreeting() {
        const el = document.getElementById("app-greeting");
        if (!el) return;
        const hour = new Date().getHours();
        let key = "greetingNight";
        if (hour >= 5 && hour < 12) key = "greetingMorning";
        else if (hour >= 12 && hour < 18) key = "greetingAfternoon";
        else if (hour >= 18 && hour < 22) key = "greetingEvening";
        el.textContent = appT(key);
    }

    function updateQuoteResume() {
        const box = document.getElementById("quote-resume");
        if (!box) return;
        const state = readQuoteState();
        if (!state) {
            box.hidden = true;
            return;
        }

        const title = document.getElementById("quote-resume-title");
        const meta = document.getElementById("quote-resume-meta");
        if (title) {
            title.textContent = appT("quoteResumeTitle", {
                total: formatTotal(state.totalEur || 0),
                count: state.selectedServiceIds.length
            });
        }
        if (meta) {
            meta.textContent = state.carModel
                ? appT("quoteResumeMetaModel", { model: state.carModel })
                : appT("quoteResumeMeta");
        }
        box.hidden = false;
    }

    function sendQuoteToChat() {
        const state = readQuoteState();
        if (!state) return;
        const msg = document.getElementById("chat-first-message");
        if (msg) msg.value = buildChatMessage(state);
        if (typeof showPanel === "function") showPanel("chat");
        else location.hash = "chat";
        document.getElementById("chat-client-name")?.focus();
    }

    function bindHome() {
        document.getElementById("quote-to-chat-btn")?.addEventListener("click", sendQuoteToChat);
        window.addEventListener("message", (event) => {
            if (event.data?.type === "cad:quote-updated") updateQuoteResume();
        });
        window.addEventListener("cad:quote-updated", updateQuoteResume);
        window.addEventListener("storage", (event) => {
            if (event.key === STORAGE_KEY) updateQuoteResume();
        });
        window.addEventListener("cad:app-locale-change", () => {
            updateGreeting();
            updateQuoteResume();
        });
    }

    window.CAD_AppHome = {
        init() {
            updateGreeting();
            updateQuoteResume();
            bindHome();
        },
        refreshQuoteResume: updateQuoteResume,
        sendQuoteToChat
    };
})();
