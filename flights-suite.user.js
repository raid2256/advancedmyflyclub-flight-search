// ==UserScript==
// @name         MyFlyClub Google Flights Suite (Advanced Layout)
// @namespace    https://github.com/raid2256
// @version      1.7
// @description  Advanced flight search engine with dynamic Multi-City leg additions, structural layout fixes, and complete metrics dropdowns.
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
            position: fixed; top: 15px; right: 15px; width: 560px; height: 780px;
            background: #121214; color: #e4e4e7; border: 1px solid #27272a;
            border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.7);
            z-index: 999999; font-family: system-ui, -apple-system, sans-serif;
            display: flex; flex-direction: column; overflow: hidden;
        }
        .gf-header { background: #1e1e24; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; flex-shrink: 0; }
        .gf-title { font-weight: 700; color: #60a5fa; font-size: 15px; display: flex; align-items: center; gap: 6px; }
        .gf-close { background: none; border: none; color: #a1a1aa; cursor: pointer; font-size: 16px; font-weight: bold; }
        .gf-close:hover { color: #f4f4f5; }
        
        /* Layout fix: Increased padding/gap spacing matrix to prevent item collisions */
        .gf-controls { padding: 16px; display: flex; flex-direction: column; gap: 14px; background: #18181b; border-bottom: 1px solid #27272a; flex-shrink: 0; }
        .gf-row { display: flex; gap: 10px; align-items: flex-end; width: 100%; }
        .gf-input-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .gf-input { width: 100%; padding: 10px; background: #27272a; border: 1px solid #3f3f46; color: #ffffff; border-radius: 8px; font-size: 13px; outline: none; box-sizing: border-box; height: 38px; line-height: 1.2; }
        .gf-input:focus { border-color: #3b82f6; }
        .gf-label { font-size: 12px; color: #a1a1aa; font-weight: 600; display: block; }
        
        /* Multi-City dynamic segments box */
        .gf-legs-builder { display: flex; flex-direction: column; gap: 8px; max-height: 140px; overflow-y: auto; padding-right: 4px; }
        .gf-leg-builder-row { display: flex; gap: 8px; align-items: center; background: #202024; padding: 6px; border-radius: 8px; border: 1px solid #27272a; }
        .gf-add-leg-btn { background: none; border: 1px dashed #3f3f46; color: #60a5fa; padding: 6px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; text-align: center; width: 100%; transition: background 0.2s; }
        .gf-add-leg-btn:hover { background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; }
        .gf-remove-leg-btn { background: none; border: none; color: #f87171; cursor: pointer; font-size: 14px; padding: 0 6px; font-weight: bold; }

        .gf-btn { background: #2563eb; color: #ffffff; border: none; padding: 0 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; transition: background 0.2s; height: 38px; display: inline-flex; align-items: center; justify-content: center; }
        .gf-btn:hover { background: #1d4ed8; }
        .gf-results { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #09090b; }
        
        .gf-card { background: #1e1e24; border: 1px solid #27272a; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: background 0.2s; }
        .gf-card:hover { background: #24242b; border-color: #3f3f46; }
        .gf-summary { display: flex; justify-content: space-between; align-items: center; }
        .gf-price { font-size: 18px; font-weight: 700; color: #4ade80; }
        .gf-stops { font-size: 12px; color: #a1a1aa; background: #27272a; padding: 2px 8px; border-radius: 20px; }
        
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

    const appContainer = document.createElement('div');
    appContainer.id = 'g-flights-suite';
    appContainer.innerHTML = `
        <div class="gf-header">
            <span class="gf-title">✈️ Advanced Flight Search</span>
            <button id="gf-close-window" class="gf-close">✕</button>
        </div>
        <div class="gf-controls">
            <div id="gf-legs-builder-box" class="gf-legs-builder">
                <div class="gf-leg-builder-row" data-leg-index="0">
                    <div class="gf-input-group">
                        <span class="gf-label">From</span>
                        <input type="text" class="gf-input gf-loc-from" placeholder="e.g. DXB" value="DXB">
                    </div>
                    <div class="gf-input-group">
                        <span class="gf-label">To</span>
                        <input type="text" class="gf-input gf-loc-to" placeholder="e.g. SYD" value="SYD">
                    </div>
                    <span style="width:20px;"></span>
                </div>
            </div>
            <button id="gf-add-leg-trigger" class="gf-add-leg-btn">+ Add flight leg</button>

            <div class="gf-row">
                <div class="gf-input-group" style="flex: 1.5;">
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
                    <span class="gf-label">Passengers</span>
                    <select id="gf-filter-passengers" class="gf-input">
                        <option value="1">1 adult</option>
                        <option value="2">2 adults</option>
                        <option value="3">3 adults</option>
                    </select>
                </div>
                <div class="gf-input-group">
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

    // Dynamic Multi-City Leg Adder Controls Layer
    document.getElementById('gf-add-leg-trigger').addEventListener('click', () => {
        const builderBox = document.getElementById('gf-legs-builder-box');
        const currentCount = builderBox.children.length;
        
        // Get target default based on last row destination to smooth input chain flow
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

        newRow.querySelector('.gf-remove-leg-btn').addEventListener('click', () => {
            newRow.remove();
        });

        builderBox.appendChild(newRow);
    });

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
            
            card.addEventListener('click', (e) => {
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
        
        // Dynamic node mapping array loop processing across builder layout items
        const rawNodes = [];
        Array.from(builderBox.children).forEach(row => {
            const fromCode = row.querySelector('.gf-loc-from').value.trim().toUpperCase();
            const toCode = row.querySelector('.gf-loc-to').value.trim().toUpperCase();
            if (fromCode && toCode) {
                rawNodes.push({ from: fromCode, to: toCode });
            }
        });

        if (rawNodes.length === 0) {
            resultsBox.innerHTML = `<div style="color: #f59e0b; text-align: center; margin-top: 50px;">Please specify structural destination pairs.</div>`;
            return;
        }

        resultsBox.innerHTML = `<div style="color: #60a5fa; text-align: center; margin-top: 100px;">Mapping structural layout arrays...</div>`;
        compiledItineraries = [];

        try {
            const fetchPromises = [];
            
            for (const leg of rawNodes) {
                let fromId = leg.from;
                let toId = leg.to;

                // Handle global airport object parsing lookups for string codes
                if (isNaN(fromId) && typeof airports !== 'undefined' && airports.features) {
                    const match = airports.features.find(f => f.properties && f.properties.iata === fromId);
                    if (match) fromId = match.properties.id;
                }
                if (isNaN(toId) && typeof airports !== 'undefined' && airports.features) {
                    const match = airports.features.find(f => f.properties && f.properties.iata === toId);
                    if (match) toId = match.properties.id;
                }

                if (isNaN(fromId) || isNaN(toId)) {
                    throw new Error(`Failed code translation mapping for parameters.`);
                }

                fetchPromises.push(fetch(`/search-route/${fromId}/${toId}`).then(res => {
                    if (!res.ok) throw new Error(`Segment mapping failed`);
                    return res.json();
                }));
            }

            const segmentsData = await Promise.all(fetchPromises);
            compiledItineraries = generatePermutations(segmentsData);
            compiledItineraries.sort((a, b) => a.totalCost - b.totalCost);
            processAndRenderFilters();

        } catch (error) {
            console.error("Advanced search thread exception handled:", error);
            resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">Error calculating interconnected routing pairs. Check airport codes.</div>`;
        }
    }

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
