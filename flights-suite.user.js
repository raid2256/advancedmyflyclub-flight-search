// ==UserScript==
// @name         MyFlyClub Advanced Flight Search (Ultimate Pro Suite v17.0)
// @namespace    https://github.com/raid2256
// @version      17.0
// @description  Native class-breakdown integration, dynamic PSE metrics, and live route intelligence.
// @match        *://*.myfly.club/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Remove older interface elements
    if (document.getElementById('g-flights-suite')) document.getElementById('g-flights-suite').remove();
    if (document.getElementById('gf-toggle-handle')) document.getElementById('gf-toggle-handle').remove();
    if (document.getElementById('g-flights-styles')) document.getElementById('g-flights-styles').remove();

    const todayStr = new Date().toISOString().split('T')[0];
    let compiledItineraries = [];
    let activeResultTab = 'best'; 
    let activeCurrency = "USD";

    const currencyRates = {
        "USD": { symbol: "$", rate: 1.0 },
        "EUR": { symbol: "€", rate: 0.92 },
        "GBP": { symbol: "£", rate: 0.79 },
        "AUD": { symbol: "A$", rate: 1.52 }
    };

    const fleetConfigMap = {
        "Boeing 777": { layout: "3-4-3 Arrangement", pitch: "31-32\" Pitch", config: "Wide-body Twin Jet", baseSpeed: "100 Mbps Ka-Band", ecoIndex: "B" },
        "Boeing 787": { layout: "3-3-3 Arrangement", pitch: "32\" Pitch", config: "High-Efficiency Wide-body", baseSpeed: "50 Mbps Ku-Band", ecoIndex: "A+" },
        "Airbus A350": { layout: "3-3-3 Arrangement", pitch: "32-33\" Pitch", config: "Composite Wide-body", baseSpeed: "150 Mbps Ka-Band", ecoIndex: "A+" },
        "Airbus A320": { layout: "3-3 Arrangement", pitch: "30\" Short-Haul", config: "Narrow-body Single Aisle", baseSpeed: "15 Mbps ATG", ecoIndex: "B-" },
        "Boeing 737": { layout: "3-3 Arrangement", pitch: "30-31\" Single Aisle", config: "Narrow-body Standard", baseSpeed: "40 Mbps Ku-Band", ecoIndex: "C+" },
        "Airbus A380": { layout: "3-4-3 / 2-4-2", pitch: "32-34\" Pitch", config: "Superjumbo Double Decker", baseSpeed: "80 Mbps Dual-Band", ecoIndex: "C" },
        "Airbus A220": { layout: "2-3 Arrangement", pitch: "32\" High Comfort", config: "Regional Jet", baseSpeed: "70 Mbps Satellite", ecoIndex: "A" }
    };

    // Inject Custom Stylesheet
    const style = document.createElement('style');
    style.id = 'g-flights-styles';
    style.innerHTML = `
        #g-flights-suite {
            position: fixed; top: 15px; right: 15px; width: 960px; height: 860px;
            background: #121214; color: #e4e4e7; border: 1px solid #27272a;
            border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.7);
            z-index: 99999999 !important; font-family: system-ui, -apple-system, sans-serif;
            display: none; flex-direction: column; overflow: hidden;
            max-width: calc(100vw - 30px); max-height: calc(100vh - 30px);
        }
        .gf-header { background: #1e1e24; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; flex-shrink: 0; cursor: move; user-select: none; }
        .gf-title { font-weight: 700; color: #60a5fa; font-size: 15px; display: flex; align-items: center; gap: 6px; }
        .gf-close { background: none; border: none; color: #a1a1aa; cursor: pointer; font-size: 16px; font-weight: bold; }
        .gf-close:hover { color: #f4f4f5; }
        #gf-toggle-handle { position: fixed; bottom: 20px; right: 20px; background: #2563eb; color: white; padding: 10px 16px; border-radius: 30px; font-weight: bold; font-size: 13px; cursor: pointer; z-index: 99999998 !important; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 6px; }
        .gf-controls { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; background: #18181b; border-bottom: 1px solid #27272a; flex-shrink: 0; }
        .gf-row { display: flex; gap: 8px; align-items: flex-end; width: 100%; flex-wrap: wrap; }
        .gf-input-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 100px; position: relative; }
        .gf-input { width: 100%; padding: 8px 10px; background: #27272a; border: 1px solid #3f3f46; color: #ffffff; border-radius: 8px; font-size: 13px; outline: none; box-sizing: border-box; height: 36px; }
        .gf-input:focus { border-color: #3b82f6; }
        .gf-label { font-size: 11px; color: #a1a1aa; font-weight: 600; display: block; }
        .gf-swap-btn { background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; border-radius: 50%; width: 26px; height: 26px; min-width: 26px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; padding: 0; margin-bottom: 5px; }
        .gf-swap-btn:hover { background: #3b82f6; color: #fff; border-color: #3b82f6; }
        .gf-legs-builder { display: flex; flex-direction: column; gap: 6px; max-height: 110px; overflow-y: auto; padding-right: 4px; }
        .gf-leg-builder-row { display: flex; gap: 8px; align-items: center; background: #202024; padding: 4px 6px; border-radius: 8px; border: 1px solid #27272a; }
        .gf-add-leg-btn { background: none; border: 1px dashed #3f3f46; color: #60a5fa; padding: 5px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600; text-align: center; width: 100%; }
        .gf-btn { background: #2563eb; color: #ffffff; border: none; padding: 0 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; height: 36px; display: inline-flex; align-items: center; justify-content: center; }
        .gf-btn:hover { background: #1d4ed8; }
        .gf-workspace { display: flex; flex: 1; min-height: 0; overflow: hidden; background: #09090b; }
        .gf-left-advisory { width: 340px; border-right: 1px solid #27272a; background: #141416; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box; flex-shrink: 0; }
        .gf-advisory-section { background: #1e1e24; border: 1px solid #27272a; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; }
        .gf-advisory-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #60a5fa; margin-bottom: 8px; letter-spacing: 0.5px; }
        .gf-right-container { flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .gf-matrix-tabs { display: flex; width: 100%; border-bottom: 1px solid #27272a; background: #18181b; flex-shrink: 0; }
        .gf-tab-item { flex: 1; text-align: center; padding: 14px 6px; font-size: 13px; font-weight: 600; color: #a1a1aa; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .gf-tab-item.active { color: #60a5fa; border-bottom-color: #3b82f6; background: #141416; }
        .gf-results { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .gf-card { background: #1e1e24; border: 1px solid #27272a; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; }
        .gf-card:hover { background: #24242b; border-color: #3f3f46; }
        .gf-summary { display: flex; justify-content: space-between; align-items: center; }
        .gf-price { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .gf-leg { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; background: #141416; border-radius: 6px; border-left: 3px solid #3b82f6; }
        .gf-leg-title { font-size: 13px; font-weight: 600; color: #f4f4f5; display: flex; justify-content: space-between; align-items: center; }
        .gf-leg-sub { font-size: 11px; color: #71717a; display: flex; justify-content: space-between; align-items: center; }
        .gf-timeline { font-size: 12px; font-weight: bold; color: #fbbf24; }
        .gf-class-box { display: flex; gap: 8px; background: #202026; padding: 6px 10px; border-radius: 6px; font-size: 11px; border: 1px solid #2e2e38; margin-top: 4px; }
        .gf-class-item { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .gf-class-name { font-weight: bold; color: #a1a1aa; text-transform: uppercase; font-size: 10px; }
        .gf-class-val { color: #34d399; font-weight: 600; }
        .gf-class-val.unavailable { color: #71717a; text-decoration: line-through; }
        .gf-component-scores { display: flex; gap: 8px; font-size: 10px; background: rgba(255,255,255,0.02); padding: 4px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); margin-top: 2px; color: #a1a1aa; }
        .gf-score-num { font-weight: bold; color: #3b82f6; }
        .p-low { color: #4ade80; } .p-mid { color: #facc15; } .p-high { color: #f87171; }
        .q-excellent { color: #4ade80; } .q-good { color: #a3e635; } .q-average { color: #facc15; } .q-poor { color: #fb923c; }
    `;
    document.head.appendChild(style);

    // Helpers
    function formatPrice(val) {
        if (!val || isNaN(val)) return '-';
        const profile = currencyRates[activeCurrency];
        return `${profile.symbol}${Math.round(val * profile.rate).toLocaleString()}`;
    }

    function formatTimeValue(rawMinutes) {
        let cleanMinutes = Math.floor(rawMinutes) % 1440;
        let hours = Math.floor(cleanMinutes / 60);
        let mins = cleanMinutes % 60;
        let period = hours >= 12 ? "PM" : "AM";
        let displayHours = hours % 12 === 0 ? 12 : hours % 12;
        let displayMins = mins < 10 ? "0" + mins : mins;
        return `${displayHours}:${displayMins} ${period}`;
    }

    function getQualityTier(score) {
        if (score >= 80) return { text: `Excellent (${(score/10).toFixed(1)}/10)`, class: 'q-excellent' };
        if (score >= 60) return { text: `Good (${(score/10).toFixed(1)}/10)`, class: 'q-good' };
        if (score >= 50) return { text: `Average (${(score/10).toFixed(1)}/10)`, class: 'q-average' };
        return { text: `Poor (${(score/10).toFixed(1)}/10)`, class: 'q-poor' };
    }

    function lookupAirportId(iata) {
        const cleanIata = String(iata).trim().toUpperCase();
        if (!isNaN(cleanIata) && cleanIata.length > 0) return parseInt(cleanIata);
        
        if (typeof searchCachedData === 'function') {
            try {
                const matches = searchCachedData('airport', cleanIata);
                const exactMatch = matches.find(m => String(m.airportIata).toUpperCase() === cleanIata || String(m.airportIcao).toUpperCase() === cleanIata);
                if (exactMatch) return exactMatch.airportId;
            } catch (err) {
                console.warn("Cached airport lookup bypassed:", err);
            }
        }

        const globalAirports = typeof window.airports !== 'undefined' ? window.airports : (typeof airports !== 'undefined' ? airports : null);
        if (globalAirports && globalAirports.features) {
            const match = globalAirports.features.find(f => f.properties && String(f.properties.iata).toUpperCase() === cleanIata);
            if (match) return match.properties.id;
        }
        return null;
    }

    function renderClassBreakdown(priceData, capacityData, selectedClass) {
        const classes = ['economy', 'business', 'first'];
        return classes.map(c => {
            const isSelected = c === selectedClass;
            const priceVal = typeof priceData === 'object' ? priceData[c] : (c === 'economy' ? priceData : null);
            const capVal = typeof capacityData === 'object' ? capacityData[c] : null;

            let borderStyle = isSelected ? 'border: 1px solid #3b82f6; background: rgba(59, 130, 246, 0.1);' : '';
            let valText = priceVal ? `${formatPrice(priceVal)}${capVal ? ` (${capVal} seats)` : ''}` : 'Unavailable';
            let valClass = priceVal ? 'gf-class-val' : 'gf-class-val unavailable';

            return `
                <div class="gf-class-item" style="${borderStyle} padding: 4px; border-radius: 4px;">
                    <span class="gf-class-name">${c} ${isSelected ? '★' : ''}</span>
                    <span class="${valClass}">${valText}</span>
                </div>
            `;
        }).join('');
    }

    // UI Structure
    const toggleButton = document.createElement('div');
    toggleButton.id = 'gf-toggle-handle';
    toggleButton.innerHTML = `<span>🌐</span> Open Advanced Flight Search`;
    document.body.appendChild(toggleButton);

    const appContainer = document.createElement('div');
    appContainer.id = 'g-flights-suite';
    appContainer.innerHTML = `
        <div id="gf-draggable-header" class="gf-header">
            <span class="gf-title">✈️ Advanced Flight Search (v17.0 Suite)</span>
            <div style="display:flex; align-items:center; gap:8px;">
                <button id="gf-close-window" class="gf-close">✕</button>
            </div>
        </div>
        <div class="gf-controls">
            <div id="gf-legs-builder-box" class="gf-legs-builder">
                <div class="gf-leg-builder-row">
                    <div class="gf-input-group"><span class="gf-label">From</span><input type="text" class="gf-input gf-loc-from" value="KHI"></div>
                    <button id="gf-swap-trigger-0" class="gf-swap-btn">⇄</button>
                    <div class="gf-input-group"><span class="gf-label">To</span><input type="text" class="gf-input gf-loc-to" value="ISB"></div>
                </div>
            </div>
            <button id="gf-add-leg-trigger" class="gf-add-leg-btn">+ Add Flight Leg</button>
            <div class="gf-row">
                <div class="gf-input-group"><span class="gf-label">Departure Date</span><input type="date" id="gf-date-input" class="gf-input" value="${todayStr}"></div>
                <div class="gf-input-group">
                    <span class="gf-label">Preferred Cabin Class</span>
                    <select id="gf-filter-class" class="gf-input">
                        <option value="economy">Economy</option>
                        <option value="business">Business Class</option>
                        <option value="first">First Class</option>
                    </select>
                </div>
                <div class="gf-input-group">
                    <span class="gf-label">Currency</span>
                    <select id="gf-currency-select" class="gf-input">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="AUD">AUD (A$)</option>
                    </select>
                </div>
                <button id="gf-submit-search" class="gf-btn">Search Routes</button>
            </div>
            <div class="gf-row">
                <div class="gf-input-group">
                    <span class="gf-label">Sort Order</span>
                    <select id="gf-matrix-sort" class="gf-input">
                        <option value="price">Cheapest First</option>
                        <option value="rating">Highest PSE Quality</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="gf-workspace">
            <div id="gf-left-panel" class="gf-left-advisory">
                <div class="gf-advisory-section">
                    <div class="gf-advisory-title">Class Availability</div>
                    <div id="gf-class-summary-text" style="font-size:11px; color:#a1a1aa;">Real-time breakdown of seat classes per carrier.</div>
                </div>
            </div>
            <div class="gf-right-container">
                <div class="gf-matrix-tabs">
                    <div id="gf-tab-best" class="gf-tab-item active">Best Options</div>
                    <div id="gf-tab-cheapest" class="gf-tab-item">Cheapest</div>
                    <div id="gf-tab-other" class="gf-tab-item">All Flights</div>
                </div>
                <div id="gf-results-box" class="gf-results">
                    <div style="color: #71717a; text-align: center; margin-top: 150px;">Configure parameters and click 'Search Routes'.</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(appContainer);

    // Filter and Render Engine
    function processAndRenderFilters() {
        const resultsBox = document.getElementById('gf-results-box');
        const cabinClass = document.getElementById('gf-filter-class').value;
        const sortBy = document.getElementById('gf-matrix-sort').value;

        if (!compiledItineraries || compiledItineraries.length === 0) {
            resultsBox.innerHTML = `<div style="color: #71717a; text-align: center; margin-top: 50px;">No flight paths found.</div>`;
            return;
        }

        let evaluated = compiledItineraries.map(itinerary => {
            let activePrice = 0;
            let classAvailable = true;

            itinerary.legs.forEach(leg => {
                leg.forEach(flight => {
                    let legPrice = 0;
                    if (typeof flight.price === 'object' && flight.price !== null) {
                        legPrice = flight.price[cabinClass] || flight.price.economy || 0;
                        if (!flight.price[cabinClass]) classAvailable = false;
                    } else {
                        legPrice = flight.price || 0;
                    }
                    activePrice += legPrice;
                });
            });

            return { data: itinerary, calculatedPrice: activePrice, classAvailable };
        });

        if (sortBy === 'price') evaluated.sort((a, b) => a.calculatedPrice - b.calculatedPrice);
        if (sortBy === 'rating') evaluated.sort((a, b) => (b.data.legs[0]?.[0]?.computedQuality || 0) - (a.data.legs[0]?.[0]?.computedQuality || 0));

        resultsBox.innerHTML = '';
        evaluated.forEach(wrapper => {
            const itinerary = wrapper.data;
            const card = document.createElement('div');
            card.className = 'gf-card';

            let legsHtml = '';
            itinerary.legs.forEach((legFlights, lIdx) => {
                legsHtml += `<div style="font-size: 11px; text-transform: uppercase; color: #3b82f6; font-weight: bold;">Leg ${lIdx + 1}</div>`;
                legFlights.forEach((flight) => {
                    const qTier = getQualityTier(flight.computedQuality || 50);
                    const classBreakdownHtml = renderClassBreakdown(flight.price, flight.capacity, cabinClass);

                    legsHtml += `
                        <div class="gf-leg">
                            <div class="gf-timeline">⏰ ${formatTimeValue(flight.departure || 480)} (${flight.fromAirportIata}) ➔ ${formatTimeValue(flight.arrival || 600)} (${flight.toAirportIata})</div>
                            <div class="gf-leg-title">
                                <span>✈️ ${flight.flightCode || 'FLIGHT'} (${flight.airlineName})</span>
                                <span>${formatPrice(wrapper.calculatedPrice)}</span>
                            </div>
                            <div class="gf-leg-sub">
                                <span>${flight.airplaneModelName || 'Commercial Jet'}</span>
                                <span class="${qTier.class}">${qTier.text}</span>
                            </div>
                            <div class="gf-class-box">
                                ${classBreakdownHtml}
                            </div>
                        </div>
                    `;
                });
            });

            card.innerHTML = `
                <div class="gf-summary">
                    <span class="gf-price ${wrapper.classAvailable ? 'p-low' : 'p-mid'}">${formatPrice(wrapper.calculatedPrice)} ${!wrapper.classAvailable ? '<span style="font-size:10px; color:#fb923c;">(Fallback Economy Fare)</span>' : ''}</span>
                    <span style="font-size:11px; color:#a1a1aa;">Class: ${cabinClass.toUpperCase()}</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px;">${legsHtml}</div>
            `;
            resultsBox.appendChild(card);
        });
    }

    // Network Route Query Engine
    async function executeFlightSearch() {
        const resultsBox = document.getElementById('gf-results-box');
        resultsBox.innerHTML = `<div style="color: #60a5fa; text-align: center; margin-top: 100px;">Querying route network...</div>`;

        try {
            const fromCode = document.querySelector('.gf-loc-from').value;
            const toCode = document.querySelector('.gf-loc-to').value;
            const fromId = lookupAirportId(fromCode);
            const toId = lookupAirportId(toCode);

            if (!fromId || !toId) throw new Error(`Could not resolve airport IDs for ${fromCode} -> ${toCode}`);

            const res = await fetch(`/search-route/${fromId}/${toId}`);
            if (!res.ok) throw new Error("Route network fetch failed.");

            const data = await res.json();
            compiledItineraries = data.map(routeObj => ({
                legs: [routeObj.route.filter(l => l.transportType === 'FLIGHT')],
                totalCost: routeObj.route.reduce((acc, f) => acc + (typeof f.price === 'object' ? (f.price.economy || 0) : (f.price || 0)), 0)
            }));

            processAndRenderFilters();
        } catch (err) {
            resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">${err.message}</div>`;
        }
    }

    // Handlers
    toggleButton.addEventListener('click', () => { appContainer.style.display = 'flex'; toggleButton.style.display = 'none'; });
    document.getElementById('gf-close-window').addEventListener('click', () => { appContainer.style.display = 'none'; toggleButton.style.display = 'flex'; });
    document.getElementById('gf-submit-search').addEventListener('click', executeFlightSearch);
    document.getElementById('gf-filter-class').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-currency-select').addEventListener('change', (e) => { activeCurrency = e.target.value; processAndRenderFilters(); });
    document.getElementById('gf-matrix-sort').addEventListener('change', processAndRenderFilters);
})();
