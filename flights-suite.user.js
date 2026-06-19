// ==UserScript==
// @name         MyFlyClub Advanced Flight Search (Native Schema Integration)
// @namespace    https://github.com/raid2256
// @version      8.0
// @description  Advanced Google Flights style suite matching native client payload parsing, dynamic travel directories, live price insights, and detailed leg breakdowns.
// @match        *://*.myfly.club/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (document.getElementById('g-flights-suite')) document.getElementById('g-flights-suite').remove();
    if (document.getElementById('gf-toggle-handle')) document.getElementById('gf-toggle-handle').remove();

    const todayStr = new Date().toISOString().split('T')[0];
    let compiledItineraries = []; // Holds native entry structures directly from server
    let activeResultTab = 'best'; 

    const HUB_ID_DIRECTORY = { 
        "MEL": 3600, "SYD": 3601, "SIN": 1205, "DXB": 2404, "JFK": 501, 
        "LAX": 502, "LHR": 801, "HND": 1502, "DOH": 2406, "IST": 1901,
        "LST": 1361, "ISB": 614, "SVO": 1235, "DME": 1236
    };

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
        .gf-price { font-size: 18px; font-weight: 700; color: #4ade80; display: flex; align-items: center; gap: 6px; }
        .gf-stops { font-size: 12px; color: #a1a1aa; background: #27272a; padding: 2px 8px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px; }
        
        .gf-legs-container { display: flex; flex-direction: column; gap: 6px; }
        .gf-leg { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; background: #141416; border-radius: 6px; border-left: 3px solid #3b82f6; }
        .gf-leg-title { font-size: 13px; font-weight: 600; color: #f4f4f5; display: flex; justify-content: space-between; }
        .gf-leg-sub { font-size: 11px; color: #71717a; display: flex; justify-content: space-between; align-items: center; }
        
        .gf-details { display: none; background: #141416; padding: 12px; border-radius: 8px; font-size: 12px; color: #d4d4d8; border: 1px solid #27272a; flex-direction: column; gap: 8px; margin-top: 4px; cursor: default; }
        .gf-details.active { display: flex; }
        .gf-detail-section { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid #27272a; padding-bottom: 8px; margin-bottom: 4px; }
        .gf-detail-section:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
        .gf-detail-row { display: flex; justify-content: space-between; padding: 2px 0; }
        .gf-detail-label { color: #a1a1aa; }
        .gf-detail-val { font-weight: 500; color: #f4f4f5; }
        
        .gf-layover { font-size: 11px; color: #fb923c; background: rgba(251, 146, 60, 0.1); border: 1px dashed rgba(251, 146, 60, 0.3); text-align: center; padding: 6px; border-radius: 6px; margin: 2px 0; font-weight: 600; }
        
        .q-excellent { color: #4ade80; } .q-good { color: #a3e635; } .q-average { color: #facc15; } .q-poor { color: #fb923c; } .q-terrible { color: #f87171; }
    `;
    document.head.appendChild(style);

    function getDurationText(minutes) {
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
        if (!name) return null;
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

    function getAirlineTimeSlotText(minutes, startDay) {
        var dayOfWeek = Math.floor(minutes / (24 * 60));
        var minuteOfHour = minutes % 60;
        var hourOfDay = Math.floor(minutes % (24 * 60) / 60);
        var hourText = hourOfDay < 10 ? "0" + hourOfDay : hourOfDay;
        var minuteText = minuteOfHour < 10 ? "0" + minuteOfHour : minuteOfHour;
        if (startDay < dayOfWeek) {
            return hourText + ":" + minuteText + "(+" + (dayOfWeek - startDay) + ")";
        } else {
            return hourText + ":" + minuteText;
        }
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
                    <div id="gf-hotels-box" class="gf-scrollbox
