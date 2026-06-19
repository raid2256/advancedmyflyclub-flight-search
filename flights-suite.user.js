// ==UserScript==
// @name         MyFlyClub Advanced Flight Search (Ultimate Pro Intelligence Suite)
// @namespace    https://github.com/raid2256
// @version      9.5
// @description  Google Flights style suite with exact-string airport resolution, three-tab category splitting, competition tracking metrics, and allied interline surcharge calculations.
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

    // Full Alliance Matrix for interlining and dynamic surcharge mapping
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
        .gf-add-leg-btn:hover { background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; }
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
        .gf-list-item { font-size: 12px; padding: 6px 4px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
        
        .gf-right-container { flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .gf-matrix-tabs { display: flex; width: 100%; border-bottom: 1px solid #27272a; background: #18181b; flex-shrink: 0; }
        .gf-tab-item { flex: 1; text-align: center; padding: 14px 6px; font-size: 13px; font-weight: 600; color: #a1a1aa; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; user-select: none; }
        .gf-tab-item:hover { color: #f4f4f5; background: #1e1e24; }
        .gf-tab-item.active { color: #60a5fa; border-bottom-color: #3b82f6; background: #141416; }

        .gf-results { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .gf-card { background: #1e1e24; border: 1px solid #27272a; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: background 0.2s; }
        .gf-card:hover { background: #24242b; border-color: #3f3f46; }
        .gf-summary { display: flex; justify-content: space-between; align-items: center; }
        .gf-price { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .gf-stops { font-size: 12px; color: #a1a1aa; background: #27272a; padding: 2px 8px; border-radius: 20px; }
        
        .gf-legs-container { display: flex; flex-direction: column; gap: 6px; }
        .gf-leg { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; background: #141416; border-radius: 6px; border-left: 3px solid #3b82f6; }
        .gf-leg.split-ticket-segment { border-left-color: #a855f7; }
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
        .gf-badge-selftransfer { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .gf-badge-competition { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; border: 1px solid transparent; }
        .gf-comp-high { background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.4); }
        .gf-comp-mid { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border-color: rgba(245, 158, 11, 0.4); }
        .gf-comp-low { background: rgba(34, 197, 94, 0.15); color: #22c55e; border-color: rgba(34, 197, 94, 0.4); }
        
        .gf-layover { font-size: 11px; color: #fb923c; background: rgba(251, 146, 60, 0.1); border: 1px dashed rgba(251, 146, 60, 0.3); text-align: center; padding: 6px; border-radius: 6px; margin: 2px 0; font-weight: 600; }
        .gf-layover.tight-warning { color: #f87171; background: rgba(248, 113, 113, 0.1); border-color: rgba(248, 113, 113, 0.4); }
        .gf-layover.selftransfer-warning { color: #c084fc; background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.3); }
        
        .p-low { color: #4ade80; } .p-mid { color: #facc15; } .p-high { color: #f87171; }
        .q-excellent { color: #4ade80; } .q-good { color: #a3e635; } .q-average { color: #facc15; } .q-poor { color: #fb923c; } .q-terrible { color: #f87171; }

        @media (max-width: 768px) {
            #g-flights-suite { width: 100vw; height: 90vh; top: 5vh; right: 0; left: 0; margin: auto; border-radius: 8px; }
            .gf-workspace { flex-direction: column; overflow-y: auto; }
            .gf-left-advisory { width: 100%; border-right: none; border-bottom: 1px solid #27272a; overflow-y: visible; }
            .gf-results { overflow-y: visible; }
            .gf-row { flex-direction: column; align-items: stretch; }
            .gf-btn { width: 100%; margin-top: 4px; }
        }
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
        if (!name) return null;
        for (const [allianceName, members] of Object.entries(allianceMap)) {
            if (members.includes(name)) return allianceName;
        }
        return null;
    }

    // Bug-Fixed Exact String Match Airport Resolver Engine
    function lookupAirportId(iata) {
        const cleanIata = String(iata).trim().toUpperCase();
        if (!isNaN(cleanIata) && cleanIata.length > 0) return parseInt(cleanIata); 

        if (typeof searchCachedData === 'function') {
            try {
                const matches = searchCachedData('airport', cleanIata);
                // Strict validation to avoid adjacent city index parsing leaks
                const exactMatch = matches.find(m => String(m.airportIata).toUpperCase() === cleanIata || String(m.airportIcao).toUpperCase() === cleanIata);
                if (exactMatch) return exactMatch.airportId;
            } catch (err) {
                console.warn("Cached data index parsing bypassed:", err);
            }
        }

        const globalAirports = typeof window.airports !== 'undefined' ? window.airports : (typeof airports !== 'undefined' ? airports : null);
        if (globalAirports && globalAirports.features) {
            const match = globalAirports.features.find(f => f.properties && String(f.properties.iata).toUpperCase() === cleanIata);
            if (match) return match.properties.id;
        }
        return null;
    }

    const toggleButton = document.createElement('div');
    toggleButton.id = 'gf-toggle-handle';
    toggleButton.innerHTML = `<span>🌐</span> Open Advanced Flight Search`;
    document.body.appendChild(toggleButton);

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
                    <div class="gf-input-group">
                        <span class="gf-label">From</span>
                        <input type="text" class="gf-input gf-loc-from" placeholder="e.g. KHI" value="KHI">
                    </div>
                    <div class="gf-input-group">
                        <span class="gf-label">To</span>
                        <input type="text" class="gf-input gf-loc-to" placeholder="e.g. ISB" value="ISB">
                    </div>
                    <span style="width:20px;"></span>
                </div>
            </div>
            <button id="gf-add-leg-trigger" class="gf-add-leg-btn">+ Add flight leg</button>

            <div class="gf-row">
                <div class="gf-input-group" style="flex: 1.2;">
                    <span class="gf-label">Departure Date</span>
                    <input type="date" id="gf-date-input" class="gf-input" value="${todayStr}">
                </div>
                <div class="gf-input-group">
                    <span class="gf-label">Class</span>
                    <select id="gf-filter-class" class="gf-input">
                        <option value="economy">Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                    </select>
                </div>
                <button id="gf-submit-search" class="gf-btn">Search</button>
            </div>
            
            <div class="gf-row">
                <div class="gf-input-group">
                    <span class="gf-label">Adults</span>
                    <select id="gf-filter-adults" class="gf-input">
                        <option value="1">1 adult</option>
                        <option value="2">2 adults</option>
                        <option value="3">3 adults</option>
                    </select>
                </div>
                <div class="gf-input-group">
                    <span class="gf-label">Children</span>
                    <select id="gf-filter-children" class="gf-input">
                        <option value="0">0 children</option>
                        <option value="1">1 child</option>
                        <option value="2">2 children</option>
                    </select>
                </div>
                <div class="gf-input-group">
                    <span class="gf-label">Carry-On Allowance</span>
                    <select id="gf-bag-carry" class="gf-input">
                        <option value="0">No carry-on bags</option>
                        <option value="1">1 carry-on bag (+$25)</option>
                    </select>
                </div>
                <div class="gf-input-group">
                    <span class="gf-label">Checked Bags</span>
                    <select id="gf-bag-checked" class="gf-input">
                        <option value="0">No checked bags</option>
                        <option value="1">1 checked bag (+$40)</option>
                        <option value="2">2 checked bags (+$80)</option>
                    </select>
                </div>
            </div>

            <div class="gf-row">
                <div class="gf-input-group">
                    <span class="gf-label">Airline Filter</span>
                    <input type="text" id="gf-filter-airline" class="gf-input" placeholder="Filter Airline Name...">
                </div>
                <div class="gf-input-group" style="flex: 0.7;">
                    <span class="gf-label">Stops Max</span>
                    <select id="gf-filter-stops" class="gf-input">
                        <option value="all">Any stops</option>
                        <option value="0">Nonstop Only</option>
                        <option value="1">Max 1 Layover</option>
                        <option value="overnight">Overnight Tracks</option>
                    </select>
                </div>
                <div class="gf-input-group" style="flex: 0.7;">
                    <span class="gf-label">Sort By</span>
                    <select id="gf-matrix-sort" class="gf-input">
                        <option value="price">Cheapest first</option>
                        <option value="rating">Best ratings</option>
                        <option value="stops">Fewest connections</option>
                    </select>
                </div>
                <div class="gf-input-group" style="flex: 0.7;">
                    <span class="gf-label">Max Fare Limit</span>
                    <input type="number" id="gf-filter-price" class="gf-input" placeholder="Max Price ($)">
                </div>
            </div>
        </div>
        
        <div class="gf-workspace">
            <div id="gf-left-panel" class="gf-left-advisory">
                <div class="gf-advisory-section">
                    <div class="gf-advisory-title">Price Trends (Live Spread)</div>
                    <div id="gf-trend-summary-text" style="font-size:11px; color:#a1a1aa; margin-bottom: 4px;">Submit search to plot distributions.</div>
                    <div id="gf-price-chart" class="gf-chart-container"></div>
                </div>
                <div class="gf-advisory-section">
                    <div class="gf-advisory-title">Destination Attractions</div>
                    <div id="gf-attractions-box" class="gf-scrollbox-inner">
                        <span style="font-size:11px; color:#71717a;">Submit search to see attractions.</span>
                    </div>
                </div>
                <div class="gf-advisory-section">
                    <div class="gf-advisory-title">Recommended Area Hotels</div>
                    <div id="gf-hotels-box" class="gf-scrollbox-inner">
                        <span style="font-size:11px; color:#71717a;">Submit search to see premium hotels.</span>
                    </div>
                </div>
            </div>
            
            <div class="gf-right-container">
                <div class="gf-matrix-tabs">
                    <div id="gf-tab-best" class="gf-tab-item active">Best flights</div>
                    <div id="gf-tab-cheapest" class="gf-tab-item">Cheapest flights</div>
                    <div id="gf-tab-other" class="gf-tab-item">Other flights</div>
                </div>
                <div id="gf-results-box" class="gf-results">
                    <div style="color: #71717a; text-align: center; margin-top: 150px; font-size: 14px;">
                        Configure travel parameters above and hit Search.
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(appContainer);

    toggleButton.addEventListener('click', () => {
        appContainer.style.display = 'flex';
        toggleButton.style.display = 'none';
    });

    document.getElementById('gf-close-window').addEventListener('click', () => {
        appContainer.style.display = 'none';
        toggleButton.style.display = 'flex';
    });

    function setTabActive(tabName) {
        activeResultTab = tabName;
        document.querySelectorAll('.gf-tab-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`gf-tab-${tabName}`).classList.add('active');
        processAndRenderFilters();
    }
    document.getElementById('gf-tab-best').addEventListener('click', () => setTabActive('best'));
    document.getElementById('gf-tab-cheapest').addEventListener('click', () => setTabActive('cheapest'));
    document.getElementById('gf-tab-other').addEventListener('click', () => setTabActive('other'));

    const dragHeader = document.getElementById('gf-draggable-header');
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    dragHeader.addEventListener('mousedown', (e) => {
        if (e.target.closest('.gf-close') || window.innerWidth <= 768) return;
        isDragging = true;
        offsetX = e.clientX - appContainer.offsetLeft;
        offsetY = e.clientY - appContainer.offsetTop;
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', stopDrag);
    });

    function dragMove(e) {
        if (!isDragging) return;
        appContainer.style.left = `${e.clientX - offsetX}px`;
        appContainer.style.top = `${e.clientY - offsetY}px`;
        appContainer.style.right = 'auto';
    }

    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', stopDrag);
    }

    document.getElementById('gf-add-leg-trigger').addEventListener('click', () => {
        const builderBox = document.getElementById('gf-legs-builder-box');
        const currentCount = builderBox.children.length;
        const previousToVal = builderBox.lastElementChild.querySelector('.gf-loc-to').value.toUpperCase();

        const newRow = document.createElement('div');
        newRow.className = 'gf-leg-builder-row';
        newRow.setAttribute('data-leg-index', currentCount);
        newRow.innerHTML = `
            <div class="gf-input-group">
                <span class="gf-label">From</span>
                <input type="text" class="gf-input gf-loc-from" placeholder="e.g. LAX" value="${previousToVal}">
            </div>
            <div class="gf-input-group">
                <span class="gf-label">To</span>
                <input type="text" class="gf-input gf-loc-to" placeholder="e.g. JFK">
            </div>
            <button class="gf-remove-leg-btn">✕</button>
        `;
        newRow.querySelector('.gf-remove-leg-btn').addEventListener('click', () => { newRow.remove(); });
        builderBox.appendChild(newRow);
    });

    const dynamicGeoDirectory = {
        "SYD": {
            attractions: ["Sydney Opera House", "Bondi Beach", "Sydney Harbour Bridge", "Darling Harbour"],
            hotels: ["Capella Sydney ($747/nt)", "Four Seasons Hotel Sydney ($390/nt)"]
        },
        "DXB": {
            attractions: ["Burj Khalifa Tower", "The Dubai Mall", "Dubai Miracle Garden"],
            hotels: ["Dubai International Hotel ($240/nt)", "Le Méridien Dubai ($185/nt)"]
        },
        "JFK": {
            attractions: ["Times Square", "Central Park Waterfront", "Empire State Building"],
            hotels: ["The Plaza Hotel ($680/nt)", "TWA Hotel JFK Airport ($245/nt)"]
        },
        "ISB": {
            attractions: ["Faisal Mosque Landmark", "Margalla Hills Drive", "Lok Virsa Cultural Museum"],
            hotels: ["The Islamabad Serena Palace ($280/nt)", "Margalla View Executive Suites ($115/nt)"]
        },
        "HNL": {
            attractions: ["Waikiki Beachfront Strip", "Diamond Head Crater Path", "Pearl Harbor Memorial Site"],
            hotels: ["The Royal Hawaiian Resort ($410/nt)", "Hilton Hawaiian Village ($295/nt)"]
        }
    };

    function updateTravelGuidePanels(destCode, generatedPrices) {
        const attractionsBox = document.getElementById('gf-attractions-box');
        const hotelsBox = document.getElementById('gf-hotels-box');
        const chartBox = document.getElementById('gf-price-chart');
        const summaryText = document.getElementById('gf-trend-summary-text');

        const guide = dynamicGeoDirectory[destCode] || {
            attractions: [`${destCode} Downtown Historical Tour`, `${destCode} Regional Landmark Sightseeing`],
            hotels: [`${destCode} Grand Airport Palace Resort ($135/nt)`, `${destCode} Premium Transit Business Inn ($90/nt)`]
        };

        attractionsBox.innerHTML = guide.attractions.map(item => `<div class="gf-list-item"><span>📍 ${item}</span></div>`).join('');
        hotelsBox.innerHTML = guide.hotels.map(item => `<div class="gf-list-item"><span>🏨 ${item}</span></div>`).join('');

        chartBox.innerHTML = '';
        if (!generatedPrices || generatedPrices.length === 0) {
            summaryText.innerText = "No price distribution available.";
            return;
        }

        const minPrice = Math.min(...generatedPrices);
        const maxPrice = Math.max(...generatedPrices);
        summaryText.innerText = `Prices spread from $${minPrice} to $${maxPrice}.`;

        const totalBarsCount = 16;
        const bucketSize = (maxPrice - minPrice) / totalBarsCount || 1;
        const distributionBuckets = Array(totalBarsCount).fill(0);

        generatedPrices.forEach(p => {
            let bucketIdx = Math.floor((p - minPrice) / bucketSize);
            if (bucketIdx >= totalBarsCount) bucketIdx = totalBarsCount - 1;
            distributionBuckets[bucketIdx]++;
        });

        const maxBucketCount = Math.max(...distributionBuckets) || 1;
        const lowestOccupiedBucket = distributionBuckets.findIndex(count => count > 0);

        distributionBuckets.forEach((count, idx) => {
            const bar = document.createElement('div');
            bar.createElement;
            bar.className = 'gf-chart-bar';
            const calculatedPercentage = (count / maxBucketCount) * 100;
            bar.style.height = `${Math.max(calculatedPercentage, 6)}%`;
            bar.title = `${count} itineraries around $${Math.round(minPrice + (idx * bucketSize))}`;

            if (idx === lowestOccupiedBucket) bar.className += ' lowest-deal';
            chartBox.appendChild(bar);
        });
    }

    function processAndRenderFilters() {
        const resultsBox = document.getElementById('gf-results-box');
        const airlineQuery = document.getElementById('gf-filter-airline').value.toLowerCase();
        const maxStops = document.getElementById('gf-filter-stops').value;
        const maxPrice = parseFloat(document.getElementById('gf-filter-price').value) || Infinity;
        
        const cabinClass = document.getElementById('gf-filter-class').value;
        const adultsCount = parseInt(document.getElementById('gf-filter-adults').value) || 1;
        const childrenCount = parseInt(document.getElementById('gf-filter-children').value) || 0;
        const passengerCount = adultsCount + childrenCount;
        
        const carryOnBags = parseInt(document.getElementById('gf-bag-carry').value) || 0;
        const checkedBags = parseInt(document.getElementById('gf-bag-checked').value) || 0;
        const baggageSurchargeTotal = (carryOnBags * 25) + (checkedBags * 40);

        const selectedDate = document.getElementById('gf-date-input').value;
        const sortByValue = document.getElementById('gf-matrix-sort').value;

        if (compiledItineraries.length === 0) {
            resultsBox.innerHTML = `<div style="color: #71717a; text-align: center; margin-top: 50px;">No paths found.</div>`;
            return;
        }

        let classMultiplier = 1.0;
        let classLabelText = 'Economy';
        if (cabinClass === 'business') { classMultiplier = 2.2; classLabelText = 'Business Class'; }
        if (cabinClass === 'first') { classMultiplier = 4.0; classLabelText = 'First Class'; }

        let activePrices = [];
        let evaluatedItineraries = [];

        compiledItineraries.forEach(itinerary => {
            // --- Feature 2: Alliance Interlining Surcharge Processing Engine ---
            let interlineFeesTotal = 0;

            itinerary.legs.forEach(leg => {
                for (let i = 0; i < leg.length; i++) {
                    if (i > 0) {
                        const carrierA = leg[i - 1].airlineName;
                        const carrierB = leg[i].airlineName;

                        if (carrierA !== carrierB) {
                            const allianceA = getAirlineAlliance(carrierA);
                            const allianceB = getAirlineAlliance(carrierB);

                            if (allianceA && allianceB && allianceA === allianceB) {
                                interlineFeesTotal += 15 * passengerCount;
                            } else {
                                interlineFeesTotal += 50 * passengerCount;
                            }
                        }
                    }
                }
            });

            const adjustedCost = Math.round(((itinerary.totalCost * classMultiplier) + baggageSurchargeTotal) * passengerCount + interlineFeesTotal);
            if (adjustedCost > maxPrice) return;
            
            if (maxStops === 'overnight') {
                const hasOvernightSegment = itinerary.legs.some(leg => 
                    leg.some((flight, idx) => idx > 0 && (flight.departure - leg[idx-1].arrival) > 480)
                );
                if (!hasOvernightSegment) return;
            } else if (maxStops !== 'all') {
                const structuralViolation = itinerary.legs.some(leg => (leg.length - 1) > parseInt(maxStops));
                if (structuralViolation) return;
            }

            if (airlineQuery) {
                const matchesAirline = itinerary.legs.some(leg => 
                    leg.some(flight => flight.airlineName.toLowerCase().includes(airlineQuery))
                );
                if (!matchesAirline) return;
            }

            let isSplitTicket = false;
            let currentAirlineGroup = null;
            
            itinerary.legs.forEach(leg => {
                leg.forEach(flight => {
                    if (!currentAirlineGroup) {
                        currentAirlineGroup = flight.airlineName;
                    } else if (currentAirlineGroup !== flight.airlineName) {
                        isSplitTicket = true;
                    }
                });
            });

            activePrices.push(adjustedCost);
            evaluatedItineraries.push({ data: itinerary, calculatedPrice: adjustedCost, isSplitTicket: isSplitTicket, totalInterlineFees: interlineFeesTotal });
        });

        if (evaluatedItineraries.length === 0) {
            resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">No itineraries match your filters.</div>`;
            return;
        }

        const lowestPriceOverall = Math.min(...activePrices);
        const guaranteeBoundary = lowestPriceOverall * 1.10;

        if (sortByValue === 'price') {
            evaluatedItineraries.sort((a, b) => a.calculatedPrice - b.calculatedPrice);
        } else if (sortByValue === 'rating') {
            evaluatedItineraries.sort((a, b) => (b.data.legs[0]?.[0]?.computedQuality || 0) - (a.data.legs[0]?.[0]?.computedQuality || 0));
        } else if (sortByValue === 'stops') {
            evaluatedItineraries.sort((a, b) => {
                const aStops = a.data.legs.reduce((acc, leg) => acc + (leg.length - 1), 0);
                const bStops = b.data.legs.reduce((acc, leg) => acc + (leg.length - 1), 0);
                return aStops - bStops;
            });
        }

        // --- Three-Tab Google Flights Category Division Setup ---
        let tabBest = [], tabCheapest = [], tabOther = [];
        const costCapCheapest = lowestPriceOverall * 1.15; 

        evaluatedItineraries.forEach(item => {
            const totalStops = item.data.legs.reduce((acc, l) => acc + (l.length - 1), 0);
            const scoreAvg = item.data.legs[0]?.[0]?.computedQuality || 50;

            if (item.calculatedPrice <= costCapCheapest && tabCheapest.length < 5) tabCheapest.push(item);
            if (totalStops <= 1 && scoreAvg >= 60 && item.calculatedPrice <= lowestPriceOverall * 1.4 && !item.isSplitTicket && tabBest.length < 3) {
                tabBest.push(item);
            } else {
                tabOther.push(item);
            }
        });

        if (tabBest.length === 0) tabBest = evaluatedItineraries.slice(0, 3);
        if (tabCheapest.length === 0) tabCheapest = evaluatedItineraries.slice(0, 4);

        let activeTargetGroup = tabBest;
        if (activeResultTab === 'cheapest') activeTargetGroup = tabCheapest;
        if (activeResultTab === 'other') activeTargetGroup = tabOther;

        if (activeTargetGroup.length === 0) {
            resultsBox.innerHTML = `<div style="color: #71717a; text-align: center; margin-top: 60px;">No additional itineraries found in this section category.</div>`;
            return;
        }

        resultsBox.innerHTML = '';
        activeTargetGroup.forEach(wrapper => {
            const itinerary = wrapper.data;
            const finalCalculatedCost = wrapper.calculatedPrice;

            const card = document.createElement('div');
            card.className = 'gf-card';
            
            card.addEventListener('click', (e) => {
                if (e.target.closest('.gf-details')) return;
                const detailsDrawer = card.querySelector('.gf-details');
                if (detailsDrawer) detailsDrawer.classList.toggle('active');
            });

            let legsHtml = '';
            let totalStopsCount = 0;
            let combinedAmenitiesHtml = '';
            let emissionsTotal = 0;

            let priceColorClass = 'p-mid';
            if (finalCalculatedCost < 1200 * passengerCount) priceColorClass = 'p-low';
            if (finalCalculatedCost > 3000 * passengerCount) priceColorClass = 'p-high';

            let badgesHtml = '';
            if (finalCalculatedCost <= guaranteeBoundary) badgesHtml += `<span class="gf-badge-guarantee">🛡️ Price Guarantee</span>`;
            if (wrapper.isSplitTicket) badgesHtml += `<span class="gf-badge-selftransfer">⚠️ Multi-Ticket Split</span>`;

            // --- Feature 1: Flight Capacity and Scheduling Saturation Analyzer ---
            let uniqueCarrierSet = new Set();
            let flightSegmentCount = 0;

            itinerary.legs.forEach(leg => {
                leg.forEach(flight => {
                    if (flight.airlineName) {
                        uniqueCarrierSet.add(flight.airlineName);
                        flightSegmentCount++;
                    }
                });
            });

            // Map competition levels cleanly based on route scheduling frequencies
            let competitionBadgeHtml = '';
            if (flightSegmentCount > 0) {
                if (uniqueCarrierSet.size >= 4 || flightSegmentCount > 3) {
                    competitionBadgeHtml = `<span class="gf-badge-competition gf-comp-high">🔴 High Competition</span>`;
                } else if (uniqueCarrierSet.size >= 2) {
                    competitionBadgeHtml = `<span class="gf-badge-competition gf-comp-mid">🟡 Medium Competition</span>`;
                } else {
                    competitionBadgeHtml = `<span class="gf-badge-competition gf-comp-low">🟢 Low Competition</span>`;
                }
            } else {
                competitionBadgeHtml = `<span class="gf-badge-competition gf-comp-low">🟢 Low Competition</span>`;
            }
            badgesHtml += competitionBadgeHtml;

            itinerary.legs.forEach((legFlights, index) => {
                totalStopsCount += (legFlights.length - 1);
                legsHtml += `<div style="font-size: 11px; text-transform: uppercase; color: #3b82f6; font-weight: bold; margin-top: 6px;">Leg ${index + 1}</div>`;
                
                legFlights.forEach((flight, fIndex) => {
                    let segmentIsSplit = fIndex > 0 && legFlights[fIndex - 1].airlineName !== flight.airlineName;
                    
                    if (fIndex > 0) {
                        const prevFlight = legFlights[fIndex - 1];
                        const layoverTime = flight.departure - prevFlight.arrival;
                        const isOvernight = layoverTime > 480 ? ' 🌙 (Overnight Layover)' : '';
                        
                        let layoverWarningStyle = "";
                        let layoverWarningText = "";

                        if (segmentIsSplit) {
                            layoverWarningStyle = " selftransfer-warning";
                            layoverWarningText = ` ⚠️ Self-transfer required at ${flight.fromAirportIata}. Collect luggage & re-check.`;
                        } else if (layoverTime < 50) {
                            layoverWarningStyle = " tight-warning";
                            layoverWarningText = " ⚠️ Tight connection warning (less than 50m)";
                        }
                        legsHtml += `<div class="gf-layover${layoverWarningStyle}">⏱️ Layover: ${formatDuration(layoverTime)}${isOvernight}${layoverWarningText}</div>`;
                    }

                    let badgeHtml = '';
                    if (flight.remarks && flight.remarks.includes('BEST_SELLER')) badgeHtml = `<span class="gf-badge">Best Seller</span>`;
                    if (flight.remarks && flight.remarks.includes('BEST_DEAL')) badgeHtml = `<span class="gf-badge" style="background:#1e3a8a; color:#93c5fd;">Best Deal</span>`;

                    const qScore = flight.computedQuality || 50;
                    const qTier = getQualityTier(qScore);
                    const rawFeatures = flight.features || [];
                    const durationMins = flight.duration || 120;

                    let calculatedWifi = "Wi-Fi / Unavailable";
                    let calculatedIfe = "No streaming screens";
                    let calculatedPower = "No outlets available";

                    if (rawFeatures.includes('WIFI') || qScore >= 75) calculatedWifi = "Free High-Speed Wi-Fi Included";
                    if (rawFeatures.includes('IFE') || (qScore >= 70 && durationMins >= 180)) calculatedIfe = "On-demand video monitors";
                    if (rawFeatures.includes('POWER_OUTLET') || qScore >= 70 || cabinClass !== 'economy') calculatedPower = "In-seat AC power outlets";

                    const allianceName = getAirlineAlliance(flight.airlineName) || "Independent Carrier";

                    const amenitiesList = [
                        { label: "Alliance Profile", val: allianceName },
                        { label: "Cabin Class", val: classLabelText },
                        { label: "Legroom", val: cabinClass === 'economy' ? (qScore > 70 ? 'Above-average (81 cm)' : 'Standard (78 cm)') : 'Premium First/Biz Suite' },
                        { label: "Wi-Fi", val: calculatedWifi },
                        { label: "Power Grid", val: calculatedPower },
                        { label: "Entertainment", val: calculatedIfe }
                    ];

                    emissionsTotal += Math.round(durationMins * 4.2 * passengerCount);

                    combinedAmenitiesHtml += `
                        <div class="gf-detail-section">
                            <div style="font-weight:bold; color:#60a5fa; margin-bottom:6px; font-size:12px;">Flight ${flight.flightCode || 'FLIGHT'} Details</div>
                            ${amenitiesList.map(a => `
                                <div class="gf-detail-row">
                                    <span class="gf-detail-label">${a.label}:</span>
                                    <span class="gf-detail-val">${a.val}</span>
                                </div>
                            `).join('')}
                        </div>
                    `;

                    legsHtml += `
                        <div class="gf-leg ${segmentIsSplit ? 'split-ticket-segment' : ''}">
                            <div class="gf-leg-title">
                                <span>✈️ ${flight.flightCode || 'FLIGHT'} (${flight.fromAirportIata} ➔ ${flight.toAirportIata})</span>
                                <span>$${Math.round((flight.price * classMultiplier + (baggageSurchargeTotal / itinerary.legs.reduce((s, l) => s + l.length, 0))) * passengerCount)} ${badgeHtml}</span>
                            </div>
                            <div class="gf-leg-sub">
                                <span>${flight.airlineName} • <i style="color: #a1a1aa;">${flight.airplaneModelName || 'Commercial Jet'}</i></span>
                                <span class="${qTier.class}" style="font-weight: 600;">${qTier.text}</span>
                            </div>
                        </div>
                    `;
                });
            });

            card.innerHTML = `
                <div class="gf-summary">
                    <span class="gf-price ${priceColorClass}">$${finalCalculatedCost} ${badgesHtml}</span>
                    <span style="font-size: 11px; color:#a1a1aa; font-weight:500;">📅 ${selectedDate || todayStr} (${passengerCount} pax)</span>
                    <span class="gf-stops">${totalStopsCount === 0 ? 'Nonstop Total' : totalStopsCount + ' Layovers'}</span>
                </div>
                <div class="gf-legs-container">${legsHtml}</div>
                <div class="gf-details">
                    ${combinedAmenitiesHtml}
                    <div class="gf-detail-section" style="border-top: 1px solid #3f3f46; margin-top: 4px; padding-top: 6px;">
                        <div class="gf-detail-row"><span class="gf-detail-label">Alliance Interline Overheads:</span><span class="gf-detail-val" style="color:#c084fc;">+$${wrapper.totalInterlineFees}</span></div>
                        <div class="gf-detail-row"><span class="gf-detail-label">Emissions estimate:</span><span class="gf-detail-val" style="color:#facc15;">${emissionsTotal} kg CO2e</span></div>
                    </div>
                </div>
            `;
            resultsBox.appendChild(card);
        });

        const builderBox = document.getElementById('gf-legs-builder-box');
        if (builderBox.lastElementChild) {
            const finalDestinationCode = builderBox.lastElementChild.querySelector('.gf-loc-to').value.trim().toUpperCase();
            updateTravelGuidePanels(finalDestinationCode, activePrices);
        }
    }

    function generatePermutations(legsArray) {
        if (legsArray.length === 0) return [];
        if (legsArray.length === 1) {
            return legsArray[0].map(itineraryObj => ({
                legs: [itineraryObj.route.filter(l => l.transportType === 'FLIGHT')],
                totalCost: itineraryObj.route.reduce((acc, f) => acc + (f.price || 0), 0)
            }));
        }
        const subPermutations = generatePermutations(legsArray.slice(1));
        const currentLegOptions = legsArray[0];
        const combined = [];

        currentLegOptions.forEach(currentItinerary => {
            const currentFlights = currentItinerary.route.filter(l => l.transportType === 'FLIGHT');
            const currentCost = currentItinerary.route.reduce((acc, f) => acc + (f.price || 0), 0);
            subPermutations.forEach(subItinerary => {
                combined.push({
                    legs: [currentFlights, ...subItinerary.legs],
                    totalCost: currentCost + subItinerary.totalCost
                });
            });
        });
        return combined;
    }

    async function executeFlightSearch() {
        const resultsBox = document.getElementById('gf-results-box');
        const builderBox = document.getElementById('gf-legs-builder-box');
        
        const rawNodes = [];
        Array.from(builderBox.children).forEach(row => {
            const fromCode = row.querySelector('.gf-loc-from').value.trim().toUpperCase();
            const toCode = row.querySelector('.gf-loc-to').value.trim().toUpperCase();
            if (fromCode && toCode) {
                rawNodes.push({ from: fromCode, to: toCode });
            }
        });

        if (rawNodes.length === 0) {
            resultsBox.innerHTML = `<div style="color: #f59e0b; text-align: center; margin-top: 50px;">Please specify destination pairs.</div>`;
            return;
        }

        resultsBox.innerHTML = `<div style="color: #60a5fa; text-align: center; margin-top: 100px;">Querying live routing networks...</div>`;
        compiledItineraries = [];

        try {
            const fetchPromises = [];
            for (const leg of rawNodes) {
                const resolvedFromId = lookupAirportId(leg.from);
                const resolvedToId = lookupAirportId(leg.to);

                if (!resolvedFromId || !resolvedToId) {
                    throw new Error(`Could not resolve destination markers [From: ${leg.from} -> To: ${leg.to}]`);
                }

                fetchPromises.push(fetch(`/search-route/${resolvedFromId}/${resolvedToId}`).then(res => {
                    if (!res.ok) throw new Error(`Segment mapping failed`);
                    return res.json();
                }));
            }

            const segmentsData = await Promise.all(fetchPromises);
            compiledItineraries = generatePermutations(segmentsData);
            processAndRenderFilters();

        } catch (error) {
            console.error("Search thread failure caught:", error);
            resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">${error.message || 'Error tracking routes. Check airport strings.'}</div>`;
        }
    }

    document.getElementById('gf-submit-search').addEventListener('click', executeFlightSearch);
    document.getElementById('gf-filter-airline').addEventListener('input', processAndRenderFilters);
    document.getElementById('gf-filter-stops').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-filter-price').addEventListener('input', processAndRenderFilters);
    document.getElementById('gf-filter-class').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-filter-adults').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-filter-children').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-bag-carry').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-bag-checked').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-date-input').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-matrix-sort').addEventListener('change', processAndRenderFilters);
})();
