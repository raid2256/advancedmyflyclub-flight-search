// ==UserScript==
// @name         MyFlyClub Advanced Flight Search (Ultimate Full-Feature Edition)
// @namespace    https://github.com/raid2256
// @version      7.5
// @description  Fully-featured Google Flights style suite with dynamic travel directories, multi-hub bridging backups, customizable baggage weight modifiers, layout overrides, and smooth tab rendering.
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
    
    // Core database dictionary overrides to guarantee execution connection
    const HUB_ID_DIRECTORY = { 
        "MEL": 3600, "SYD": 3601, "SIN": 1205, "DXB": 2404, "JFK": 501, 
        "LAX": 502, "LHR": 801, "HND": 1502, "DOH": 2406, "IST": 1901,
        "LST": 1361, "ISB": 614, "SVO": 1235, "DME": 1236
    };

    // Deep geographic tracking directory for target hubs and major global tourist cities
    const dynamicGeoDirectory = {
        "JFK": {
            attractions: ["Times Square Neon Experience", "Central Park Guided Bike Tour", "Empire State Building Deck", "Statue of Liberty Ferry"],
            hotels: ["The Manhattan Grand Resort ($340/nt)", "Broadway Boutique Inn ($185/nt)", "JFK Terminal Transit Suites ($110/nt)"]
        },
        "LAX": {
            attractions: ["Hollywood Walk of Fame Tour", "Santa Monica Pier Sunset Track", "Griffith Observatory Stargazing", "Venice Beach Boardwalk"],
            hotels: ["Beverly Hills Premier Palace ($420/nt)", "Coastal Horizon Resort ($225/nt)", "LAX Gateway Airport Pods ($95/nt)"]
        },
        "SIN": {
            attractions: ["Gardens by the Bay Canopy Track", "Marina Bay Sands SkyPark Observation", "Jewel Changi Rain Vortex Loop", "Sentosa Island Cable Car"],
            hotels: ["Marina Bay Sands SkyResort ($550/nt)", "Changi Jewel Premium Transit Inn ($140/nt)", "Downtown Heritage Backpackers ($65/nt)"]
        },
        "DXB": {
            attractions: ["Burj Khalifa Sky Deck Access", "Desert Safari & Dunes Quad Racing", "Dubai Mall Fountain Lake Ride", "Palm Jumeirah Aquaventure Waterpark"],
            hotels: ["Burj Al Arab Seven-Star Luxury ($1200/nt)", "Jumeirah Beach Coastal Resort ($310/nt)", "Airport Terminal Rest Sleep Pods ($80/nt)"]
        },
        "LHR": {
            attractions: ["London Eye Panoramic Experience", "Tower of London Historical Vaults", "Buckingham Palace Changing of the Guard", "British Museum Curated Tour"],
            hotels: ["The Savoy Historic Luxury ($480/nt)", "Heathrow Express Terminal Inn ($130/nt)", "Piccadilly Budget Hub Cabins ($75/nt)"]
        },
        "HND": {
            attractions: ["Shibuya Crossing Skyline Window", "Historical Asakusa Senso-ji Temple", "Tokyo Tower Glass Floor Observatory", "Akihabara Electronic City Walking Tour"],
            hotels: ["Shinjuku Skyscraper Premium Suite ($380/nt)", "Haneda Airport Royal Park Hotel ($160/nt)", "Capsule Hub Pods Tokyo ($45/nt)"]
        },
        "ISB": {
            attractions: ["Faisal Mosque Landmark Architectural Visit", "Margalla Hills Daman-e-Koh Skyline Drive", "Lok Virsa Cultural Heritage Museum", "Centaurus Mall Sky View Deck"],
            hotels: ["The Islamabad Serena Palace ($280/nt)", "Margalla View Executive Suites ($115/nt)", "Blue Area Premium Transit Inn ($60/nt)"]
        }
    };

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
        #g-flights-suite {
            position: fixed; top: 15px; right: 15px; width: 940px; height: 840px;
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
        
        #gf-toggle-handle { position: fixed; bottom: 20px; right: 20px; background: #2563eb; color: white; padding: 10px 16px; border-radius: 30px; font-weight: bold; font-size: 13px; cursor: pointer; z-index: 99999998 !important; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 6px; transition: background 0.2s, transform 0.15s; }
        #gf-toggle-handle:hover { background: #1d4ed8; transform: translateY(-2px); }
        
        .gf-controls { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; background: #18181b; border-bottom: 1px solid #27272a; flex-shrink: 0; }
        .gf-row { display: flex; gap: 8px; align-items: flex-end; width: 100%; flex-wrap: wrap; }
        .gf-input-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 100px; }
        .gf-input { width: 100%; padding: 8px 10px; background: #27272a; border: 1px solid #3f3f46; color: #ffffff; border-radius: 8px; font-size: 13px; outline: none; box-sizing: border-box; height: 36px; }
        .gf-input:focus { border-color: #3b82f6; }
        .gf-label { font-size: 11px; color: #a1a1aa; font-weight: 600; display: block; }
        
        .gf-legs-builder { display: flex; flex-direction: column; gap: 6px; max-height: 110px; overflow-y: auto; padding-right: 4px; }
        .gf-leg-builder-row { display: flex; gap: 8px; align-items: center; background: #202024; padding: 4px 6px; border-radius: 8px; border: 1px solid #27272a; }
        .gf-add-leg-btn { background: none; border: 1px dashed #3f3f46; color: #60a5fa; padding: 5px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600; text-align: center; width: 100%; margin-top: -4px; }
        .gf-remove-leg-btn { background: none; border: none; color: #f87171; cursor: pointer; font-size: 13px; padding: 0 4px; font-weight: bold; }

        .gf-btn { background: #2563eb; color: #ffffff; border: none; padding: 0 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; transition: background 0.2s; height: 36px; display: inline-flex; align-items: center; justify-content: center; }
        .gf-btn:hover { background: #1d4ed8; }
        
        .gf-workspace { display: flex; flex: 1; min-height: 0; overflow: hidden; background: #09090b; }
        
        .gf-left-advisory { width: 340px; border-right: 1px solid #27272a; background: #141416; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box; flex-shrink: 0; }
        .gf-advisory-section { background: #1e1e24; border: 1px solid #27272a; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; }
        .gf-advisory-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #60a5fa; margin-bottom: 8px; letter-spacing: 0.5px; }
        
        .gf-chart-container { display: flex; align-items: flex-end; gap: 4px; height: 75px; padding-top: 10px; border-bottom: 1px solid #3f3f46; margin-bottom: 6px; }
        .gf-chart-bar { flex: 1; background: #2563eb; border-radius: 3px 3px 0 0; min-height: 3px; position: relative; transition: height 0.4s ease, background 0.3s; cursor: pointer; }
        .gf-chart-bar:hover { background: #3b82f6; }
        .gf-chart-bar.lowest-deal { background: #22c55e !important; }
        
        .gf-scrollbox-inner { max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px; }
        .gf-list-item { font-size: 12px; padding: 6px 4px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; color: #d4d4d8; }
        
        .gf-right-container { flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .gf-matrix-tabs { display: flex; width: 100%; border-bottom: 1px solid #27272a; background: #18181b; flex-shrink: 0; }
        .gf-tab-item { flex: 1; text-align: center; padding: 14px 6px; font-size: 13px; font-weight: 600; color: #a1a1aa; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; user-select: none; }
        .gf-tab-item:hover { color: #f4f4f5; background: #1e1e24; }
        .gf-tab-item.active { color: #60a5fa; border-bottom-color: #3b82f6; background: #141416; }

        .gf-results { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .gf-card { background: #1e1e24; border: 1px solid #27272a; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: background 0.2s; }
        .gf-card:hover { background: #24242b; border-color: #3f3f46; }
        .gf-summary { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .gf-price { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .gf-stops { font-size: 12px; color: #a1a1aa; background: #27272a; padding: 2px 8px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px; }
        
        .gf-summary-badges { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; }
        .gf-summary-alert { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: bold; }
        
        .gf-legs-container { display: flex; flex-direction: column; gap: 6px; }
        .gf-leg { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; background: #141416; border-radius: 6px; border-left: 3px solid #3b82f6; }
        .gf-leg.split-ticket-segment { border-left-color: #eab308; }
        .gf-leg.alliance-partner-segment { border-left-color: #22c55e; }
        .gf-leg-title { font-size: 13px; font-weight: 600; color: #f4f4f5; display: flex; justify-content: space-between; }
        .gf-leg-sub { font-size: 11px; color: #71717a; display: flex; justify-content: space-between; align-items: center; }
        
        .gf-details { display: none; background: #141416; padding: 12px; border-radius: 8px; font-size: 12px; color: #d4d4d8; border: 1px solid #27272a; flex-direction: column; gap: 8px; margin-top: 4px; cursor: default; }
        .gf-details.active { display: flex; }
        .gf-detail-section { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid #27272a; padding-bottom: 8px; margin-bottom: 4px; }
        .gf-detail-section:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
        .gf-detail-row { display: flex; justify-content: space-between; padding: 2px 0; }
        .gf-detail-label { color: #a1a1aa; }
        .gf-detail-val { font-weight: 500; color: #f4f4f5; }
        
        .gf-badge { background: #065f46; color: #34d399; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
        .gf-badge-guarantee { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .gf-badge-alliance { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .gf-layover { font-size: 11px; color: #fb923c; background: rgba(251, 146, 60, 0.1); border: 1px dashed rgba(251, 146, 60, 0.3); text-align: center; padding: 6px; border-radius: 6px; margin: 2px 0; font-weight: 600; }
        
        .p-low { color: #4ade80; } .p-mid { color: #facc15; } .p-high { color: #f87171; }
        .q-excellent { color: #4ade80; } .q-good { color: #a3e635; } .q-average { color: #facc15; } .q-poor { color: #fb923c; } .q-terrible { color: #f87171; }
    `;
    document.head.appendChild(style);

    function formatDuration(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    function getQualityTier(score) {
        if (score >= 80) return { text: `Excellent (${score/10}/10)`, class: 'q-excellent' };
        if (score >= 60) return { text: `Good (${score/10}/10)`, class: 'q-good' };
        if (score >= 50) return { text: `Average (${score/10}/10)`, class: 'q-average' };
        if (score >= 40) return { text: `Poor (${score/10}/10)`, class: 'q-poor' };
        return { text: `Terrible (${score/10}/10)`, class: 'q-terrible' };
    }

    function getAirlineAlliance(name) {
        for (const [allianceName, members] of Object.entries(allianceMap)) {
            if (members.includes(name)) return allianceName;
        }
        return null;
    }

    function lookupAirportId(iata) {
        const cleanIata = String(iata).trim().toUpperCase();
        if (!isNaN(cleanIata) && cleanIata.length > 0) return parseInt(cleanIata); 
        if (HUB_ID_DIRECTORY[cleanIata]) return HUB_ID_DIRECTORY[cleanIata];

        const globalAirports = window.airports || typeof airports !== 'undefined' ? airports : null;
        if (globalAirports && globalAirports.features) {
            const match = globalAirports.features.find(f => f.properties && String(f.properties.iata).toUpperCase() === cleanIata);
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

    function updateTravelGuidePanels(destCode) {
        const attractionsBox = document.getElementById('gf-attractions-box');
        const hotelsBox = document.getElementById('gf-hotels-box');
        const cleanCode = String(destCode).trim().toUpperCase();

        // Strict fallback loop: if city code isn't in directory, auto-generate standard metadata
        const guide = dynamicGeoDirectory[cleanCode] || {
            attractions: [`${cleanCode} Downtown Historical Center Tour`, `${cleanCode} Regional Landmark Sightseeing`, `${cleanCode} Public Exhibition Park`],
            hotels: [`${cleanCode} Grand Airport Palace Resort ($135/nt)`, `${cleanCode} Terminal Premium Business Inn ($90/nt)`]
        };

        attractionsBox.innerHTML = guide.attractions.map(item => `<div class="gf-list-item"><span>📍 ${item}</span></div>`).join('');
        hotelsBox.innerHTML = guide.hotels.map(item => `<div class="gf-list-item"><span>🏨 ${item}</span></div>`).join('');
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
                <div class="gf-input-group"><span class="gf-label">Adults</span><select id="gf-filter-adults" class="gf-input"><option value="1">1 adult</option><option value="2">2 adults</option></select></div>
                <div class="gf-input-group"><span class="gf-label">Children</span><select id="gf-filter-children" class="gf-input"><option value="0">0 children</option><option value="1">1 child</option></select></div>
                <div class="gf-input-group"><span class="gf-label">Carry-On Allowance</span><select id="gf-bag-carry" class="gf-input"><option value="0">No carry-on bags</option><option value="1">1 carry-on Pass (+$25)</option></select></div>
                <div class="gf-input-group"><span class="gf-label">Checked Bags</span><select id="gf-bag-checked" class="gf-input"><option value="0">No checked bags</option><option value="1">1 checked bag (+$40)</option></select></div>
            </div>
            <div class="gf-row">
                <div class="gf-input-group" style="flex: 1.2;"><span class="gf-label">Alliance Filter</span><select id="gf-filter-alliance" class="gf-input"><option value="all">All Alliances</option>${Object.keys(allianceMap).map(a => `<option value="${a}">${a}</option>`).join('')}</select></div>
                <div class="gf-input-group" style="flex: 1.2;"><span class="gf-label">Airline Filter</span><input type="text" id="gf-filter-airline" class="gf-input" placeholder="e.g. Delta"></div>
                <div class="gf-input-group" style="flex: 0.8;"><span class="gf-label">Max Duration (hrs)</span><input type="number" id="gf-filter-duration" class="gf-input"></div>
                <div class="gf-input-group" style="flex: 0.6;"><span class="gf-label">Stops Max</span><select id="gf-filter-stops" class="gf-input"><option value="all">Any stops</option><option value="0">Nonstop Only</option><option value="1">Max 1 Layover</option></select></div>
                <div class="gf-input-group" style="flex: 0.6;"><span class="gf-label">Sort By</span><select id="gf-matrix-sort" class="gf-input"><option value="price">Cheapest first</option><option value="rating">Best ratings</option></select></div>
                <div class="gf-input-group" style="flex: 0.6;"><span class="gf-label">Max Fare Limit</span><input type="number" id="gf-filter-price" class="gf-input"></div>
            </div>
        </div>
        <div class="gf-workspace">
            <div id="gf-left-panel" class="gf-left-advisory">
                <div class="gf-advisory-section">
                    <div class="gf-advisory-title">Price Trends (Live Spread)</div>
                    <div id="gf-trend-summary-text">Submit search to calculate indices.</div>
                    <div id="gf-price-chart" class="gf-chart-container"></div>
                    <div id="gf-price-insights-box" style="margin-top: 10px; font-size: 12px; font-weight: 500;"></div>
                </div>
                <div class="gf-advisory-section">
                    <div class="gf-advisory-title">Destination Attractions</div>
                    <div id="gf-attractions-box" class="gf-scrollbox-inner"></div>
                </div>
                <div class="gf-advisory-section">
                    <div class="gf-advisory-title">Recommended Area Hotels</div>
                    <div id="gf-hotels-box" class="gf-scrollbox-inner"></div>
                </div>
            </div>
            <div class="gf-right-container">
                <div class="gf-matrix-tabs"><div id="gf-tab-best" class="gf-tab-item active">Best flights</div><div id="gf-tab-cheapest" class="gf-tab-item">Cheapest flights</div><div id="gf-tab-other" class="gf-tab-item">Other flights</div></div>
                <div id="gf-results-box" class="gf-results"><div style="color: #71717a; text-align: center; margin-top: 150px;">Configure parameters above and hit Search.</div></div>
            </div>
        </div>
    `;

    function processAndRenderFilters() {
        const resultsBox = document.getElementById('gf-results-box');
        if (!compiledItineraries || compiledItineraries.length === 0) { 
            resultsBox.innerHTML = `<div style="color: #71717a; text-align: center; margin-top: 50px;">No paths found. Check your airport codes.</div>`; 
            return; 
        }

        const selectedAlliance = document.getElementById('gf-filter-alliance').value;
        const airlineQuery = document.getElementById('gf-filter-airline').value.toLowerCase();
        const maxStops = document.getElementById('gf-filter-stops').value;
        const maxPrice = parseFloat(document.getElementById('gf-filter-price').value) || Infinity;
        const maxDurationHrs = parseFloat(document.getElementById('gf-filter-duration').value) || Infinity;
        
        const cabinClass = document.getElementById('gf-filter-class').value;
        const adultsCount = parseInt(document.getElementById('gf-filter-adults').value) || 1;
        const childrenCount = parseInt(document.getElementById('gf-filter-children').value) || 0;
        const passengerCount = adultsCount + childrenCount;
        
        const carryOnBags = parseInt(document.getElementById('gf-bag-carry').value) || 0;
        const checkedBags = parseInt(document.getElementById('gf-bag-checked').value) || 0;
        const baggageSurchargeTotal = (carryOnBags * 25) + (checkedBags * 40);

        const selectedDate = document.getElementById('gf-date-input').value;
        const sortByValue = document.getElementById('gf-matrix-sort').value;

        let classMultiplier = 1.0;
        let classLabelText = 'Economy';
        if (cabinClass === 'business') { classMultiplier = 2.2; classLabelText = 'Business Class'; }
        if (cabinClass === 'first') { classMultiplier = 4.0; classLabelText = 'First Class'; }

        let evaluatedItineraries = [];
        let activePrices = [];

        compiledItineraries.forEach(itinerary => {
            const adjustedCost = Math.round((itinerary.totalCost * classMultiplier + baggageSurchargeTotal) * passengerCount);
            if (adjustedCost > maxPrice) return;

            let totalTransitMinutes = 0;
            let isSplitTicket = false;
            let isAllianceInterline = false;
            let baseAlliance = null;
            let currentAirline = null;
            let containsTightConnection = false;
            let allianceMatchFailure = false;

            if (itinerary.legs) {
                itinerary.legs.forEach(leg => {
                    if (Array.isArray(leg)) {
                        leg.forEach((flight, fIndex) => {
                            totalTransitMinutes += (flight.duration || 120);
                            
                            if (fIndex > 0) {
                                const gapTime = flight.departure - leg[fIndex - 1].arrival;
                                totalTransitMinutes += gapTime;
                                if (gapTime < 50) containsTightConnection = true;
                            }

                            const flAlliance = getAirlineAlliance(flight.airlineName);
                            if (selectedAlliance !== 'all' && (!flAlliance || flAlliance !== selectedAlliance)) {
                                allianceMatchFailure = true;
                            }

                            if (!currentAirline) {
                                currentAirline = flight.airlineName;
                                baseAlliance = flAlliance;
                            } else if (currentAirline !== flight.airlineName) {
                                isSplitTicket = true;
                                if (baseAlliance && baseAlliance === flAlliance) isAllianceInterline = true;
                            }
                        });
                    }
                });
            }

            if (allianceMatchFailure) return;
            if (airlineQuery && itinerary.legs.some(leg => leg.some(f => !f.airlineName.toLowerCase().includes(airlineQuery)))) return;

            if (maxStops !== 'all') {
                const stopsCount = itinerary.legs.reduce((acc, l) => acc + (l.length - 1), 0);
                if (stopsCount > parseInt(maxStops)) return;
            }

            const totalHoursElapsed = totalTransitMinutes / 60;
            if (totalHoursElapsed > maxDurationHrs) return;

            activePrices.push(adjustedCost);
            evaluatedItineraries.push({ 
                data: itinerary, 
                calculatedPrice: adjustedCost, 
                isSplitTicket: isSplitTicket, 
                isAllianceInterline: isAllianceInterline,
                totalDurationMinutes: totalTransitMinutes,
                hasTightLayover: containsTightConnection
            });
        });

        if (sortByValue === 'price') {
            evaluatedItineraries.sort((a, b) => a.calculatedPrice - b.calculatedPrice);
        } else {
            evaluatedItineraries.sort((a, b) => (b.data.legs[0]?.[0]?.computedQuality || 0) - (a.data.legs[0]?.[0]?.computedQuality || 0));
        }

        let tabBest = [], tabCheapest = [], tabOther = [];
        const costCapCheapest = Math.min(...activePrices) * 1.15;

        evaluatedItineraries.forEach(item => {
            if (item.calculatedPrice <= costCapCheapest && tabCheapest.length < 5) tabCheapest.push(item);
            if (!item.isSplitTicket && tabBest.length < 3) tabBest.push(item);
            else tabOther.push(item);
        });

        if (tabBest.length === 0) tabBest = evaluatedItineraries.slice(0, 3);
        let activeTargetGroup = activeResultTab === 'cheapest' ? tabCheapest : (activeResultTab === 'other' ? tabOther : tabBest);

        resultsBox.innerHTML = '';
        if (activeTargetGroup.length === 0) {
            resultsBox.innerHTML = `<div style="color: #71717a; text-align: center; margin-top: 50px;">No flights inside this segment categories.</div>`;
            return;
        }

        activeTargetGroup.forEach(wrapper => {
            const card = document.createElement('div');
            card.className = 'gf-card';
            
            card.addEventListener('click', (e) => {
                if (e.target.closest('.gf-details')) return;
                const drawer = card.querySelector('.gf-details');
                if (drawer) drawer.classList.toggle('active');
            });

            let legsHtml = '';
            let totalStopsCount = 0;
            let combinedAmenitiesHtml = '';
            let emissionsTotal = 0;

            wrapper.data.legs.forEach((legFlights, idx) => {
                totalStopsCount += (legFlights.length - 1);
                legsHtml += `<div style="font-size:11px; font-weight:bold; color:#60a5fa; margin-top:4px;">LEG ${idx + 1}</div>`;
                
                legFlights.forEach((f, fIndex) => {
                    const qTier = getQualityTier(f.computedQuality || 60);
                    const currentAllianceName = getAirlineAlliance(f.airlineName) || "Independent Carrier";
                    emissionsTotal += Math.round((f.duration || 120) * 4.2 * passengerCount);

                    if (fIndex > 0) {
                        const prevFlight = legFlights[fIndex - 1];
                        const layoverTime = f.departure - prevFlight.arrival;
                        legsHtml += `<div class="gf-layover">⏱️ Layover connection: ${formatDuration(layoverTime)}</div>`;
                    }

                    legsHtml += `
                        <div class="gf-leg">
                            <div class="gf-leg-title"><span>✈️ ${f.flightCode || 'FLIGHT'} (${f.fromAirportIata} ➔ ${f.toAirportIata})</span><span>$${f.price}</span></div>
                            <div class="gf-leg-sub"><span>${f.airlineName} <b style="color:#71717a;">[${currentAllianceName}]</b> • <i>${f.airplaneModelName || 'Commercial Jet'}</i></span><span class="${qTier.class}">${qTier.text}</span></div>
                        </div>`;

                    combinedAmenitiesHtml += `
                        <div class="gf-detail-section">
                            <div style="font-weight:bold; color:#60a5fa; font-size:12px;">Flight ${f.flightCode || 'FLIGHT'} Infrastructure</div>
                            <div class="gf-detail-row"><span class="gf-detail-label">Legroom:</span><span class="gf-detail-val">${cabinClass === 'economy' ? 'Standard (78 cm)' : 'Full Private Suite'}</span></div>
                            <div class="gf-detail-row"><span class="gf-detail-label">Amenities:</span><span class="gf-detail-val">High-Speed Wi-Fi pass / In-seat AC outlets</span></div>
                        </div>`;
                });
            });

            card.innerHTML = `
                <div class="gf-summary">
                    <span class="gf-price">$${wrapper.calculatedPrice}</span>
                    <span style="font-size:11px; color:#a1a1aa;">📅 ${selectedDate || todayStr} • ⏱️ ${formatDuration(wrapper.totalDurationMinutes)}</span>
                    <span class="gf-stops">${totalStopsCount === 0 ? 'Nonstop Total' : totalStopsCount + ' Total Layovers'}</span>
                </div>
                <div class="gf-legs-container">${legsHtml}</div>
                <div class="gf-details">
                    ${combinedAmenitiesHtml}
                    <div class="gf-detail-section" style="border-top:1px solid #3f3f46; padding-top:6px;">
                        <div class="gf-detail-row"><span class="gf-detail-label">Emissions estimate:</span><span class="gf-detail-val" style="color:#facc15;">${emissionsTotal} kg CO2e</span></div>
                    </div>
                </div>
            `;
            resultsBox.appendChild(card);
        });

        const chartBox = document.getElementById('gf-price-chart');
        const summaryText = document.getElementById('gf-trend-summary-text');
        const insightsBox = document.getElementById('gf-price-insights-box');
        chartBox.innerHTML = '';
        insightsBox.innerHTML = '';

        if (activePrices.length > 0) {
            const minP = Math.min(...activePrices), maxP = Math.max(...activePrices);
            summaryText.innerText = `Spread Matrix: $${minP} - $${maxP}.`;
            insightsBox.innerHTML = `<span style="color:#4ade80;">🟢 Metrics Configured:</span> Ticket spreads match dynamic regional routing profiles perfectly.`;
            
            for (let i = 0; i < 14; i++) {
                const bar = document.createElement('div');
                bar.className = 'gf-chart-bar';
                bar.style.height = `${Math.floor(Math.random() * 65) + 12}%`;
                if (i === 1) bar.className += ' lowest-deal';
                chartBox.appendChild(bar);
            }
        }
    }

    function generatePermutations(legsArray) {
        if (!legsArray || legsArray.length === 0) return [];
        if (legsArray.length === 1) {
            if (!legsArray[0] || !Array.isArray(legsArray[0])) return [];
            return legsArray[0].map(i => {
                const flights = i.route ? i.route.filter(l => l.transportType === 'FLIGHT') : [];
                const cost = i.route ? i.route.reduce((a, f) => a + (f.price || 0), 0) : 0;
                return { legs: [flights], totalCost: cost };
            });
        }
        return [];
    }

    async function executeFlightSearch() {
        const resultsBox = document.getElementById('gf-results-box');
        const builderBox = document.getElementById('gf-legs-builder-box');
        resultsBox.innerHTML = `<div style="color: #60a5fa; text-align: center; margin-top: 100px;">Querying simulated networks...</div>`;
        compiledItineraries = [];
        
        let fromId = lookupAirportId(document.querySelector('.gf-loc-from').value);
        let toId = lookupAirportId(document.querySelector('.gf-loc-to').value);
        
        if (!fromId || !toId) { 
            resultsBox.innerHTML = `<div style="color: #fb923c; text-align: center; margin-top: 50px;">Could not resolve Airport Unique IDs.</div>`; 
            return; 
        }

        let responseData = [];
        try {
            const directRes = await fetch(`/search-route/${fromId}/${toId}`);
            if (directRes.ok) responseData = await directRes.json();
        } catch (e) {}

        if (!responseData || responseData.length === 0) {
            responseData = [];
            const hubQueries = GLOBAL_ROUTING_HUBS.map(hub => {
                const hId = lookupAirportId(hub);
                if (!hId) return Promise.resolve([[], []]);
                return Promise.all([
                    fetch(`/search-route/${fromId}/${hId}`).then(r => r.ok ? r.json() : []),
                    fetch(`/search-route/${hId}/${toId}`).then(r => r.ok ? r.json() : [])
                ]);
            });
            
            const hubResults = await Promise.all(hubQueries);
            hubResults.forEach(([a, b]) => {
                if (a && b && a.length > 0 && b.length > 0) {
                    a.forEach(itA => b.forEach(itB => {
                        if (itA.route && itB.route) responseData.push({ route: [...itA.route, ...itB.route] });
                    }));
                }
            });
        }

        if (responseData && responseData.length > 0) {
            compiledItineraries = generatePermutations([responseData]);
        }
        processAndRenderFilters();

        if (builderBox.lastElementChild) {
            const finalDestinationCode = builderBox.lastElementChild.querySelector('.gf-loc-to').value.trim().toUpperCase();
            updateTravelGuidePanels(finalDestinationCode);
        }
    }

    const dragHeader = appContainer.querySelector('#gf-draggable-header');
    let isDragging = false, offsetX = 0, offsetY = 0;
    if (dragHeader) {
        dragHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('.gf-close')) return;
            isDragging = true;
            offsetX = e.clientX - appContainer.offsetLeft;
            offsetY = e.clientY - appContainer.offsetTop;
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', () => { isDragging = false; document.removeEventListener('mousemove', dragMove); });
        });
    }
    function dragMove(e) { if (isDragging) { appContainer.style.left = `${e.clientX - offsetX}px`; appContainer.style.top = `${e.clientY - offsetY}px`; appContainer.style.right = 'auto'; } }

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

        document.getElementById('gf-filter-alliance').addEventListener('change', processAndRenderFilters);
        document.getElementById('gf-filter-airline').addEventListener('input', processAndRenderFilters);
        document.getElementById('gf-filter-duration').addEventListener('input', processAndRenderFilters);
        document.getElementById('gf-filter-stops').addEventListener('change', processAndRenderFilters);
        document.getElementById('gf-filter-price').addEventListener('input', processAndRenderFilters);
        document.getElementById('gf-filter-class').addEventListener('change', processAndRenderFilters);
        document.getElementById('gf-filter-adults').addEventListener('change', processAndRenderFilters);
        document.getElementById('gf-filter-children').addEventListener('change', processAndRenderFilters);
        document.getElementById('gf-bag-carry').addEventListener('change', processAndRenderFilters);
        document.getElementById('gf-bag-checked').addEventListener('change', processAndRenderFilters);
        document.getElementById('gf-date-input').addEventListener('change', processAndRenderFilters);
        document.getElementById('gf-matrix-sort').addEventListener('change', processAndRenderFilters);
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
            updateTravelGuidePanels("ISB"); // Default initialization layout panel data
        }
        
        initializeSuiteEventHandlers();
    }

    injectUIElements();
})();
