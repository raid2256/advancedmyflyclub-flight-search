// ==UserScript==
// @name         MyFlyClub Google Flights Suite (Max Realism Edition)
// @namespace    https://github.com/raid2256
// @version      1.6
// @description  Advanced ultimate flight search suite with interactive expandable cards, deep amenities, carbon metrics, layover diagnostics, and cabin multipliers.
// @match        *://*.myfly.club/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Prevent duplicates
    if (document.getElementById('g-flights-suite')) {
        document.getElementById('g-flights-suite').remove();
    }

    // 1. Inject Styles Matrix
    const style = document.createElement('style');
    style.id = 'g-flights-styles';
    style.innerHTML = `
        #g-flights-suite {
            position: fixed; top: 15px; right: 15px; width: 560px; height: 780px;
            background: #121214; color: #e4e4e7; border: 1px solid #27272a;
            border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.7);
            z-index: 999999; font-family: system-ui, -apple-system, sans-serif;
            display: flex; flex-direction: column; overflow: hidden;
        }
        .gf-header { background: #1e1e24; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; }
        .gf-title { font-weight: 700; color: #60a5fa; font-size: 15px; display: flex; align-items: center; gap: 6px; }
        .gf-close { background: none; border: none; color: #a1a1aa; cursor: pointer; font-size: 16px; font-weight: bold; }
        .gf-close:hover { color: #f4f4f5; }
        .gf-controls { padding: 16px; display: flex; flex-direction: column; gap: 10px; background: #18181b; border-bottom: 1px solid #27272a; }
        .gf-row { display: flex; gap: 8px; align-items: center; }
        .gf-input { flex: 1; padding: 8px 10px; background: #27272a; border: 1px solid #3f3f46; color: #ffffff; border-radius: 8px; font-size: 13px; outline: none; }
        .gf-input:focus { border-color: #3b82f6; }
        .gf-label { font-size: 11px; color: #a1a1aa; font-weight: 600; margin-bottom: -4px; margin-left: 2px; }
        .gf-btn { background: #2563eb; color: #ffffff; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; transition: background 0.2s; height: 36px; }
        .gf-btn:hover { background: #1d4ed8; }
        .gf-results { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #09090b; }
        
        /* Expandable Card Layout UI */
        .gf-card { background: #1e1e24; border: 1px solid #27272a; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: background 0.2s; }
        .gf-card:hover { background: #24242b; border-color: #3f3f46; }
        .gf-summary { display: flex; justify-content: space-between; align-items: center; }
        .gf-price { font-size: 18px; font-weight: 700; color: #4ade80; }
        .gf-stops { font-size: 12px; color: #a1a1aa; background: #27272a; padding: 2px 8px; border-radius: 20px; }
        
        .gf-legs-container { display: flex; flex-direction: column; gap: 6px; }
        .gf-leg { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; background: #141416; border-radius: 6px; border-left: 3px solid #3b82f6; }
        .gf-leg-title { font-size: 13px; font-weight: 600; color: #f4f4f5; display: flex; justify-content: space-between; }
        .gf-leg-sub { font-size: 11px; color: #71717a; display: flex; justify-content: space-between; align-items: center; }
        
        /* Hidden Expandable Details Drawer */
        .gf-details { display: none; background: #141416; padding: 12px; border-radius: 8px; font-size: 12px; color: #d4d4d8; border: 1px solid #27272a; flex-direction: column; gap: 8px; margin-top: 4px; cursor: default; }
        .gf-details.active { display: flex; }
        .gf-detail-section { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid #27272a; padding-bottom: 8px; margin-bottom: 4px; }
        .gf-detail-section:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
        .gf-detail-row { display: flex; justify-content: space-between; padding: 2px 0; }
        .gf-detail-label { color: #a1a1aa; }
        .gf-detail-val { font-weight: 500; color: #f4f4f5; }
        
        .gf-badge { background: #065f46; color: #34d399; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
        .gf-layover { font-size: 11px; color: #fb923c; background: rgba(251, 146, 60, 0.1); border: 1px dashed rgba(251, 146, 60, 0.3); text-align: center; padding: 6px; border-radius: 6px; margin: 2px 0; font-weight: 600; }
        
        .q-excellent { color: #4ade80; }
        .q-good { color: #a3e635; }
        .q-average { color: #facc15; }
        .q-poor { color: #fb923c; }
        .q-terrible { color: #f87171; }
    `;
    document.head.appendChild(style);

    let compiledItineraries = [];

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

    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Generate Application Overlay DOM Structure
    const appContainer = document.createElement('div');
    appContainer.id = 'g-flights-suite';
    appContainer.innerHTML = `
        <div class="gf-header">
            <span class="gf-title">✈️ Google Flights Suite (Max Realism)</span>
            <button id="gf-close-window" class="gf-close">✕</button>
        </div>
        <div class="gf-controls">
            <div class="gf-row">
                <div style="flex: 2; display: flex; flex-direction: column;">
                    <span class="gf-label">Route Nodes</span>
                    <input type="text" id="gf-route-input" class="gf-input" placeholder="Codes / IDs (e.g. SYD, LAX, JFK)">
                </div>
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <span class="gf-label">Departure Date</span>
                    <input type="date" id="gf-date-input" class="gf-input" value="${todayStr}">
                </div>
                <button id="gf-submit-search" class="gf-btn" style="margin-top: 12px;">Search</button>
            </div>
            
            <div class="gf-row">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <span class="gf-label">Class</span>
                    <select id="gf-filter-class" class="gf-input">
                        <option value="economy">Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                    </select>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <span class="gf-label">Passengers</span>
                    <select id="gf-filter-passengers" class="gf-input">
                        <option value="1">1 adult</option>
                        <option value="2">2 adults</option>
                        <option value="3">3 adults</option>
                        <option value="4">4 adults</option>
                        <option value="5">5 adults</option>
                    </select>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <span class="gf-label">Max Connections</span>
                    <select id="gf-filter-stops" class="gf-input">
                        <option value="all">Any stops</option>
                        <option value="0">Nonstop Only</option>
                        <option value="1">Max 1 Layover</option>
                        <option value="2">Max 2 Layovers</option>
                        <option value="overnight">Overnight Flight Tracks</option>
                    </select>
                </div>
            </div>

            <div class="gf-row">
                <input type="text" id="gf-filter-airline" class="gf-input" placeholder="Filter Airline Name...">
                <input type="number" id="gf-filter-price" class="gf-input" placeholder="Max Price ($)">
            </div>
        </div>
        <div id="gf-results-box" class="gf-results">
            <div style="color: #71717a; text-align: center; margin-top: 100px; font-size: 14px;">
                Configure travel settings above and hit Search.
            </div>
        </div>
    `;
    document.body.appendChild(appContainer);

    // 3. Main Data Filter Rendering Processing Module
    function processAndRenderFilters() {
        const resultsBox = document.getElementById('gf-results-box');
        const airlineQuery = document.getElementById('gf-filter-airline').value.toLowerCase();
        const maxStops = document.getElementById('gf-filter-stops').value;
        const maxPrice = parseFloat(document.getElementById('gf-filter-price').value) || Infinity;
        
        const cabinClass = document.getElementById('gf-filter-class').value;
        const passengerCount = parseInt(document.getElementById('gf-filter-passengers').value) || 1;
        const selectedDate = document.getElementById('gf-date-input').value;

        if (compiledItineraries.length === 0) {
            resultsBox.innerHTML = `<div style="color: #71717a; text-align: center; margin-top: 50px;">No paths found.</div>`;
            return;
        }

        let classMultiplier = 1.0;
        let classLabelText = 'Economy';
        if (cabinClass === 'business') { classMultiplier = 2.2; classLabelText = 'Business Class'; }
        if (cabinClass === 'first') { classMultiplier = 4.0; classLabelText = 'First Class'; }

        const filtered = compiledItineraries.filter(itinerary => {
            const adjustedCost = Math.round(itinerary.totalCost * classMultiplier * passengerCount);
            if (adjustedCost > maxPrice) return false;

            // Handle Overnight Filtering logic check
            if (maxStops === 'overnight') {
                const hasOvernightSegment = itinerary.legs.some(leg => 
                    leg.some((flight, idx) => idx > 0 && (flight.departure - leg[idx-1].arrival) > 480)
                );
                if (!hasOvernightSegment) return false;
            } else if (maxStops !== 'all') {
                const structuralViolation = itinerary.legs.some(leg => (leg.length - 1) > parseInt(maxStops));
                if (structuralViolation) return false;
            }

            if (airlineQuery) {
                const matchesAirline = itinerary.legs.some(leg => 
                    leg.some(flight => flight.airlineName.toLowerCase().includes(airlineQuery))
                );
                if (!matchesAirline) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">No itineraries match your filters.</div>`;
            return;
        }

        resultsBox.innerHTML = '';
        filtered.forEach(itinerary => {
            const card = document.createElement('div');
            card.className = 'gf-card';
            
            // Interactive Drawer Expansion Click Handler
            card.addEventListener('click', (e) => {
                // Ignore click if clicking internal details box text directly
                if (e.target.closest('.gf-details')) return;
                const detailsDrawer = card.querySelector('.gf-details');
                if (detailsDrawer) detailsDrawer.classList.toggle('active');
            });

            let legsHtml = '';
            let totalStopsCount = 0;
            let combinedAmenitiesHtml = '';
            let emissionsTotal = 0;

            const finalCalculatedCost = Math.round(itinerary.totalCost * classMultiplier * passengerCount);

            itinerary.legs.forEach((legFlights, index) => {
                totalStopsCount += (legFlights.length - 1);
                legsHtml += `<div style="font-size: 11px; text-transform: uppercase; color: #3b82f6; font-weight: bold; margin-top: 6px;">Leg ${index + 1}</div>`;
                
                legFlights.forEach((flight, fIndex) => {
                    if (fIndex > 0) {
                        const prevFlight = legFlights[fIndex - 1];
                        const layoverTime = flight.departure - prevFlight.arrival;
                        const isOvernight = layoverTime > 480 ? ' 🌙 (Overnight Layover)' : '';
                        legsHtml += `<div class="gf-layover">⏱️ Layover: ${formatDuration(layoverTime)}${isOvernight} at ${flight.fromAirportIata}</div>`;
                    }

                    let badgeHtml = '';
                    if (flight.remarks && flight.remarks.includes('BEST_SELLER')) badgeHtml = `<span class="gf-badge">Best Seller</span>`;
                    if (flight.remarks && flight.remarks.includes('BEST_DEAL')) badgeHtml = `<span class="gf-badge" style="background:#1e3a8a; color:#93c5fd;">Best Deal</span>`;

                    const qTier = getQualityTier(flight.computedQuality || 50);
                    const rawFeatures = flight.features || [];
                    
                    // Populate explicit G-Flights specification indicators
                    const amenitiesList = [
                        { label: "Cabin Class", val: classLabelText },
                        { label: "Legroom", val: cabinClass === 'economy' ? (flight.computedQuality > 70 ? 'Above-average legroom (81 cm)' : 'Standard legroom (78 cm)') : cabinClass === 'business' ? 'Plush deep space (96 cm)' : 'Full Lie-flat Private Suite' },
                        { label: "Wi-Fi", val: rawFeatures.includes('WIFI') ? 'Wi-Fi connectivity available' : 'Wi-Fi for a fee / Unavailable' },
                        { label: "Power Outlets", val: rawFeatures.includes('POWER_OUTLET') ? 'In-seat power and USB outlets' : 'Outlets unavailable' },
                        { label: "In-Flight Video", val: rawFeatures.includes('IFE') ? 'On-demand video system' : 'No streaming screens' }
                    ];

                    emissionsTotal += Math.round((flight.duration || 120) * 4.2 * passengerCount);

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
                        <div class="gf-leg">
                            <div class="gf-leg-title">
                                <span>✈️ ${flight.flightCode || 'FLIGHT'} (${flight.fromAirportIata} ➔ ${flight.toAirportIata})</span>
                                <span>$${Math.round(flight.price * classMultiplier * passengerCount)} ${badgeHtml}</span>
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
                    <span class="gf-price">$${finalCalculatedCost}</span>
                    <span style="font-size: 11px; color:#a1a1aa; font-weight:500;">📅 ${selectedDate || todayStr} (${passengerCount} pax)</span>
                    <span class="gf-stops">${totalStopsCount === 0 ? 'Nonstop Total' : totalStopsCount + ' Total Layovers'}</span>
                </div>
                <div class="gf-legs-container">${legsHtml}</div>
                <div class="gf-details">
                    ${combinedAmenitiesHtml}
                    <div class="gf-detail-section" style="border-top: 1px solid #3f3f46; margin-top: 4px; padding-top: 6px;">
                        <div class="gf-detail-row"><span class="gf-detail-label">Emissions estimate:</span><span class="gf-detail-val" style="color:#facc15;">${emissionsTotal} kg CO2e</span></div>
                        <div class="gf-detail-row"><span class="gf-detail-label">Contrail warming potential:</span><span class="gf-detail-val" style="color:#a3e635;">Low</span></div>
                    </div>
                </div>
            `;
            resultsBox.appendChild(card);
        });
    }

    // 4. Mathematical Permutations Array Combinator Framework
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

    // 5. Async Multi-Fetch Endpoint Engine
    async function executeFlightSearch() {
        const inputString = document.getElementById('gf-route-input').value.trim();
        const resultsBox = document.getElementById('gf-results-box');

        if (!inputString) {
            resultsBox.innerHTML = `<div style="color: #f59e0b; text-align: center; margin-top: 50px;">Please specify Airport codes or IDs.</div>`;
            return;
        }

        const inputs = inputString.split(',').map(item => item.trim().toUpperCase()).filter(item => item.length > 0);
        if (inputs.length < 2) {
            resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">Minimum 2 airport steps required.</div>`;
            return;
        }

        const airportIds = [];
        let lookupError = false;

        for (const input of inputs) {
            if (!isNaN(input)) {
                airportIds.push(input);
            } else {
                let foundId = null;
                if (typeof airports !== 'undefined' && airports.features) {
                    const match = airports.features.find(f => f.properties && f.properties.iata === input);
                    if (match) foundId = match.properties.id;
                }
                if (foundId) {
                    airportIds.push(foundId);
                } else {
                    resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">Could not map code "${input}" to an internal game ID.</div>`;
                    lookupError = true;
                    break;
                }
            }
        }

        if (lookupError) return;

        resultsBox.innerHTML = `<div style="color: #60a5fa; text-align: center; margin-top: 100px;">Querying simulated routing layers...</div>`;
        compiledItineraries = [];

        try {
            const fetchPromises = [];
            for (let i = 0; i < airportIds.length - 1; i++) {
                const fromNode = airportIds[i];
                const toNode = airportIds[i+1];
                fetchPromises.push(fetch(`/search-route/${fromNode}/${toNode}`).then(res => {
                    if (!res.ok) throw new Error(`Network failure tracking segment ${fromNode}->${toNode}`);
                    return res.json();
                }));
            }

            const segmentsData = await Promise.all(fetchPromises);
            compiledItineraries = generatePermutations(segmentsData);
            compiledItineraries.sort((a, b) => a.totalCost - b.totalCost);
            processAndRenderFilters();

        } catch (error) {
            console.error("G-Flights add-on crash logged:", error);
            resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">Error calculating interconnected connections.</div>`;
        }
    }

    // 6. Connect Layout Interface Element Trigger Events
    document.getElementById('gf-submit-search').addEventListener('click', executeFlightSearch);
    document.getElementById('gf-filter-airline').addEventListener('input', processAndRenderFilters);
    document.getElementById('gf-filter-stops').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-filter-price').addEventListener('input', processAndRenderFilters);
    document.getElementById('gf-filter-class').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-filter-passengers').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-date-input').addEventListener('change', processAndRenderFilters);

    document.getElementById('gf-close-window').addEventListener('click', () => {
        appContainer.remove();
        style.remove();
    });
})();
