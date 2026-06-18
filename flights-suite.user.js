// ==UserScript==
// @name         MyFlyClub Google Flights Suite (Max Details)
// @namespace    https://github.com/raid2256
// @version      1.4
// @description  Advanced flight search with expandable info cards, detailed layovers, aircraft info, and mock sustainability specs.
// @match        *://*.myfly.club/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (document.getElementById('g-flights-suite')) {
        document.getElementById('g-flights-suite').remove();
    }

    const style = document.createElement('style');
    style.id = 'g-flights-styles';
    style.innerHTML = `
        #g-flights-suite {
            position: fixed; top: 15px; right: 15px; width: 540px; height: 760px;
            background: #121214; color: #e4e4e7; border: 1px solid #27272a;
            border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.7);
            z-index: 999999; font-family: system-ui, -apple-system, sans-serif;
            display: flex; flex-direction: column; overflow: hidden;
        }
        .gf-header { background: #1e1e24; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; }
        .gf-title { font-weight: 700; color: #60a5fa; font-size: 15px; display: flex; align-items: center; gap: 6px; }
        .gf-close { background: none; border: none; color: #a1a1aa; cursor: pointer; font-size: 16px; font-weight: bold; }
        .gf-close:hover { color: #f4f4f5; }
        .gf-controls { padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #18181b; border-bottom: 1px solid #27272a; }
        .gf-row { display: flex; gap: 10px; }
        .gf-input { flex: 1; padding: 10px; background: #27272a; border: 1px solid #3f3f46; color: #ffffff; border-radius: 8px; font-size: 13px; outline: none; }
        .gf-input:focus { border-color: #3b82f6; }
        .gf-btn { background: #2563eb; color: #ffffff; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; transition: background 0.2s; }
        .gf-btn:hover { background: #1d4ed8; }
        .gf-results { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #09090b; }
        
        /* Expandable Card Framework */
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
        .gf-details { display: none; background: #141416; padding: 12px; border-radius: 8px; font-size: 12px; color: #d4d4d8; border: 1px solid #27272a; flex-direction: column; gap: 8px; margin-top: 4px; }
        .gf-details.active { display: flex; }
        .gf-detail-section { display: flex; flex-direction: column; gap: 2px; border-bottom: 1px solid #27272a; padding-bottom: 6px; }
        .gf-detail-section:last-child { border-bottom: none; padding-bottom: 0; }
        .gf-detail-row { display: flex; justify-content: space-between; }
        .gf-detail-label { color: #a1a1aa; }
        .gf-detail-val { font-weight: 500; color: #f4f4f5; }
        
        .gf-badge { background: #065f46; color: #34d399; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
        .gf-layover { font-size: 11px; color: #fb923c; background: rgba(251, 146, 60, 0.1); border: 1px dashed rgba(251, 146, 60, 0.3); text-align: center; padding: 4px; border-radius: 6px; margin: 2px 0; font-weight: 500; }
        
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

    const appContainer = document.createElement('div');
    appContainer.id = 'g-flights-suite';
    appContainer.innerHTML = `
        <div class="gf-header">
            <span class="gf-title">✈️ Google Flights Suite (Advanced Layout)</span>
            <button id="gf-close-window" class="gf-close">✕</button>
        </div>
        <div class="gf-controls">
            <div class="gf-row">
                <input type="text" id="gf-route-input" class="gf-input" placeholder="Codes or IDs (e.g. SYD, LAX, JFK)">
                <button id="gf-submit-search" class="gf-btn">Search Route</button>
            </div>
            <div class="gf-row">
                <input type="text" id="gf-filter-airline" class="gf-input" placeholder="Filter Airline...">
                <select id="gf-filter-stops" class="gf-input">
                    <option value="all">Any connections</option>
                    <option value="0">Direct/Nonstop Only</option>
                    <option value="1">Max 1 Layover per leg</option>
                    <option value="2">Max 2 Layovers per leg</option>
                </select>
                <input type="number" id="gf-filter-price" class="gf-input" placeholder="Max Price ($)">
            </div>
        </div>
        <div id="gf-results-box" class="gf-results">
            <div style="color: #71717a; text-align: center; margin-top: 100px; font-size: 14px;">
                Enter single or multi-city nodes to load expandable itineraries.
            </div>
        </div>
    `;
    document.body.appendChild(appContainer);

    function processAndRenderFilters() {
        const resultsBox = document.getElementById('gf-results-box');
        const airlineQuery = document.getElementById('gf-filter-airline').value.toLowerCase();
        const maxStops = document.getElementById('gf-filter-stops').value;
        const maxPrice = parseFloat(document.getElementById('gf-filter-price').value) || Infinity;

        if (compiledItineraries.length === 0) {
            resultsBox.innerHTML = `<div style="color: #71717a; text-align: center; margin-top: 50px;">No paths found.</div>`;
            return;
        }

        const filtered = compiledItineraries.filter(itinerary => {
            if (itinerary.totalCost > maxPrice) return false;
            if (maxStops !== 'all') {
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
            resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">No itineraries match filters.</div>`;
            return;
        }

        resultsBox.innerHTML = '';
        filtered.forEach(itinerary => {
            const card = document.createElement('div');
            card.className = 'gf-card';
            
            // Setup card toggle handler for expanding details drawer safely
            card.addEventListener('click', (e) => {
                const detailsDrawer = card.querySelector('.gf-details');
                if (detailsDrawer) detailsDrawer.classList.toggle('active');
            });

            let legsHtml = '';
            let totalStopsCount = 0;
            let combinedAmenitiesHtml = '';
            let emissionsTotal = 0;

            itinerary.legs.forEach((legFlights, index) => {
                totalStopsCount += (legFlights.length - 1);
                legsHtml += `<div style="font-size: 11px; text-transform: uppercase; color: #3b82f6; font-weight: bold; margin-top: 6px;">Leg ${index + 1}</div>`;
                
                legFlights.forEach((flight, fIndex) => {
                    if (fIndex > 0) {
                        const prevFlight = legFlights[fIndex - 1];
                        const layoverTime = flight.departure - prevFlight.arrival;
                        const isOvernight = layoverTime > 480 ? ' (Overnight Layover)' : '';
                        legsHtml += `<div class="gf-layover">⏱️ Layover: ${formatDuration(layoverTime)}${isOvernight} at ${flight.fromAirportIata}</div>`;
                    }

                    let badgeHtml = '';
                    if (flight.remarks && flight.remarks.includes('BEST_SELLER')) badgeHtml = `<span class="gf-badge">Best Seller</span>`;
                    if (flight.remarks && flight.remarks.includes('BEST_DEAL')) badgeHtml = `<span class="gf-badge" style="background:#1e3a8a; color:#93c5fd;">Best Deal</span>`;

                    const qTier = getQualityTier(flight.computedQuality || 50);

                    // Scrape/Infer core specs from raw flight object parameters
                    const rawFeatures = flight.features || [];
                    const amenitiesList = [
                        `Legroom: ${flight.computedQuality > 70 ? 'Above-average (81 cm)' : 'Standard (78 cm)'}`,
                        `Wi-Fi: ${rawFeatures.includes('WIFI') ? 'Free or Premium' : 'Unavailable'}`,
                        `Power: ${rawFeatures.includes('POWER_OUTLET') ? 'In-seat outlets & USB' : 'Not available'}`,
                        `Entertainment: ${rawFeatures.includes('IFE') ? 'On-demand video' : 'Bring your own device'}`
                    ];

                    emissionsTotal += Math.round((flight.duration || 120) * 4.2);

                    combinedAmenitiesHtml += `
                        <div class="gf-detail-section">
                            <div style="font-weight:bold; color:#60a5fa; margin-bottom:4px;">Flight ${flight.flightCode || 'FLIGHT'} Details</div>
                            ${amenitiesList.map(a => `<div class="gf-detail-row"><span class="gf-detail-label">${a.split(':')[0]}:</span><span class="gf-detail-val">${a.split(':')[1]}</span></div>`).join('')}
                        </div>
                    `;

                    legsHtml += `
                        <div class="gf-leg">
                            <div class="gf-leg-title">
                                <span>✈️ ${flight.flightCode || 'FLIGHT'} (${flight.fromAirportIata} ➔ ${flight.toAirportIata})</span>
                                <span>$${flight.price || 0} ${badgeHtml}</span>
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
                    <span class="gf-price">$${itinerary.totalCost}</span>
                    <span class="gf-stops">${totalStopsCount === 0 ? 'Nonstop Total' : totalStopsCount + ' Total Layovers'}</span>
                </div>
                <div class="gf-legs-container">${legsHtml}</div>
                <div class="gf-details">
                    ${combinedAmenitiesHtml}
                    <div class="gf-detail-section" style="border-top: 1px solid #3f3f46; margin-top: 4px; padding-top: 6px;">
                        <div class="gf-detail-row"><span class="gf-detail-label">Emissions Estimate:</span><span class="gf-detail-val" style="color:#facc15;">~${emissionsTotal} kg CO2e</span></div>
                        <div class="gf-detail-row"><span class="gf-detail-label">Contrail Warming Potential:</span><span class="gf-detail-val" style="color:#a3e635;">Low</span></div>
                    </div>
                </div>
            `;
            resultsBox.appendChild(card);
        });
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

    document.getElementById('gf-submit-search').addEventListener('click', executeFlightSearch);
    document.getElementById('gf-filter-airline').addEventListener('input', processAndRenderFilters);
    document.getElementById('gf-filter-stops').addEventListener('change', processAndRenderFilters);
    document.getElementById('gf-filter-price').addEventListener('input', processAndRenderFilters);

    document.getElementById('gf-close-window').addEventListener('click', () => {
        appContainer.remove();
        style.remove();
    });
})();
