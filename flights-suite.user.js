// ==UserScript==
// @name         MyFlyClub Google Flights Suite (Max Realism)
// @namespace    https://github.com/raid2256
// @version      1.5
// @description  Advanced flight search with cabin class, passenger count multipliers, realistic dates, and expandable info cards.
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
            position: fixed; top: 15px; right: 15px; width: 550px; height: 780px;
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

    // Set today's date format as a default placeholder input
    const todayStr = new Date().toISOString().split('T')[0];

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

        // Apply Class Modifiers (Game baseline provides a base ticket cost, we simulate standard class scaling multipliers)
        let classMultiplier = 1.0;
        let classLabelText = 'Economy';
        if (cabinClass === 'business') { classMultiplier = 2.2; classLabelText = 'Business Class'; }
        if (cabinClass === 'first') { classMultiplier = 4.0; classLabelText = 'First Class'; }

        const filtered = compiledItineraries.filter(itinerary => {
            const adjustedCost = Math.round(itinerary.totalCost * classMultiplier * passengerCount);
            if (adjustedCost > maxPrice) return false;

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
            resultsBox.innerHTML = `<div style="color: #ef4444; text-align: center; margin-top: 50px;">No itineraries match your filters.</div>`;
            return;
        }

        resultsBox.innerHTML = '';
        filtered.forEach(itinerary => {
            const card = document.createElement('div');
            card.className = 'gf-card';
            
            card.addEventListener('click', (e) => {
                const detailsDrawer = card.querySelector('.gf-details');
