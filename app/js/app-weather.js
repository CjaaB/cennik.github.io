(function () {

    let currentAssessment = null;



    function weatherConfig() {

        return window.CAD_CONFIG?.weather;

    }



    function $(id) {

        return document.getElementById(id);

    }



    function dayLabel(dateString, index) {

        const locale = window.CAD_APP?.locale === "nl" ? "nl-NL" : window.CAD_APP?.locale === "en" ? "en-GB" : "pl-PL";

        if (index === 0) return appT("weatherToday");

        if (index === 1) return appT("weatherTomorrow");

        return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(dateString));

    }



    function weatherIcon(code) {

        if (code === 0) return "fas fa-sun";

        if (code <= 3) return "fas fa-cloud-sun";

        if (code === 45 || code === 48) return "fas fa-smog";

        if (code >= 51 && code <= 82) return "fas fa-cloud-rain";

        if (code >= 85 && code <= 86) return "fas fa-snowflake";

        if (code >= 95) return "fas fa-bolt";

        return "fas fa-cloud";

    }



    function assessDay(day) {

        const rainy = day.code >= 51 && day.code <= 82;

        const storm = day.code >= 85 || day.code === 95 || day.code === 96 || day.code === 99;

        if (storm || day.rainChance >= 70 || day.wind >= 42 || day.tempMax <= 4) {

            return { tone: "bad", label: appT("weatherBadLabel") };

        }

        if (rainy || day.rainChance >= 40 || day.wind >= 30 || day.tempMax <= 8) {

            return { tone: "caution", label: appT("weatherCautionLabel") };

        }

        return { tone: "good", label: appT("weatherGoodLabel") };

    }



    function buildSummary(day, cautionDays, location) {

        if (day.tone === "good" && cautionDays === 0) {

            return appT("weatherGoodSummary", { location });

        }

        if (day.tone === "bad") {

            return appT("weatherBadSummary", { location });

        }

        return appT("weatherCautionSummary", { location });

    }



    function normalizeForecast(data) {

        const daily = data?.daily;

        if (!daily?.time?.length) return [];

        return daily.time.slice(0, 3).map((date, index) => ({

            date,

            index,

            code: Number(daily.weather_code?.[index] ?? 0),

            tempMax: Math.round(Number(daily.temperature_2m_max?.[index] ?? 0)),

            tempMin: Math.round(Number(daily.temperature_2m_min?.[index] ?? 0)),

            rainChance: Math.round(Number(daily.precipitation_probability_max?.[index] ?? 0)),

            wind: Math.round(Number(daily.wind_speed_10m_max?.[index] ?? 0))

        }));

    }



    function updateTempPreview(tempMax) {
        const bubbleTemp = $("app-weather-bubble-temp");
        const label = typeof tempMax === "number" && !Number.isNaN(tempMax) ? `${tempMax}°` : "--°";
        if (bubbleTemp) bubbleTemp.textContent = label;
    }



    function updateBubblePreview(day, location) {

        const toggleIcon = document.querySelector("#app-weather-toggle .weather-bubble__icon");

        const toggleSmall = document.querySelector("#app-weather-toggle .weather-bubble__copy small");

        if (toggleIcon) toggleIcon.innerHTML = `<i class="${weatherIcon(day.code)}"></i>`;

        if (toggleSmall) {

            toggleSmall.textContent = `${location} · ${day.tempMax}°C · ${day.label}`;

        }

        updateTempPreview(day.tempMax);

    }



    function windMeterWidth(wind) {

        return `${Math.min(Math.max(wind / 60, 0.08), 1) * 100}%`;

    }



    function renderDayCard(d) {

        const rainWidth = `${Math.min(Math.max(d.rainChance, 4), 100)}%`;

        return `

            <article class="weather-day weather-day--${d.tone}">

                <div class="weather-day__head">

                    <span class="weather-day__label">${dayLabel(d.date, d.index)}</span>

                    <span class="weather-day__icon" aria-hidden="true"><i class="${weatherIcon(d.code)}"></i></span>

                </div>

                <div class="weather-day__temps">

                    <strong class="weather-day__max">${d.tempMax}°</strong>

                    <span class="weather-day__min">${d.tempMin}°</span>

                </div>

                <span class="weather-day__badge">${d.label}</span>

                <div class="weather-day__meters">

                    <div class="weather-day__meter">

                        <span class="weather-day__meter-label"><i class="fas fa-droplet" aria-hidden="true"></i> ${d.rainChance}%</span>

                        <span class="weather-day__meter-track" aria-hidden="true"><span class="weather-day__meter-fill weather-day__meter-fill--rain" style="width:${rainWidth}"></span></span>

                    </div>

                    <div class="weather-day__meter">

                        <span class="weather-day__meter-label"><i class="fas fa-wind" aria-hidden="true"></i> ${d.wind} km/h</span>

                        <span class="weather-day__meter-track" aria-hidden="true"><span class="weather-day__meter-fill weather-day__meter-fill--wind" style="width:${windMeterWidth(d.wind)}"></span></span>

                    </div>

                </div>

            </article>`;

    }



    function renderForecast(forecast, location) {
        const daysEl = $("app-weather-days");
        const statusEl = $("app-weather-status");
        if (!daysEl) return;

        const assessed = forecast.map((d) => ({ ...d, ...assessDay(d) }));
        const main = assessed[0];
        const caution = assessed.filter((d) => d.tone !== "good").length;
        currentAssessment = main;

        if (statusEl) statusEl.textContent = buildSummary(main, caution, location);
        updateBubblePreview(main, location);

        daysEl.innerHTML = assessed.map(renderDayCard).join("");

        updateAdvice();
    }



    function renderFallback() {
        currentAssessment = { tone: "caution" };
        const daysEl = $("app-weather-days");
        const statusEl = $("app-weather-status");
        const toggleSmall = document.querySelector("#app-weather-toggle .weather-bubble__copy small");
        if (statusEl) statusEl.textContent = appT("weatherFallbackStatus");
        if (toggleSmall) toggleSmall.textContent = appT("weatherUnavailable");
        updateTempPreview(null);

        if (daysEl) {

            daysEl.innerHTML = `<article class="weather-day weather-day--caution">

                <div class="weather-day__head">

                    <span class="weather-day__label">${appT("weatherToday")}</span>

                    <span class="weather-day__icon" aria-hidden="true"><i class="fas fa-cloud"></i></span>

                </div>

                <div class="weather-day__temps"><strong class="weather-day__max">--°</strong></div>

                <span class="weather-day__badge">${appT("weatherUnavailable")}</span>

            </article>`;

        }

        updateAdvice();

    }



    function updateAdvice() {

        const el = $("app-weather-advice");

        if (!el) return;

        if (!currentAssessment || currentAssessment.tone === "good") {

            el.className = "app-weather-advice";

            el.innerHTML = "";

            return;

        }

        const icon = currentAssessment.tone === "bad" ? "fa-triangle-exclamation" : "fa-cloud-sun-rain";

        const msg =

            currentAssessment.tone === "bad" ? appT("weatherAdviceBad") : appT("weatherAdviceCaution");

        el.className = `app-weather-advice show app-weather-advice--${currentAssessment.tone}`;

        el.innerHTML = `<i class="fas ${icon}"></i><span>${msg}</span>`;

    }



    function bindToggle() {

        const widget = $("app-weather-widget");

        const btn = $("app-weather-toggle");

        if (!widget || !btn || btn.dataset.bound) return;

        btn.dataset.bound = "1";



        const setOpen = (open) => {

            widget.classList.toggle("weather-widget--collapsed", !open);

            widget.classList.toggle("weather-widget--expanded", open);

            btn.setAttribute("aria-expanded", String(open));

        };



        btn.addEventListener("click", () => {

            setOpen(widget.classList.contains("weather-widget--collapsed"));

        });

    }



    async function loadWeather() {

        const widget = $("app-weather-widget");

        const cfg = weatherConfig();

        if (!widget || !cfg || cfg.enabled === false) {

            if (widget) widget.hidden = true;

            return;

        }

        widget.hidden = false;



        const lat = Number(cfg.latitude);

        const lon = Number(cfg.longitude);

        const location = cfg.locationName || "Maarssen";

        const statusEl = $("app-weather-status");

        if (statusEl) statusEl.textContent = appT("weatherLoading", { location });

        const toggleSmall = document.querySelector("#app-weather-toggle .weather-bubble__copy small");

        if (toggleSmall) toggleSmall.textContent = appT("weatherLoading", { location });

        updateTempPreview(null);



        const params = new URLSearchParams({

            latitude: String(lat),

            longitude: String(lon),

            daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",

            timezone: "auto",

            forecast_days: "3"

        });



        try {

            const ctrl = new AbortController();

            const t = window.setTimeout(() => ctrl.abort(), 8000);

            const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: ctrl.signal });

            window.clearTimeout(t);

            if (!res.ok) throw new Error("fail");

            const data = await res.json();

            const forecast = normalizeForecast(data);

            if (!forecast.length) throw new Error("empty");

            renderForecast(forecast, location);

        } catch (e) {

            renderFallback();

        }

    }



    function init() {

        bindToggle();

        loadWeather();

    }



    function refresh() {

        const bubbleStrong = document.querySelector("#app-weather-toggle .weather-bubble__copy strong");

        const bubbleSmall = document.querySelector("#app-weather-toggle .weather-bubble__copy small");

        if (bubbleStrong) bubbleStrong.textContent = appT("weatherBubbleTitle");

        if (bubbleSmall) bubbleSmall.textContent = appT("weatherBubbleSub");

        loadWeather();

    }



    window.CAD_AppWeather = { init, refresh };



    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", init);

    } else {

        init();

    }



    window.addEventListener("cad:app-locale-change", refresh);

})();

