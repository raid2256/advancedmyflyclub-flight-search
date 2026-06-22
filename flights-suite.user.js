// ==UserScript==
// @name         MyFlyClub Advanced Flight Search (Ultimate Pro Intelligence Suite v15.0 - Map Enabled)
// @namespace    https://github.com/raid2256
// @version      15.0
// @description  Ultimate flight aggregator suite integrating interactive HTML5 canvas telemetry maps, Allied interline surcharges, multi-ticket connection safety ratings, currency switcher matrices, and full PSE Quality Indexes.
// @match        *://*.myfly.club/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Clear old instances
    if (document.getElementById('g-flights-suite')) document.getElementById('g-flights-suite').remove();
    if (document.getElementById('gf-toggle-handle')) document.getElementById('gf-toggle-handle').remove();
    if (document.getElementById('g-flights-styles')) document.getElementById('g-flights-styles').remove();

    const todayStr = new Date().toISOString().split('T')[0];
    let compiledItineraries = [];
    let activeResultTab = 'best'; 
    let currentPortalMode = "G-FLIGHTS"; 
    let activeCurrency = "USD";
    let activeMapPathIndex = null;

    // Explicit Carrier Branding Registry Configuration
    const carrierRegistry = {
        "Dirt Cheap Airlines": { category: "LCC", primaryColor: "#b91c1c" },
        "Avelo": { category: "LCC", primaryColor: "#0ea5e9" },
        "RyanAir Group": { category: "LCC", primaryColor: "#2563eb" },
        "SkyHigh": { category: "LEGACY", primaryColor: "#1e40af" },
        "Delta": { category: "LEGACY", primaryColor: "#e11d48" },
        "Majestic Air": { category: "LEGACY", primaryColor: "#4338ca" },
        "Oiligarch Transport Services": { category: "PREMIUM", primaryColor: "#111827" },
        "EuroElites": { category: "PREMIUM", primaryColor: "#1e293b" }
    };

    // Currency Switcher Matrix Configurations
    const currencyRates = {
        "USD": { symbol: "$", rate: 1.0 },
        "EUR": { symbol: "€", rate: 0.92 },
        "GBP": { symbol: "£", rate: 0.79 },
        "AUD": { symbol: "A$", rate: 1.52 }
    };

    // Geographic Mapping Directory (Pixel Projection System Layout Coordinates)
    const airportCoordinates = {
        "KHI": { x: 580, y: 310, lat: 24.906, lon: 67.161 },
        "ISB": { x: 595, y: 280, lat: 33.549, lon: 72.826 },
        "DXB": { x: 540, y: 320, lat: 25.253, lon: 55.364 },
        "JFK": { x: 240, y: 220, lat: 40.641, lon: -73.778 },
        "SYD": { x: 860, y: 560, lat: -33.946, lon: 151.177 },
        "LAX": { x: 140, y: 240, lat: 33.942, lon: -118.408 },
        "LHR": { x: 440, y: 160, lat: 51.470, lon: -0.454 },
        "HNL": { x: 40,  y: 300, lat: 21.318, lon: -157.922 }
    };

    // Fleet Product Service & Equipment (PSE) Configuration Map
    const fleetConfigMap = {
        "Boeing 777": { layout: "3-4-3 Arrangement", pitch: "31-32\" Standard Economy", config: "Wide-body Twin Jet", wifiGen: "Satellite Ka-Band", baseSpeed: "Up to 100 Mbps", screenDef: "11-inch HD Touchscreen", baseDensity: 82 },
        "Boeing 787": { layout: "3-3-3 Arrangement", pitch: "32\" Dreamliner Standard", config: "High-Efficiency Wide-body", wifiGen: "Satellite Ku-Band", baseSpeed: "Up to 50 Mbps", screenDef: "12-inch Smart Screen", baseDensity: 74 },
        "Airbus A350": { layout: "3-3-3 Arrangement", pitch: "32-33\" Extra Wide Ergonomics", config: "Advanced Composite Wide-body", wifiGen: "Next-Gen Ka-Band", baseSpeed: "Up to 150 Mbps", screenDef: "13-inch Ultra-HD Screen", baseDensity: 70 },
        "Airbus A320": { layout: "3-3 Arrangement", pitch: "30\" Short-Haul Standard", config: "Narrow-body Single Aisle", wifiGen: "Air-to-Ground 4G", baseSpeed: "Up to 15 Mbps", screenDef: "Streaming Content to Personal Device", baseDensity: 90 },
        "Boeing 737": { layout: "3-3 Arrangement", pitch: "30-31\" Single Aisle", config: "Narrow-body Standard", wifiGen: "Satellite Ku-Band", baseSpeed: "Up to 40 Mbps", screenDef: "Overhead Shared Monitors", baseDensity: 92 },
        "Airbus A380": { layout: "3-4-3 Lower / 2-4-2 Upper", pitch: "32-34\" Double Decker Spacing", config: "Ultra-Large Quad Jet Superjumbo", wifiGen: "Dual-Band Satellite", baseSpeed: "Up to 80 Mbps", screenDef: "11.5-inch Personal IFE System", baseDensity: 65 }
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
            position: fixed; top: 15px; right: 15px; width: 960px; height: 860px;
            background: #121214; color: #e4e4e7; border: 1px solid #27272a;
            border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.7);
            z-index: 99999999 !important; font-family: system-ui, -apple-system, sans-serif;
            display: none; flex-direction: column; overflow: hidden;
            max-width: calc(100vw - 30px); max-height: calc(100vh - 30px);
        }
        .gf-header { background: #1e1e24; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; flex-shrink: 0; cursor: move; user-select: none; transition: background-color 0.3s ease; }
        .gf-title { font-weight: 700; color: #60a5fa; font-size: 15px; display: flex; align-items: center; gap: 6px; }
        .gf-close { background: none; border: none; color: #a1a1aa; cursor: pointer; font-size: 16px; font-weight: bold; }
        .gf-close:hover { color: #f4f4f5; }
        
        #gf-toggle-handle { position: fixed; bottom: 20px; right: 20px; background: #2563eb; color: white; padding: 10px 16px; border-radius: 30px; font-weight: bold; font-size: 13px; cursor: pointer; z-index: 99999998 !important; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 6px; transition: background 0.2s, transform 0.15s; }
        #gf-toggle-handle:hover { background: #1d4ed8; transform: translateY(-2px); }
        
        .gf-controls { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; background: #18181b; border-bottom: 1px solid #27272a; flex-shrink: 0; }
        .gf-row { display: flex; gap: 8px; align-items: flex-end; width: 100%; flex-wrap: wrap; }
        .gf-input-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 100px; position: relative; }
        .gf-input { width: 100%; padding: 8px 10px; background: #27272a; border: 1px solid #3f3f46; color: #ffffff; border-radius: 8px; font-size: 13px; outline: none; box-sizing: border-box; height: 36px; }
        .gf-input:focus { border-color: #3b82f6; }
        .gf-label { font-size: 11px; color: #a1a1aa; font-weight: 600; display: block; }

        .gf-swap-btn { background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; border-radius: 50%; width: 26px; height: 26px; min-width: 26px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s, color 0.2s; margin-bottom: 5px; font-size: 14px; padding: 0; user-select: none; }
        .gf-swap-btn:hover { background: #3b82f6; color: #fff; border-color: #3b82f6; }
        
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
        .gf-leg-title { font-size: 13px; font-weight: 600; color: #f4f4f5; display: flex; justify-content: space-between; align-items: center; }
        .gf-leg-sub { font-size: 11px; color: #71717a; display: flex; justify-content: space-between; align-items: center; }
        .gf-timeline { font-size: 12px; font-weight: bold; color: #fbbf24; margin-bottom: 2px; }
        
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

        .gf-badge-transfer-safety { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
        .gf-safety-safe { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .gf-safety-risky { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .gf-safety-critical { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        
        .gf-layover { font-size: 11px; color: #fb923c; background: rgba(251, 146, 60, 0.1); border: 1px dashed rgba(251, 146, 60, 0.3); text-align: center; padding: 6px; border-radius: 6px; margin: 2px 0; font-weight: 600; }
        .gf-layover.tight-warning { color: #f87171; background: rgba(248, 113, 113, 0.1); border-color: rgba(248, 113, 113, 0.4); }
        .gf-layover.selftransfer-warning { color: #c084fc; background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.3); }
        
        .p-low { color: #4ade80; } .p-mid { color: #facc15; } .p-high { color: #f87171; }
        .q-excellent { color: #4ade80; } .q-good { color: #a3e635; } .q-average { color: #facc15; } .q-poor { color: #fb923c; } .q-terrible { color: #f87171; }

        .gf-popout-btn, .gf-portal-back-btn, .gf-map-toggle-btn { background: #27272a; border: 1px solid #3f3f46; color: #e4e4e7; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
        .gf-popout-btn:hover, .gf-portal-back-btn:hover, .gf-map-toggle-btn:hover { background: #3f3f46; color: #ffffff; }
        .gf-book-airline-btn { background: #2563eb; color: #ffffff; border: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; margin-top: 6px; align-self: flex-start; }
        .gf-book-airline-btn:hover { background: #1d4ed8; }
        
        .gf-airline-logo-badge { background: #ffffff; color: #111827; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-right: 4px; display: inline-block; border: 1px solid #e5e7eb; }
        .gf-codeshare-tag { color: #a1a1aa; font-size: 11px; font-style: italic; }

        /* Integrated Canvas System Map Overlay Layout CSS Rules */
        #gf-map-overlay {
            width: 100%; height: 220px; background: #0b0b0d; border-bottom: 1px solid #27272a;
            position: relative; display: flex; flex-shrink: 0; overflow: hidden;
        }
        #gf-telemetry-canvas { width: 100%; height: 100%; display: block; background: radial-gradient(circle at 50% 50%, #15151a 0%, #070709 100%); }

        @media (max-width: 768px) {
            #g-flights-suite { width: 100vw; height: 90vh; top: 5vh; right: 0; left: 0; margin: auto; border-radius: 8px; }
            .gf-workspace { flex-direction: column; overflow-y: auto; }
            .gf-left-advisory { width: 100%; border-right: none; border-bottom: 1px solid #27272a; overflow-y: visible; }
            .gf-results { overflow-y: visible; }
            .gf-row { flex-direction: column; align-items: stretch; }
            .gf-btn { width: 100%; margin-top: 4px; }
            #gf-map-overlay { height: 150px; }
        }
    `;
    document.head.appendChild(style);

    function formatPrice(val) {
        const profile = currencyRates[activeCurrency];
        const calculatedValue = Math.round(val * profile.rate);
        return `${profile.symbol}${calculatedValue.toLocaleString()}`;
    }

    function formatDuration(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
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

        if (typeof searchCachedData === 'function') {
            try {
                const matches = searchCachedData('airport', cleanIata);
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

    // Interactive Telemetry Canvas Flight Vector Rendering Engine logic
    function drawTelemetryMap(itineraryWrapper = null) {
        const canvas = document.getElementById('gf-telemetry-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Dynamic Resolution Adjuster Core Loop
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background grid matrix references
        ctx.strokeStyle = 'rgba(63, 63, 70, 0.15)';
        ctx.lineWidth = 1;
        for(let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        }
        for(let j = 0; j < canvas.height; j += 40) {
            ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
        }

        // Draw basic static airport reference points mapping layout registry markers
        Object.entries(airportCoordinates).forEach(([code, node]) => {
            const mappedX = (node.x / 960) * canvas.width;
            const mappedY = (node.y / 600) * canvas.height;

            ctx.fillStyle = '#3f3f46';
            ctx.beginPath();
            ctx.arc(mappedX, mappedY, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#71717a';
            ctx.font = '9px system-ui';
            ctx.fillText(code, mappedX + 6, mappedY + 3);
        });

        if (!itineraryWrapper || !itineraryWrapper.data) return;

        // Trace vectors across global legs matrix
        itineraryWrapper.data.legs.forEach(leg => {
            leg.forEach(flight => {
                const originNode = airportCoordinates[flight.fromAirportIata];
                const destNode = airportCoordinates[flight.toAirportIata];

                if (originNode && destNode) {
                    const x1 = (originNode.x / 960) * canvas.width;
                    const y1 = (originNode.y / 600) * canvas.height;
                    const x2 = (destNode.x / 960) * canvas.width;
                    const y2 = (destNode.y / 600) * canvas.height;

                    // Plot Great-Circle Arc Vector path
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2 - 25; // Create curvature anchor
                    
                    ctx.quadraticCurveTo(midX, midY, x2, y2);
                    
                    ctx.strokeStyle = '#60a5fa';
                    ctx.lineWidth = 2.5;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = '#2563eb';
                    ctx.stroke();
                    
                    // Reset drawing states
                    ctx.shadowBlur = 0;

                    // Source and Target glowing radar targets
                    [ [x1, y1, '#4ade80'], [x2, y2, '#f87171'] ].forEach(([cx, cy, color]) => {
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
            });
        });
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
            <div style="display:flex; align-items:center; gap:8px;">
                <button id="gf-portal-back-trigger" class="gf-portal-back-btn" style="display:none;">🔙 Back to G-Flights</button>
                <button id="gf-map-view-toggle" class="gf-map-toggle-btn">🗺️ Toggle Map View</button>
                <button id="gf-popout-trigger" class="gf-popout-btn">↗️ Popout Space</button>
                <button id="gf-close-window" class="gf-close">✕</button>
            </div>
        </div>
        
        <div id="gf-map-overlay">
            <canvas id="gf-telemetry-canvas"></canvas>
        </div>

        <div class="gf-controls">
            <div id="gf-legs-builder-box" class="gf-legs-builder">
                <div class="gf-leg-builder-row" data-leg-index="0">
                    <div class="gf-input-group">
                        <span class="gf-label">From</span>
                        <input type="text" class="gf-input gf-loc-from" placeholder="e.g. KHI" value="KHI">
                    </div>
                    
                    <button id="gf-swap-trigger-0" class="gf-swap-btn">⇄</button>
                    
                    <div class="gf-input-group">
                        <span class="gf-label">To</span>
                        <input type="text" class="gf-input gf-loc-to" placeholder="e.g. ISB (or * for discovery)" value="ISB">
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
                <div class="gf-input-group">
                    <span class="gf-label">Currency Switcher Matrix</span>
                    <select id="gf-currency-select" class="gf-input">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="AUD">AUD (A$)</option>
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
                    <div class="gf-advisory-title">Market Share Dominance</div>
                    <div id="gf-dominance-box" class="gf-scrollbox-inner">
                        <span style="font-size:11px; color:#71717a;">Submit search to map airline share.</span>
                    </div>
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

    // Active Input Synchronization Layer with Page Inputs
    function syncNativeInputs(fromVal, toVal) {
        if (typeof historySearchState !== 'undefined') {
            historySearchState.from = { type: 'airport', id: lookupAirportId(fromVal), text: fromVal };
            historySearchState.to = { type: 'airport', id: lookupAirportId(toVal), text: toVal };
            
            const nativeFrom = document.querySelector('.searchFieldContainer .fromAirport, .historySearch .fromAirport');
            const nativeTo = document.querySelector('.searchFieldContainer .toAirport, .historySearch .toAirport');
            if (nativeFrom) nativeFrom.value = fromVal;
            if (nativeTo) nativeTo.value = toVal;
        }
    }

    function bindSwapLogic(btnId, fromClass, toClass, contextDoc = document) {
        const targetBtn = contextDoc.getElementById(btnId);
        if (!targetBtn) return;
        targetBtn.addEventListener('click', () => {
            const row = targetBtn.parentElement;
            const fromInput = row.querySelector(fromClass);
            const toInput = row.querySelector(toClass);
            const temp = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = temp;
            syncNativeInputs(fromInput.value, toInput.value);
            if(compiledItineraries.length > 0) processAndRenderFilters();
        });
    }
    bindSwapLogic('gf-swap-trigger-0', '.gf-loc-from', '.gf-loc-to');

    toggleButton.addEventListener('click', () => {
        appContainer.style.display = 'flex';
        toggleButton.style.display = 'none';
        setTimeout(() => drawTelemetryMap(activeMapPathIndex), 50);
    });

    document.getElementById('gf-close-window').addEventListener('click', () => {
        appContainer.style.display = 'none';
        toggleButton.style.display = 'flex';
    });

    document.getElementById('gf-map-view-toggle').addEventListener('click', () => {
        const overlay = document.getElementById('gf-map-overlay');
        overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
        if(overlay.style.display !== 'none') setTimeout(() => drawTelemetryMap(activeMapPathIndex), 20);
    });

    window.addEventListener('resize', () => {
        if(appContainer.style.display === 'flex') drawTelemetryMap(activeMapPathIndex);
    });

    document.getElementById('gf-portal-back-trigger').addEventListener('click', () => {
        currentPortalMode = "G-FLIGHTS";
        const header = document.getElementById('gf-draggable-header');
        const titleSpan = header.querySelector('.gf-title');
        header.style.backgroundColor = '#1e1e24';
        titleSpan.innerHTML = `✈️ Advanced Flight Search`;
        document.getElementById('gf-portal-back-trigger').style.display = 'none';
        
        const filterInput = document.getElementById('gf-filter-airline');
        filterInput.value = '';
        filterInput.disabled = false;
        
        processAndRenderFilters();
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

    document.getElementById('gf-currency-select').addEventListener('change', (e) => {
        activeCurrency = e.target.value;
        processAndRenderFilters();
    });

    // Draggable Window Logic
    const dragHeader = document.getElementById('gf-draggable-header');
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    dragHeader.addEventListener('mousedown', (e) => {
        if (e.target.closest('.gf-close') || e.target.closest('.gf-popout-btn') || e.target.closest('.gf-portal-back-btn') || e.target.closest('.gf-map-toggle-btn') || window.innerWidth <= 768) return;
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

    // Popout System Loop
    document.getElementById('gf-popout-trigger').addEventListener('click', () => {
        const popWindow = window.open('', '_blank', 'width=980,height=880');
        if (!popWindow) {
            alert("Popup blocker active! Please unlock to launch external monitor layout workspace.");
            return;
        }
        
        popWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Advanced Flight Console Workspace</title>
                <style>
                    body { background: #09090b; margin: 0; padding: 10px; font-family: system-ui, sans-serif; }
                    #g-flights-suite { position: relative !important; top: 0 !important; right: 0 !important; left: 0 !important; display: flex !important; width: 100% !important; height: calc(100vh - 20px) !important; max-width: 100% !important; max-height: 100% !important; box-shadow: none !important; }
                    .gf-popout-btn, .gf-close { display: none !important; }
                </style>
            </head>
            <body></body>
            </html>
        `);
        popWindow.document.close();
        
        const originalStyles = document.getElementById('g-flights-styles');
        if (originalStyles) {
            popWindow.document.head.appendChild(originalStyles.cloneNode(true));
        }
        
        appContainer.style.display = 'flex';
        popWindow.document.body.appendChild(appContainer);
        toggleButton.style.display = 'none';

        const popDoc = popWindow.document;
        setTimeout(() => drawTelemetryMap(activeMapPathIndex), 100);

        popDoc.getElementById('gf-submit-search').addEventListener('click', executeFlightSearch);
        popDoc.getElementById('gf-filter-airline').addEventListener('input', processAndRenderFilters);
        popDoc.getElementById('gf-filter-stops').addEventListener('change', processAndRenderFilters);
        popDoc.getElementById('gf-filter-price').addEventListener('input', processAndRenderFilters);
        popDoc.getElementById('gf-filter-class').addEventListener('change', processAndRenderFilters);
        popDoc.getElementById('gf-filter-adults').addEventListener('change', processAndRenderFilters);
        popDoc.getElementById('gf-filter-children').addEventListener('change', processAndRenderFilters);
        popDoc.getElementById('gf-bag-carry').addEventListener('change', processAndRenderFilters);
        popDoc.getElementById('gf-bag-checked').addEventListener('change', processAndRenderFilters);
        popDoc.getElementById('gf-date-input').addEventListener('change', processAndRenderFilters);
        popDoc.getElementById('gf-matrix-sort').addEventListener('change', processAndRenderFilters);
        popDoc.getElementById('gf-map-view-toggle').addEventListener('click', () => {
            const overlay = popDoc.getElementById('gf-map-overlay');
            overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
            if(overlay.style.display !== 'none') drawTelemetryMap(activeMapPathIndex);
        });
        
        popDoc.getElementById('gf-currency-select').addEventListener('change', (e) => {
            activeCurrency = e.target.value;
            processAndRenderFilters();
        });

        popDoc.getElementById('gf-tab-best').addEventListener('click', () => setTabActive('best'));
        popDoc.getElementById('gf-tab-cheapest').addEventListener('click', () => setTabActive('cheapest'));
        popDoc.getElementById('gf-tab-other').addEventListener('click', () => setTabActive('other'));

        popWindow.addEventListener('resize', () => drawTelemetryMap(activeMapPathIndex));
        
        popWindow.addEventListener('beforeunload', () => {
            document.body.appendChild(appContainer);
            appContainer.style.display = 'none';
            toggleButton.style.display = 'flex';
        });
    });

    document.getElementById('gf-add-leg-trigger').addEventListener('click', () => {
        const currentDoc = appContainer.ownerDocument || document;
        const builderBox = currentDoc.getElementById('gf-legs-builder-box');
        const currentCount = builderBox.children.length;
        const previousToVal = builderBox.lastElementChild.querySelector('.gf-loc-to').value.toUpperCase();

        const newRow = currentDoc.createElement('div');
        newRow.className = 'gf-leg-builder-row';
        newRow.setAttribute('data-leg-index', currentCount);
        const uniqueBtnId = `gf-swap-trigger-${currentCount}`;
        newRow.innerHTML = `
            <div class="gf-input-group">
                <span class="gf-label">From</span>
                <input type="text" class="gf-input gf-loc-from" placeholder="e.g. LAX" value="${previousToVal}">
            </div>
            <button id="${uniqueBtnId}" class="gf-swap-btn">⇄</button>
            <div class="gf-input-group">
                <span class="gf-label">To</span>
                <input type="text" class="gf-input gf-loc-to" placeholder="e.g. JFK">
            </div>
            <button class="gf-remove-leg-btn">✕</button>
        `;
        newRow.querySelector('.gf-remove-leg-btn').addEventListener('click', () => { newRow.remove(); });
        builderBox.appendChild(newRow);
        bindSwapLogic(uniqueBtnId, '.gf-loc-from', '.gf-loc-to', currentDoc);
    });

    function computeMarketDominance(qualifiedGroup) {
        const currentDoc = appContainer.ownerDocument || document;
        const dominanceBox = currentDoc.getElementById('gf-dominance-box');
        if (!qualifiedGroup || qualifiedGroup.length === 0) {
            dominanceBox.innerHTML = `<span style="font-size:11px; color:#71717a;">No market data.</span>`;
            return;
        }

        let carrierFlightCounts = {};
        let totalFlightSegments = 0;

        qualifiedGroup.forEach(wrapper => {
            wrapper.data.legs.forEach(leg => {
                leg.forEach(flight => {
                    if (flight.airlineName) {
                        carrierFlightCounts[flight.airlineName] = (carrierFlightCounts[flight.airlineName] || 0) + 1;
                        totalFlightSegments++;
                    }
                });
            });
        });

        let sortedCarriers = Object.entries(carrierFlightCounts).sort((a, b) => b[1] - a[1]);
        dominanceBox.innerHTML = sortedCarriers.map(([carrierName, count]) => {
            const percentage = Math.round((count / totalFlightSegments) * 100);
            let stanceLabel = "Active Network";
            if (percentage >= 50) stanceLabel = "🏆 Dominant Monopoly";
            else if (percentage >= 25) stanceLabel = "🔥 Major Stakeholder";
            return `<div class="gf-list-item"><span style="font-weight: 500;">📊 ${carrierName}</span><span style="color: #60a5fa; font-size:11px;">${percentage}% (${stanceLabel})</span></div>`;
        }).join('');
    }

    function updateTravelGuidePanels(destCode, generatedPrices) {
        const currentDoc = appContainer.ownerDocument || document;
        const attractionsBox = currentDoc.getElementById('gf-attractions-box');
        const hotelsBox = currentDoc.getElementById('gf-hotels-box');
        const chartBox = currentDoc.getElementById('gf-price-chart');
        const summaryText = currentDoc.getElementById('gf-trend-summary-text');

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
        summaryText.innerText = `Prices spread from ${formatPrice(minPrice)} to ${formatPrice(maxPrice)}.`;

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
            const bar = currentDoc.createElement('div');
            bar.className = 'gf-chart-bar';
            const calculatedPercentage = (count / maxBucketCount) * 100;
            bar.style.height = `${Math.max(calculatedPercentage, 6)}%`;
            bar.title = `${count} itineraries around ${formatPrice(minPrice + (idx * bucketSize))}`;

            if (idx === lowestOccupiedBucket) bar.className += ' lowest-deal';
            chartBox.appendChild(bar);
        });
    }

    function processAndRenderFilters() {
        const currentDoc = appContainer.ownerDocument || document;
        const resultsBox = currentDoc.getElementById('gf-results-box');
        
        let airlineQuery = currentDoc.getElementById('gf-filter-airline').value.toLowerCase();
        if (currentPortalMode !== "G-FLIGHTS") {
            airlineQuery = currentPortalMode.toLowerCase();
            currentDoc.getElementById('gf-filter-airline').value = currentPortalMode;
            currentDoc.getElementById('gf-filter-airline').disabled = true;
        }

        const maxStops = currentDoc.getElementById('gf-filter-stops').value;
        const maxPriceInput = parseFloat(currentDoc.getElementById('gf-filter-price').value) || Infinity;
        
        const currentBaseRate = currencyRates[activeCurrency].rate;
        const maxPrice = maxPriceInput / currentBaseRate;
        
        const cabinClass = currentDoc.getElementById('gf-filter-class').value;
        const adultsCount = parseInt(currentDoc.getElementById('gf-filter-adults').value) || 1;
        const childrenCount = parseInt(currentDoc.getElementById('gf-filter-children').value) || 0;
        const passengerCount = adultsCount + childrenCount;
        
        const carryOnBags = parseInt(currentDoc.getElementById('gf-bag-carry').value) || 0;
        const checkedBags = parseInt(currentDoc.getElementById('gf-bag-checked').value) || 0;
        const baggageSurchargeTotal = (carryOnBags * 25) + (checkedBags * 40);

        const selectedDate = currentDoc.getElementById('gf-date-input').value;
        const sortByValue = currentDoc.getElementById('gf-matrix-sort').value;

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
            let interlineFeesTotal = 0;
            let criticalLayoverWindowFloor = Infinity;

            itinerary.legs.forEach(leg => {
                for (let i = 0; i < leg.length; i++) {
                    if (i > 0) {
                        const carrierA = leg[i - 1].airlineName;
                        const carrierB = leg[i].airlineName;
                        const transitGap = leg[i].departure - leg[i - 1].arrival;

                        if (carrierA !== carrierB) {
                            if (transitGap < criticalLayoverWindowFloor) {
                                criticalLayoverWindowFloor = transitGap;
                            }

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
                    leg.some(flight => {
                        const directMatch = flight.airlineName.toLowerCase().includes(airlineQuery);
                        let codeshareMatch = false;
                        if (currentPortalMode !== "G-FLIGHTS") {
                            const mainAlliance = getAirlineAlliance(currentPortalMode);
                            const flightAlliance = getAirlineAlliance(flight.airlineName);
                            if (mainAlliance && flightAlliance && mainAlliance === flightAlliance) {
                                codeshareMatch = true;
                            }
                        }
                        return directMatch || codeshareMatch;
                    })
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
            evaluatedItineraries.push({ 
                data: itinerary, 
                calculatedPrice: adjustedCost, 
                isSplitTicket: isSplitTicket, 
                totalInterlineFees: interlineFeesTotal,
                shortestSplitLayover: criticalLayoverWindowFloor
            });
        });

        if (evaluatedItineraries.length === 0) {
            resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">No itineraries match your filters.</div>`;
            return;
        }

        computeMarketDominance(evaluatedItineraries);

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
        activeTargetGroup.forEach((wrapper, wIdx) => {
            const itinerary = wrapper.data;
            const finalCalculatedCost = wrapper.calculatedPrice;

            const card = currentDoc.createElement('div');
            card.className = 'gf-card';
            
            card.addEventListener('click', (e) => {
                if (e.target.closest('.gf-details') || e.target.closest('.gf-book-airline-btn')) return;
                
                // Enforce Lazy Mapping Draw Operations strictly upon expand
                activeMapPathIndex = wrapper;
                drawTelemetryMap(activeMapPathIndex);

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

            if (wrapper.isSplitTicket && wrapper.shortestSplitLayover !== Infinity) {
                let safetyMarkup = '';
                if (wrapper.shortestSplitLayover > 180) {
                    safetyMarkup = `<span class="gf-badge-transfer-safety gf-safety-safe">🟢 Safe Transfer Window</span>`;
                } else if (wrapper.shortestSplitLayover >= 90) {
                    safetyMarkup = `<span class="gf-badge-transfer-safety gf-safety-risky">🟡 Risky Transfer Window</span>`;
                } else {
                    safetyMarkup = `<span class="gf-badge-transfer-safety gf-safety-critical">🔴 Critical Transfer Window</span>`;
                }
                badgesHtml += safetyMarkup;
            }

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

            const dominantAirline = itinerary.legs[0]?.[0]?.airlineName || "Independent Carrier";
            const firstLetterCode = dominantAirline.charAt(0).toUpperCase();

            itinerary.legs.forEach((legFlights, index) => {
                totalStopsCount += (legFlights.length - 1);
                legsHtml += `<div style="font-size: 11px; text-transform: uppercase; color: #3b82f6; font-weight: bold; margin-top: 6px;">Leg ${index + 1}</div>`;
                
                legFlights.forEach((flight, fIndex) => {
                    let segmentIsSplit = fIndex > 0 && legFlights[fIndex - 1].airlineName !== flight.airlineName;
                    
                    let departureTimeRaw = flight.departure || (480 + (index * 180) + (fIndex * 90));
                    let arrivalTimeRaw = flight.arrival || (departureTimeRaw + (flight.duration || 120));
                    
                    let departureTimeString = formatTimeValue(departureTimeRaw);
                    let arrivalTimeString = formatTimeValue(arrivalTimeRaw);

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

                    const allianceName = getAirlineAlliance(flight.airlineName) || "Independent Carrier";

                    let modelMatchKey = Object.keys(fleetConfigMap).find(key => flight.airplaneModelName && flight.airplaneModelName.includes(key)) || "Airbus A320";
                    let specsProfile = fleetConfigMap[modelMatchKey];

                    let dynamicWifiSpeed = specsProfile.baseSpeed;
                    let wifiStatus = "Wi-Fi Unavailable";
                    if (rawFeatures.includes('WIFI') || qScore >= 50) {
                        wifiStatus = `${specsProfile.wifiGen} Enabled (${dynamicWifiSpeed})`;
                        if (qScore >= 80) wifiStatus += " • ⚡ High Priority Band";
                    }

                    let monitorStatus = specsProfile.screenDef;
                    const targetProfile = carrierRegistry[flight.airlineName] || { category: "LEGACY" };
                    if (targetProfile.category === "PREMIUM" || cabinClass === "first" || cabinClass === "business") {
                        monitorStatus = "15.6-inch Ultra-HD Touchscreen On-Demand Monitor (Complimentary Live TV + Streaming)";
                    } else if (targetProfile.category === "LCC") {
                        monitorStatus = "Bring Your Own Device (No seatback monitor installed. USB streaming enabled)";
                    }

                    let cateringMenu = "Beverage Service Only";
                    if (cabinClass !== 'economy') {
                        cateringMenu = "🍱 Multi-course Premium Dining (À la carte)";
                    } else if (durationMins > 240) {
                        cateringMenu = "🍲 Complimentary Hot Meal Served";
                    } else if (durationMins > 90) {
                        cateringMenu = "🥪 Light Snacks & Sandwiches";
                    }

                    // Integrated PSE Quality Matrix Calculations
                    let classComfortModifier = cabinClass === 'first' ? 30 : (cabinClass === 'business' ? 15 : 0);
                    let carrierComfortModifier = targetProfile.category === 'PREMIUM' ? 15 : (targetProfile.category === 'LCC' ? -15 : 0);
                    let comfortScore = Math.max(10, Math.min(100, Math.round((qScore * 0.6) + 30 + classComfortModifier + carrierComfortModifier)));

                    let densityClassModifier = cabinClass === 'first' ? -35 : (cabinClass === 'business' ? -15 : 5);
                    let rawYieldDensity = specsProfile.baseDensity + densityClassModifier + (targetProfile.category === 'LCC' ? 8 : 0);
                    let spaceYieldIndex = Math.max(20, Math.min(120, Math.round(rawYieldDensity)));

                    const amenitiesList = [
                        { label: "Alliance Profile", val: allianceName },
                        { label: "Cabin Class", val: classLabelText },
                        { label: "Fleet Design Spec", val: `${flight.airplaneModelName || 'Commercial Jet'} (${specsProfile.config})` },
                        { label: "Configuration Pitch", val: `${specsProfile.layout} • ${specsProfile.pitch}` },
                        { label: "On-Demand Monitor Matrix", val: monitorStatus },
                        { label: "Dynamic Telemetry Wi-Fi", val: wifiStatus },
                        { label: "In-Flight Catering Matrix", val: cateringMenu },
                        { label: "Power & Outlets", val: (rawFeatures.includes('POWER_OUTLET') || cabinClass !== 'economy') ? "In-seat AC power outlets" : "No outlets available" },
                        { label: "Passenger Comfort Rating", val: `⭐ ${comfortScore}/100 Index (Hard Product Ergonomics)` },
                        { label: "Floor-Space Yield Index", val: `📈 ${spaceYieldIndex} Efficiency Factor (Asset Density)` }
                    ];

                    emissionsTotal += Math.round(durationMins * 4.2 * passengerCount);

                    let codeshareSubtitle = '';
                    if (currentPortalMode !== "G-FLIGHTS" && flight.airlineName.toLowerCase() !== currentPortalMode.toLowerCase()) {
                        codeshareSubtitle = ` <span class="gf-codeshare-tag">(Codeshare operated by ${flight.airlineName})</span>`;
                    }

                    combinedAmenitiesHtml += `
                        <div class="gf-detail-section">
                            <div style="font-weight:bold; color:#60a5fa; margin-bottom:6px; font-size:12px;">Flight ${flight.flightCode || 'FLIGHT'} Specifications Drawer ${codeshareSubtitle}</div>
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
                            <div class="gf-timeline">⏰ Depart: ${departureTimeString} (${flight.fromAirportIata}) ➔ Arrive: ${arrivalTimeString} (${flight.toAirportIata})</div>
                            <div class="gf-leg-title">
                                <span>✈️ ${flight.flightCode || 'FLIGHT'}</span>
                                <span>${formatPrice((flight.price * classMultiplier + (baggageSurchargeTotal / itinerary.legs.reduce((s, l) => s + l.length, 0))) * passengerCount)} ${badgeHtml}</span>
                            </div>
                            <div class="gf-leg-sub">
                                <span><span class="gf-airline-logo-badge">${flight.airlineName.charAt(0)}</span> ${flight.airlineName} • <i style="color: #a1a1aa;">${flight.airplaneModelName || 'Commercial Jet'}</i></span>
                                <span class="${qTier.class}" style="font-weight: 600;">${qTier.text}</span>
                            </div>
                        </div>
                    `;
                });
            });

            let actionPortalButtonHtml = '';
            if (currentPortalMode === "G-FLIGHTS") {
                if (!wrapper.isSplitTicket) {
                    actionPortalButtonHtml = `<button class="gf-book-airline-btn" data-airline-target="${dominantAirline}">🎫 Book Direct via ${dominantAirline}</button>`;
                }
            } else {
                actionPortalButtonHtml = `<div style="margin-top: 8px; font-size: 12px; font-weight: bold; color: #10b981; border: 1px dashed rgba(16, 185, 129, 0.4); padding: 6px; border-radius: 6px; display: inline-block;">✅ Total Portal Direct Fare: ${formatPrice(finalCalculatedCost)}</div>`;
            }

            card.innerHTML = `
                <div class="gf-summary">
                    <span class="gf-price ${priceColorClass}">${formatPrice(finalCalculatedCost)} ${badgesHtml}</span>
                    <span style="font-size: 11px; color:#a1a1aa; font-weight:500;">📅 ${selectedDate || todayStr} (${passengerCount} pax)</span>
                    <span class="gf-stops">${totalStopsCount === 0 ? 'Nonstop Total' : totalStopsCount + ' Layovers'}</span>
                </div>
                <div class="gf-legs-container">${legsHtml}</div>
                ${actionPortalButtonHtml}
                <div class="gf-details">
                    ${combinedAmenitiesHtml}
                    <div class="gf-detail-section" style="border-top: 1px solid #3f3f46; margin-top: 4px; padding-top: 6px;">
                        <div class="gf-detail-row"><span class="gf-detail-label">Alliance Interline Overheads:</span><span class="gf-detail-val" style="color:#c084fc;">+${formatPrice(wrapper.totalInterlineFees)}</span></div>
                        <div class="gf-detail-row"><span class="gf-detail-label">Emissions estimate:</span><span class="gf-detail-val" style="color:#facc15;">${emissionsTotal} kg CO2e</span></div>
                    </div>
                </div>
            `;
            
            const portalBtn = card.querySelector('.gf-book-airline-btn');
            if (portalBtn) {
                portalBtn.addEventListener('click', () => {
                    const targetAirline = portalBtn.getAttribute('data-airline-target');
                    currentPortalMode = targetAirline;
                    
                    const header = currentDoc.getElementById('gf-draggable-header');
                    const titleSpan = header.querySelector('.gf-title');
                    
                    const carrierData = carrierRegistry[targetAirline] || { category: "LEGACY", primaryColor: "#1e40af" };
                    
                    header.style.backgroundColor = carrierData.primaryColor;
                    titleSpan.innerHTML = `<span class="gf-airline-logo-badge" style="background:#fff; color:#111827; margin-right:6px; padding:2px 6px;">${firstLetterCode}</span> ${targetAirline} Direct Booking Hub [Category: ${carrierData.category}]`;
                    currentDoc.getElementById('gf-portal-back-trigger').style.display = 'inline-flex';
                    
                    processAndRenderFilters();
                });
            }

            resultsBox.appendChild(card);
        });

        const builderBox = currentDoc.getElementById('gf-legs-builder-box');
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
        const currentDoc = appContainer.ownerDocument || document;
        const resultsBox = currentDoc.getElementById('gf-results-box');
        const builderBox = currentDoc.getElementById('gf-legs-builder-box');
        
        // Reset dynamic canvas path states on clear searches
        activeMapPathIndex = null;
        drawTelemetryMap(null);

        const rawNodes = [];
        Array.from(builderBox.children).forEach(row => {
            const fromCode = row.querySelector('.gf-loc-from').value.trim().toUpperCase();
            const toCode = row.querySelector('.gf-loc-to').value.trim().toUpperCase();
            if(fromCode) rawNodes.push({ from: fromCode, to: toCode });
        });

        if (rawNodes.length === 0 || !rawNodes[0].from) {
            resultsBox.innerHTML = `<div style="color: #f59e0b; text-align: center; margin-top: 50px;">Please specify parameters.</div>`;
            return;
        }

        resultsBox.innerHTML = `<div style="color: #60a5fa; text-align: center; margin-top: 100px;">Querying live routing networks...</div>`;
        compiledItineraries = [];

        try {
            const resolvedFromId = lookupAirportId(rawNodes[0].from);
            if (!resolvedFromId) throw new Error(`Could not resolve airport origin: ${rawNodes[0].from}`);

            const targetToField = rawNodes[0].to;
            const isOpenSearch = !targetToField || targetToField === '*';

            // Active Input Synchronization Trigger
            syncNativeInputs(rawNodes[0].from, isOpenSearch ? "DXB" : targetToField);

            if (isOpenSearch) {
                // Open Discovery logic loops mapping destinations un-targeted explicitly
                const targetSampleDestinations = ["ISB", "DXB", "JFK", "SYD", "HNL"].filter(code => code !== rawNodes[0].from);
                const samplingPromises = [];

                for (const destinationCode of targetSampleDestinations) {
                    const destId = lookupAirportId(destinationCode);
                    if (destId) {
                        samplingPromises.push(
                            fetch(`/search-route/${resolvedFromId}/${destId}`)
                                .then(res => res.ok ? res.json() : null)
                                .catch(() => null)
                        );
                    }
                }

                const completedDiscoveryArrays = await Promise.all(samplingPromises);
                const validSectorsData = completedDiscoveryArrays.filter(data => data && data.length > 0);

                if (validSectorsData.length === 0) throw new Error("No network discovery links discovered.");

                let discoveredItineraries = [];
                validSectorsData.forEach(sectorGroup => {
                    discoveredItineraries.push(...generatePermutations([sectorGroup]));
                });
                compiledItineraries = discoveredItineraries;
            } else {
                const fetchPromises = [];
                for (const leg of rawNodes) {
                    const legFromId = lookupAirportId(leg.from);
                    const legToId = lookupAirportId(leg.to);

                    if (!legFromId || !legToId) throw new Error(`Could not resolve: ${leg.from} -> ${leg.to}`);

                    fetchPromises.push(fetch(`/search-route/${legFromId}/${legToId}`).then(res => {
                        if (!res.ok) throw new Error(`Segment mapping failed`);
                        return res.json();
                    }));
                }

                const segmentsData = await Promise.all(fetchPromises);
                compiledItineraries = generatePermutations(segmentsData);
            }

            processAndRenderFilters();

        } catch (error) {
            console.error("Search system processing breakdown:", error);
            resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">${error.message || 'Error tracking routes.'}</div>`;
        }
    }

    // Dynamic Geo Lookup Directory
    const dynamicGeoDirectory = {
        "SYD": { attractions: ["Sydney Opera House", "Bondi Beach", "Sydney Harbour Bridge", "Darling Harbour"], hotels: ["Capella Sydney ($747/nt)", "Four Seasons Hotel Sydney ($390/nt)"] },
        "DXB": { attractions: ["Burj Khalifa Tower", "The Dubai Mall", "Dubai Miracle Garden"], hotels: ["Dubai International Hotel ($240/nt)", "Le Méridien Dubai ($185/nt)"] },
        "JFK": { attractions: ["Times Square", "Central Park Waterfront", "Empire State Building"], hotels: ["The Plaza Hotel ($680/nt)", "TWA Hotel JFK Airport ($245/nt)"] },
        "ISB": { attractions: ["Faisal Mosque Landmark", "Margalla Hills Drive", "Lok Virsa Cultural Museum"], hotels: ["The Islamabad Serena Palace ($280/nt)", "Margalla View Executive Suites ($115/nt)"] },
        "HNL": { attractions: ["Waikiki Beachfront Strip", "Diamond Head Crater Path", "Pearl Harbor Memorial Site"], hotels: ["The Royal Hawaiian Resort ($410/nt)", "Hilton Hawaiian Village ($295/nt)"] }
    };

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
