// ==UserScript==
// @name         MyFlyClub Advanced Flight Search (Optimized Modular Build)
// @namespace    https://github.com/raid2256
// @version      6.4
// @match        *://*.myfly.club/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (document.getElementById('g-flights-suite')) document.getElementById('g-flights-suite').remove();
    if (document.getElementById('gf-toggle-handle')) document.getElementById('gf-toggle-handle').remove();

    const todayStr = new Date().toISOString().split('T')[0];
    let compiledItineraries = [];
    let activeResultTab = 'best'; 

    const GLOBAL_ROUTING_HUBS = ["MEL", "SYD", "SIN", "DXB", "JFK", "LAX", "LHR", "HND", "DOH", "IST"];
    const HUB_ID_DIRECTORY = { "MEL": 3600, "SYD": 3601, "SIN": 1205, "DXB": 2404, "JFK": 501, "LAX": 502, "LHR": 801, "HND": 1502, "DOH": 2406, "IST": 1901 };

    const allianceMap = {
        "Animals": ["Fox and Friends", "Cats", "The Panda", "Shiba", "Narwhal", "Dragon", "Goblins"],
        "Come To Brasil": ["Logic Air", "CityJet", "Global Connect", "Global Express", "Gondor Air", "Mordor Air", "Chungking Express"],
        "Continental Connect": ["Agram Air", "SkyHigh", "Agram EU", "Majestic Air", "Purdue Airlines", "Majestic Connect", "Bharat Air"],
        "AntiPoverty Coalition": ["Chanteclair Ailes", "Nantas", "You can't afford this", "Nantaz", "Oiligarch Transport Services", "EuroElites"],
        "Magic Flight": ["Folklore", "Nineteen Eighty-nine", "Fearless", "America Commuter", "Delta", "PhompAng", "EuroFly"],
        "Value Alliance": ["Equora", "Avelo", "Condor", "Aerlia", "Ice Cream Airlines", "Marabu Airlines"],
        "AeroAmerica": ["Royal Malay", "Drakensberg Air", "NorthSky Airlines", "Volaris", "FlyNorth", "Stratus Air", "Grey Wolf Airlines"],
        "Hello World": ["Kia Ora Air", "Aloha Air", "RyanAir Group", "Apollo Air", "Banyan Airways", "Orange Airlines", "West Airlines"],
        "Artisan Alliance": ["Artisan Air", "Lei Lines", "Daybreak Airways", "Sun River Airways", "Aero America", "Air Loom", "Sky Airways"],
        "United Skies": ["Dirt Cheap Airlines", "ALPHA", "Orion Airways", "VANGUARD", "Dobrolyot", "Orbis", "Freedom Express"]
    };

    const style = document.createElement('style');
    style.id = 'g-flights-styles';
    style.innerHTML = `
        #g-flights-suite { position: fixed; top: 15px; right: 15px; width: 940px; height: 840px; background: #121214; color: #e4e4e7; border: 1px solid #27272a; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.7); z-index: 99999999 !important; font-family: system-ui, sans-serif; display: none; flex-direction: column; overflow: hidden; max-width: calc(100vw - 30px); max-height: calc(100vh - 30px); }
        .gf-header { background: #1e1e24; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; flex-shrink: 0; cursor: move; }
        .gf-title { font-weight: 700; color: #60a5fa; font-size: 15px; display: flex; align-items: center; gap: 6px; }
        .gf-close { background: none; border: none; color: #a1a1aa; cursor: pointer; font-size: 16px; font-weight: bold; }
        .gf-controls { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; background: #18181b; border-bottom: 1px solid #27272a; flex-shrink: 0; }
        .gf-row { display: flex; gap: 8px; align-items: flex-end; width: 100%; flex-wrap: wrap; }
        .gf-input-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 100px; }
        .gf-input { width: 100%; padding: 8px 10px; background: #27272a; border: 1px solid #3f3f46; color: #ffffff; border-radius: 8px; font-size: 13px; outline: none; box-sizing: border-box; height: 36px; }
        .gf-legs-builder { display: flex; flex-direction: column; gap: 6px; max-height: 110px; overflow-y: auto; }
        .gf-leg-builder-row { display: flex; gap: 8px; align-items: center; background: #202024; padding: 4px 6px; border-radius: 8px; border: 1px solid #27272a; }
        .gf-add-leg-btn { background: none; border: 1px dashed #3f3f46; color: #60a5fa; padding: 5px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600; text-align: center; width: 100%; }
        .gf-btn { background: #2563eb; color: #ffffff; border: none; padding: 0 16px; border-radius: 8px; font-weight: 600; cursor: pointer; height: 36px; display: inline-flex; align-items: center; justify-content: center; }
        .gf-workspace { display: flex; flex: 1; min-height: 0; overflow: hidden; background: #09090b; }
        .gf-left-advisory { width: 340px; border-right: 1px solid #27272a; background: #141416; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box; flex-shrink: 0; }
        .gf-advisory-section { background: #1e1e24; border: 1px solid #27272a; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; }
        .gf-advisory-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #60a5fa; margin-bottom: 8px; }
        .gf-chart-container { display: flex; align-items: flex-end; gap: 4px; height: 75px; padding-top: 10px; border-bottom: 1px solid #3f3f46; margin-bottom: 6px; }
        .gf-right-container { flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .gf-matrix-tabs { display: flex; width: 100%; border-bottom: 1px solid #27272a; background: #18181b; flex-shrink: 0; }
        .gf-tab-item { flex: 1; text-align: center; padding: 14px 6px; font-size: 13px; font-weight: 600; color: #a1a1aa; cursor: pointer; border-bottom: 2px solid transparent; }
        .gf-tab-item.active { color: #60a5fa; border-bottom-color: #3b82f6; background: #141416; }
        .gf-results { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .gf-card { background: #1e1e24; border: 1px solid #27272a; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; }
        .gf-summary { display: flex; justify-content: space-between; align-items: center; }
        .gf-price { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
    `;
    document.head.appendChild(style);

    function formatDuration(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    function lookupAirportId(iata) {
        const cleanIata = String(iata).trim().toUpperCase();
        if (!isNaN(cleanIata) && cleanIata.length > 0) return parseInt(cleanIata); 
        if (HUB_ID_DIRECTORY[cleanIata]) return HUB_ID_DIRECTORY[cleanIata];
        if (typeof airports !== 'undefined' && airports.features) {
            const match = airports.features.find(f => f.properties && String(f.properties.iata).toUpperCase() === cleanIata);
            if (match) return match.properties.id;
        }
        return null;
    }

    function setTabActive(tabName) {
        activeResultTab = tabName;
        document.querySelectorAll('.gf-tab-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`gf-tab-${tabName}`).classList.add('active');
        processAndRenderFilters(); 
    }

    const appContainer = document.createElement('div');
    appContainer.id = 'g-flights-suite';
    appContainer.innerHTML = `
        <div id="gf-draggable-header" class="gf-header">
            <span class="gf-title">✈️ Advanced Flight Search</span>
            <button id="gf-close-window" class="gf-close">✕</button>
        </div>
        <div class="gf-controls">
            <div id="gf-legs-builder-box" class="gf-legs-builder">
                <div class="gf-leg-builder-row" data-leg-index="0">
                    <div class="gf-input-group"><span class="gf-label">From</span><input type="text" class="gf-input gf-loc-from" value="LST"></div>
                    <div class="gf-input-group"><span class="gf-label">To</span><input type="text" class="gf-input gf-loc-to" value="ISB"></div>
                </div>
            </div>
            <button id="gf-add-leg-trigger" class="gf-add-leg-btn">+ Add flight leg</button>
            <div class="gf-row">
                <div class="gf-input-group" style="flex: 1.2;"><span class="gf-label">Departure Date</span><input type="date" id="gf-date-input" class="gf-input" value="${todayStr}"></div>
                <div class="gf-input-group"><span class="gf-label">Class</span><select id="gf-filter-class" class="gf-input"><option value="economy">Economy</option><option value="business">Business</option><option value="first">First Class</option></select></div>
                <button id="gf-submit-search" class="gf-btn">Search</button>
            </div>
            <div class="gf-row">
                <div class="gf-input-group"><span class="gf-label">Adults</span><select id="gf-filter-adults" class="gf-input"><option value="1">1 adult</option></select></div>
                <div class="gf-input-group"><span class="gf-label">Carry-On</span><select id="gf-bag-carry" class="gf-input"><option value="0">None</option></select></div>
                <div class="gf-input-group"><span class="gf-label">Checked</span><select id="gf-bag-checked" class="gf-input"><option value="0">None</option></select></div>
            </div>
            <div class="gf-row">
                <div class="gf-input-group"><span class="gf-label">Alliance Filter</span><select id="gf-filter-alliance" class="gf-input"><option value="all">All Alliances</option></select></div>
                <div class="gf-input-group"><span class="gf-label">Airline Filter</span><input type="text" id="gf-filter-airline" class="gf-input"></div>
                <div class="gf-input-group"><span class="gf-label">Max Duration (hrs)</span><input type="number" id="gf-filter-duration" class="gf-input"></div>
                <div class="gf-input-group"><span class="gf-label">Stops Max</span><select id="gf-filter-stops" class="gf-input"><option value="all">Any stops</option></select></div>
                <div class="gf-input-group"><span class="gf-label">Sort By</span><select id="gf-matrix-sort" class="gf-input"><option value="price">Cheapest first</option></select></div>
                <div class="gf-input-group"><span class="gf-label">Max Fare Limit</span><input type="number" id="gf-filter-price" class="gf-input"></div>
            </div>
        </div>
        <div class="gf-workspace">
            <div id="gf-left-panel" class="gf-left-advisory">
                <div class="gf-advisory-section"><div class="gf-advisory-title">Price Trends (Live Spread)</div><div id="gf-trend-summary-text">Submit search.</div><div id="gf-price-chart" class="gf-chart-container"></div><div id="gf-price-insights-box"></div></div>
            </div>
            <div class="gf-right-container">
                <div class="gf-matrix-tabs"><div id="gf-tab-best" class="gf-tab-item active">Best flights</div><div id="gf-tab-cheapest" class="gf-tab-item">Cheapest flights</div><div id="gf-tab-other" class="gf-tab-item">Other flights</div></div>
                <div id="gf-results-box" class="gf-results"><div style="color: #71717a; text-align: center; margin-top: 150px;">Configure parameters above and hit Search.</div></div>
            </div>
        </div>
    `;

    function processAndRenderFilters() {
        const resultsBox = document.getElementById('gf-results-box');
        if (compiledItineraries.length === 0) { resultsBox.innerHTML = `<div style="color: #71717a; text-align: center; margin-top: 50px;">No paths found.</div>`; return; }

        let evaluatedItineraries = [];
        compiledItineraries.forEach(itinerary => {
            let totalTransitMinutes = 0;
            let isSplitTicket = false;
            let currentAirline = null;
            itinerary.legs.forEach(leg => {
                leg.forEach((flight) => {
                    totalTransitMinutes += (flight.duration || 120);
                    if (!currentAirline) currentAirline = flight.airlineName;
                    else if (currentAirline !== flight.airlineName) isSplitTicket = true;
                });
            });
            evaluatedItineraries.push({ data: itinerary, calculatedPrice: itinerary.totalCost, isSplitTicket: isSplitTicket, totalDurationMinutes: totalTransitMinutes });
        });

        let tabBest = [], tabCheapest = [], tabOther = [];
        evaluatedItineraries.sort((a,b) => a.calculatedPrice - b.calculatedPrice);
        
        evaluatedItineraries.forEach(item => {
            if (tabCheapest.length < 5) tabCheapest.push(item);
            if (!item.isSplitTicket && tabBest.length < 3) tabBest.push(item);
            else tabOther.push(item);
        });

        if (tabBest.length === 0) tabBest = evaluatedItineraries.slice(0, 3);
        let activeTargetGroup = activeResultTab === 'cheapest' ? tabCheapest : (activeResultTab === 'other' ? tabOther : tabBest);

        resultsBox.innerHTML = '';
        activeTargetGroup.forEach(wrapper => {
            const card = document.createElement('div');
            card.className = 'gf-card';
            card.innerHTML = `<div class="gf-summary"><span class="gf-price">$${wrapper.calculatedPrice}</span><span>⏱️ ${formatDuration(wrapper.totalDurationMinutes)}</span></div>`;
            resultsBox.appendChild(card);
        });

        const chartPrices = evaluatedItineraries.map(i => i.calculatedPrice);
        const chartBox = document.getElementById('gf-price-chart');
        const summaryText = document.getElementById('gf-trend-summary-text');
        chartBox.innerHTML = '';
        if (chartPrices.length > 0) {
            summaryText.innerText = `Spread: $${Math.min(...chartPrices)} - $${Math.max(...chartPrices)}.`;
        }
    }

    function generatePermutations(legsArray) {
        if (legsArray.length === 0) return [];
        if (legsArray.length === 1) return legsArray[0].map(i => ({ legs: [i.route.filter(l => l.transportType === 'FLIGHT')], totalCost: i.route.reduce((a, f) => a + (f.price || 0), 0) }));
        const sub = generatePermutations(legsArray.slice(1)), current = legsArray[0], combined = [];
        current.forEach(c => {
            const cFl = c.route.filter(l => l.transportType === 'FLIGHT'), cCost = c.route.reduce((a, f) => a + (f.price || 0), 0);
            sub.forEach(s => combined.push({ legs: [cFl, ...s.legs], totalCost: cCost + s.totalCost }));
        });
        return combined;
    }

    async function executeFlightSearch() {
        const resultsBox = document.getElementById('gf-results-box');
        resultsBox.innerHTML = `<div style="color: #60a5fa; text-align: center; margin-top: 100px;">Querying simulated networks...</div>`;
        
        let fromId = lookupAirportId(document.querySelector('.gf-loc-from').value);
        let toId = lookupAirportId(document.querySelector('.gf-loc-to').value);
        if (!fromId || !toId) return;

        let responseData = [];
        try {
            const directRes = await fetch(`/search-route/${fromId}/${toId}`);
            if (directRes.ok) responseData = await directRes.json();
        } catch (e) {}

        if (responseData.length === 0) {
            const hubQueries = GLOBAL_ROUTING_HUBS.map(hub => {
                const hId = lookupAirportId(hub);
                return Promise.all([
                    fetch(`/search-route/${fromId}/${hId}`).then(r => r.ok ? r.json() : []),
                    fetch(`/search-route/${hId}/${toId}`).then(r => r.ok ? r.json() : [])
                ]);
            });
            const hubResults = await Promise.all(hubQueries);
            hubResults.forEach(([a, b]) => {
                if (a && b) a.forEach(itA => b.forEach(itB => responseData.push({ route: [...itA.route, ...itB.route] })));
            });
        }

        compiledItineraries = generatePermutations([responseData]);
        processAndRenderFilters();
    }

    function initializeSuiteEventHandlers() {
        const suiteEl = document.getElementById('g-flights-suite'), toggleEl = document.getElementById('gf-toggle-handle');
        if (!suiteEl || !toggleEl) return;

        toggleEl.addEventListener('click', () => { 
            suiteEl.style.setProperty('display', 'flex', 'important'); 
            toggleEl.style.setProperty('display', 'none', 'important'); 
        });
        document.getElementById('gf-close-window').addEventListener('click', () => { 
            suiteEl.style.setProperty('display', 'none', 'important'); 
            toggleEl.style.setProperty('display', 'flex', 'important'); 
        });
        document.getElementById('gf-submit-search').addEventListener('click', executeFlightSearch);
        
        document.getElementById('gf-tab-best').addEventListener('click', () => setTabActive('best'));
        document.getElementById('gf-tab-cheapest').addEventListener('click', () => setTabActive('cheapest'));
        document.getElementById('gf-tab-other').addEventListener('click', () => setTabActive('other'));
    }

    function injectUIElements() {
        if (!document.body) {
            setTimeout(injectUIElements, 50);
            return;
        }

        if (!document.getElementById('gf-toggle-handle')) {
            const toggleButton = document.createElement('div');
            toggleButton.id = 'gf-toggle-handle';
            toggleButton.innerHTML = `<span>🌐</span> Open Advanced Flight Search`;
            toggleButton.style.cssText = "position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 99999998 !important; display: flex !important; background: #2563eb; color: white; padding: 10px 16px; border-radius: 30px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);";
            document.body.appendChild(toggleButton);
        }

        if (!document.getElementById('g-flights-suite')) {
            document.body.appendChild(appContainer);
        }
        
        initializeSuiteEventHandlers();
    }

    injectUIElements();
})();
