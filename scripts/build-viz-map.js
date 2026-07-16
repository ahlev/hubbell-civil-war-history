// Build script for viz-map-moves.html
// Embeds compact JSON data into the HTML template
const fs = require('fs');
const path = require('path');

const data = require('./viz-data-compact.json');
const jsonStr = JSON.stringify(data);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Map That Moves — Hubbell Brothers in the Civil War</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', sans-serif;
  background: #FAF8F5;
  color: #2C2C2C;
  overflow-x: hidden;
}

.header {
  text-align: center;
  padding: 28px 24px 14px;
  border-bottom: 1px solid #E8E4DF;
  background: #FFFFFF;
}

.header h1 {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 700;
  color: #2C2C2C;
  margin-bottom: 4px;
}

.header .subtitle {
  font-size: 0.95rem;
  color: #6B6B6B;
  font-weight: 300;
}

.main-container {
  display: flex;
  height: calc(100vh - 100px);
  min-height: 600px;
}

.map-panel {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #FAF8F5;
}

.side-panel {
  width: 340px;
  background: #FFFFFF;
  border-left: 1px solid #E8E4DF;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Controls bar */
.controls {
  background: #FFFFFF;
  border-top: 1px solid #E8E4DF;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.controls button {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #E8E4DF;
  background: #FFFFFF;
  color: #2C2C2C;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.controls button:hover {
  background: #FAF8F5;
  border-color: #9B9B9B;
}

.controls button.active {
  background: #2C2C2C;
  color: #FFFFFF;
  border-color: #2C2C2C;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #6B6B6B;
}

.speed-control select {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  padding: 4px 8px;
  border: 1px solid #E8E4DF;
  border-radius: 4px;
  background: #FFFFFF;
  color: #2C2C2C;
  cursor: pointer;
}

.timeline-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.timeline-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: #E8E4DF;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #2C2C2C;
  cursor: pointer;
  border: 2px solid #FFFFFF;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.date-display {
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2C2C2C;
  min-width: 140px;
  text-align: center;
}

/* Legend */
.legend {
  padding: 16px 20px;
  border-bottom: 1px solid #F0ECE7;
}

.legend h3 {
  font-family: 'Playfair Display', serif;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #2C2C2C;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.8rem;
  color: #6B6B6B;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Event feed */
.event-feed {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.event-feed h3 {
  font-family: 'Playfair Display', serif;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #2C2C2C;
}

.event-card {
  background: #FAF8F5;
  border: 1px solid #F0ECE7;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.event-card.active {
  border-color: #B8860B;
  background: #FFFDF7;
  box-shadow: 0 1px 4px rgba(184,134,11,0.12);
}

.event-card .date {
  font-size: 0.7rem;
  color: #9B9B9B;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.event-card .title {
  font-size: 0.85rem;
  font-weight: 500;
  color: #2C2C2C;
  margin-top: 2px;
}

.event-card .type-badge {
  display: inline-block;
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 3px;
  margin-top: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.event-card .type-badge.battle { background: #FDE8E8; color: #C44E52; }
.event-card .type-badge.movement { background: #E8F0FD; color: #2D5F8A; }
.event-card .type-badge.personal { background: #FDF5E8; color: #B8860B; }

/* Letter detail panel */
.letter-detail {
  padding: 16px 20px;
  border-top: 1px solid #F0ECE7;
  max-height: 260px;
  overflow-y: auto;
  display: none;
}

.letter-detail.visible { display: block; }

.letter-detail h3 {
  font-family: 'Playfair Display', serif;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2C2C2C;
}

.letter-detail .meta {
  font-size: 0.75rem;
  color: #9B9B9B;
  margin-bottom: 8px;
}

.letter-detail .excerpt {
  font-size: 0.8rem;
  color: #6B6B6B;
  line-height: 1.5;
  font-style: italic;
}

.letter-detail .close-btn {
  float: right;
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #9B9B9B;
  padding: 0 4px;
}

.letter-detail .close-btn:hover { color: #2C2C2C; }

/* Tooltip */
.tooltip {
  position: absolute;
  background: #FFFFFF;
  border: 1px solid #E8E4DF;
  border-radius: 6px;
  padding: 10px 14px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 100;
  max-width: 260px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.tooltip.visible { opacity: 1; }

.tooltip .author-name {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 2px;
}

.tooltip .location {
  font-size: 0.75rem;
  color: #6B6B6B;
}

.tooltip .letter-info {
  font-size: 0.7rem;
  color: #9B9B9B;
  margin-top: 4px;
}

/* SVG styles */
.state-outline {
  fill: #F0ECE7;
  stroke: #D4CFC8;
  stroke-width: 1;
}

.state-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  fill: #B8B2AA;
  font-weight: 400;
  text-anchor: middle;
  letter-spacing: 2px;
}

.location-label {
  font-family: 'Inter', sans-serif;
  font-size: 8px;
  fill: #6B6B6B;
  pointer-events: none;
}

.brother-dot {
  cursor: pointer;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.2));
}

.trail-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@keyframes pulse {
  0% { r: 6; opacity: 0.5; }
  50% { r: 20; opacity: 0; }
  100% { r: 6; opacity: 0.5; }
}

.battle-pulse {
  fill: #C44E52;
  opacity: 0;
}

.battle-pulse.active {
  animation: pulse 2s ease-in-out infinite;
}

/* Brother dot smooth transition */
.brother-group {
  transition: transform 0.6s ease-in-out, opacity 0.4s;
}

/* Responsive */
@media (max-width: 900px) {
  .main-container { flex-direction: column; height: auto; }
  .side-panel { width: 100%; border-left: none; border-top: 1px solid #E8E4DF; max-height: 400px; }
  .map-panel { min-height: 450px; }
}
</style>
</head>
<body>

<div class="header">
  <h1>The Map That Moves</h1>
  <div class="subtitle">Tracing the Hubbell brothers across the Eastern Theater, 1861\u20131862</div>
</div>

<div class="main-container">
  <div class="map-panel" id="mapPanel">
    <svg id="mapSvg" width="100%" height="100%" viewBox="0 0 800 620" preserveAspectRatio="xMidYMid meet"></svg>
    <div class="tooltip" id="tooltip"></div>
  </div>

  <div class="side-panel">
    <div class="legend">
      <h3>The Brothers</h3>
      <div class="legend-item"><div class="legend-dot" style="background:#2D5F8A"></div> Henry (34th NY) \u2014 59 letters</div>
      <div class="legend-item"><div class="legend-dot" style="background:#B8860B"></div> Alexander (60th NY) \u2014 46 letters</div>
      <div class="legend-item"><div class="legend-dot" style="background:#4A7C59"></div> James (West Point) \u2014 3 letters</div>
      <div class="legend-item"><div class="legend-dot" style="background:#8B3A3A"></div> Charles (16th NY) \u2014 3 letters</div>
      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #F0ECE7;">
        <div class="legend-item"><div class="legend-icon"><svg width="12" height="12"><polygon points="6,1 8,5 12,5 9,8 10,12 6,10 2,12 3,8 0,5 4,5" fill="#B8860B" opacity="0.7"/></svg></div> Home (Champlain, NY)</div>
        <div class="legend-item"><div class="legend-icon"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#C44E52" stroke-width="1.5"/></svg></div> Battle site</div>
        <div class="legend-item"><div class="legend-icon"><svg width="12" height="12"><circle cx="6" cy="6" r="3" fill="#9B9B9B"/></svg></div> City / Camp</div>
      </div>
    </div>

    <div class="event-feed" id="eventFeed">
      <h3>Timeline Events</h3>
    </div>

    <div class="letter-detail" id="letterDetail">
      <button class="close-btn" onclick="closeLetterDetail()">\u2715</button>
      <h3 id="letterDetailTitle">Letter</h3>
      <div class="meta" id="letterDetailMeta"></div>
      <div class="excerpt" id="letterDetailExcerpt"></div>
    </div>
  </div>
</div>

<div class="controls">
  <button id="playBtn" onclick="togglePlay()">&#9654; Play</button>
  <div class="speed-control">
    <label>Speed:</label>
    <select id="speedSelect" onchange="setSpeed(this.value)">
      <option value="3000">Slow</option>
      <option value="1500" selected>Normal</option>
      <option value="700">Fast</option>
      <option value="300">Very Fast</option>
    </select>
  </div>
  <div class="timeline-container">
    <div class="date-display" id="dateDisplay">June 6, 1861</div>
    <input type="range" class="timeline-slider" id="timelineSlider" min="0" max="100" value="0" oninput="scrubTimeline(this.value)">
  </div>
</div>

<script>
// ============================================================
// EMBEDDED DATA
// ============================================================
const DATA = ${jsonStr};

// ============================================================
// GEOCODING LOOKUP - SVG coordinates (viewBox 0 0 800 620)
// Spread out to reduce overlap, especially in VA/MD corridor
// ============================================================
const GEO = {
  // New York State
  'Champlain, NY':          { x: 590, y: 48 },
  'Plattsburgh, NY':        { x: 578, y: 72 },
  'West Point, NY':         { x: 570, y: 150 },
  'Albany, NY':              { x: 580, y: 122 },
  'Ogdensburg, NY':         { x: 480, y: 50 },
  'New York City':          { x: 585, y: 178 },
  'Malone, NY':             { x: 545, y: 44 },
  'Potsdam, NY':            { x: 510, y: 42 },

  // Pennsylvania
  'Harrisburg, PA':         { x: 510, y: 218 },

  // Maryland - spread these out more
  'Baltimore, MD':          { x: 520, y: 260 },
  'Frederick, MD':          { x: 480, y: 246 },
  'Poolesville, MD':        { x: 465, y: 268 },
  'Relay, MD':              { x: 508, y: 264 },
  'Annapolis, MD':          { x: 535, y: 268 },

  // DC
  'Washington, D.C.':       { x: 492, y: 280 },

  // West Virginia / Virginia border - spread out
  'Harpers Ferry, WV':      { x: 458, y: 252 },
  'Martinsburg, WV':        { x: 448, y: 238 },
  'Shepherdstown, WV':      { x: 453, y: 247 },
  'Charles Town, WV':       { x: 456, y: 249 },
  'Winchester, VA':         { x: 435, y: 264 },
  'Strasburg, VA':          { x: 420, y: 284 },
  'Front Royal, VA':        { x: 432, y: 276 },

  // Virginia - Piedmont & interior
  'Warrenton, VA':          { x: 450, y: 302 },
  'Manassas, VA':           { x: 470, y: 292 },
  'Washington, VA':         { x: 438, y: 294 },
  'Alexandria, VA':         { x: 498, y: 284 },

  // Virginia - Peninsula (spread south)
  'Richmond, VA':           { x: 482, y: 352 },
  'Yorktown, VA':           { x: 525, y: 368 },
  'Hampton, VA':            { x: 540, y: 382 },
  'Fort Monroe, VA':        { x: 548, y: 390 },
  'West Point, VA':         { x: 510, y: 358 },
  "Harrison's Landing, VA": { x: 502, y: 365 },

  // Battle sites
  'Antietam, MD':           { x: 462, y: 240 },
  'Sharpsburg, MD':         { x: 462, y: 240 },
  'Fair Oaks, VA':          { x: 490, y: 348 },
  'Malvern Hill, VA':       { x: 495, y: 360 },
};

// Aliases
function getCoords(locationStr) {
  if (!locationStr) return null;
  if (GEO[locationStr]) return GEO[locationStr];

  const loc = locationStr.toLowerCase();

  if (loc.includes('champlain')) return GEO['Champlain, NY'];
  if (loc.includes('plattsburgh') || loc.includes('plattsburg')) return GEO['Plattsburgh, NY'];

  // West Point - disambiguate NY vs VA
  if (loc.includes('west point')) {
    if (loc.includes(', va') || loc.includes('york river') || loc.includes('camp windfield') || loc.includes('camp winfield')) return GEO['West Point, VA'];
    if (loc.includes('academy') || loc.includes('military') || loc.includes(', ny')) return GEO['West Point, NY'];
    // Default: if author is james, it's NY
    return GEO['West Point, NY'];
  }

  if (loc.includes('ogdensburg') || loc.includes('ogdensburgh') || loc.includes('camp wheeler')) return GEO['Ogdensburg, NY'];
  if (loc.includes('albany')) return GEO['Albany, NY'];

  // Baltimore cluster
  if (loc.includes('baltimore') || loc.includes('camp jackson') || loc.includes('camden station') || loc.includes('camp preston king')) return GEO['Baltimore, MD'];
  if (loc.includes('camp niles') || loc.includes('relay')) return GEO['Relay, MD'];

  // Washington DC vs VA
  if (loc.includes('washington')) {
    if (loc.includes(', va') || loc.includes('rappahannock')) return GEO['Washington, VA'];
    return GEO['Washington, D.C.'];
  }

  // Harpers Ferry / Bolivar Heights
  if (loc.includes('harpers ferry') || loc.includes('harper') || loc.includes('bolivar') || loc.includes('camp gorman') || loc.includes('camp gormon') || loc.includes('maryland heights')) return GEO['Harpers Ferry, WV'];

  if (loc.includes('camp mcclellan')) return GEO['Poolesville, MD'];
  if (loc.includes('poolesville')) return GEO['Poolesville, MD'];
  if (loc.includes('frederick')) return GEO['Frederick, MD'];
  if (loc.includes('winchester')) return GEO['Winchester, VA'];
  if (loc.includes('strausburgh') || loc.includes('strasburg') || loc.includes('strausburg')) return GEO['Strasburg, VA'];
  if (loc.includes('front royal') || loc.includes('fort royal')) return GEO['Front Royal, VA'];
  if (loc.includes('warrenton') || loc.includes('pine mountain')) return GEO['Warrenton, VA'];
  if (loc.includes('manassas') || loc.includes('bull run')) return GEO['Manassas, VA'];

  // Peninsula
  if (loc.includes('fortress monroe') || loc.includes('fort monroe') || loc.includes('camp windfield') || loc.includes('camp winfield')) return GEO['Fort Monroe, VA'];
  if (loc.includes('hampton')) return GEO['Hampton, VA'];
  if (loc.includes('york town') || loc.includes('yorktown')) return GEO['Yorktown, VA'];
  if (loc.includes('richmond') || loc.includes('five miles of richmond')) return GEO['Richmond, VA'];
  if (loc.includes('harrison') || loc.includes('james river')) return GEO["Harrison's Landing, VA"];
  if (loc.includes('antietam') || loc.includes('sharpsburg') || loc.includes('sharpsburgh')) return GEO['Antietam, MD'];
  if (loc.includes('fair oaks') || loc.includes('seven pines')) return GEO['Fair Oaks, VA'];
  if (loc.includes('alexandria')) return GEO['Alexandria, VA'];
  if (loc.includes('onikers')) return GEO['Front Royal, VA'];
  if (loc.includes('goodrich')) return GEO['Strasburg, VA'];
  if (loc.includes('camp alton')) return GEO['West Point, VA'];
  if (loc.includes('rebels camp')) return GEO['Yorktown, VA'];

  // Near patterns
  if (loc.includes('near')) {
    if (loc.includes('richmond')) return GEO['Richmond, VA'];
    if (loc.includes('york')) return GEO['Yorktown, VA'];
    if (loc.includes('harrison')) return GEO["Harrison's Landing, VA"];
    if (loc.includes('fortress') || loc.includes('monroe')) return GEO['Fort Monroe, VA'];
    if (loc.includes('baltimore')) return GEO['Baltimore, MD'];
    if (loc.includes('washington')) return GEO['Washington, D.C.'];
    if (loc.includes('harpers')) return GEO['Harpers Ferry, WV'];
    if (loc.includes('strasburg') || loc.includes('strausburgh')) return GEO['Strasburg, VA'];
    if (loc.includes('warrenton')) return GEO['Warrenton, VA'];
  }

  if (loc.includes('camp in field') || loc.includes('16 miles from hampton')) return { x: 532, y: 375 };
  if (loc.includes('across the potomac') || loc.includes('potomac')) return GEO['Poolesville, MD'];

  return null;
}

const COLORS = {
  henry: '#2D5F8A',
  alexander: '#B8860B',
  james: '#4A7C59',
  charles: '#8B3A3A',
  unknown: '#9B9B9B'
};

const AUTHOR_NAMES = {
  henry: 'Henry',
  alexander: 'Alexander',
  james: 'James',
  charles: 'Charles',
  unknown: 'Unknown'
};

// ============================================================
// PROCESS DATA
// ============================================================
const letters = DATA.letters
  .map(l => {
    const coords = getCoords(l.location);
    return { ...l, coords };
  })
  .filter(l => l.coords !== null)
  .sort((a, b) => a.date.localeCompare(b.date));

const allDates = [...new Set(letters.map(l => l.date))].sort();

const events = DATA.events.map(e => {
  let coords = null;
  if (e.label.includes('Bull Run')) coords = GEO['Manassas, VA'];
  else if (e.label.includes('Yorktown')) coords = GEO['Yorktown, VA'];
  else if (e.label.includes('Fair Oaks')) coords = GEO['Fair Oaks, VA'];
  else if (e.label.includes('Seven Days')) coords = GEO['Richmond, VA'];
  else if (e.label.includes('Malvern Hill')) coords = GEO['Malvern Hill, VA'];
  else if (e.label.includes('Second Bull Run')) coords = GEO['Manassas, VA'];
  else if (e.label.includes('Antietam')) coords = GEO['Antietam, MD'];
  else if (e.label.includes('Baltimore')) coords = GEO['Baltimore, MD'];
  else if (e.label.includes('Harpers Ferry')) coords = GEO['Harpers Ferry, WV'];
  return { ...e, coords };
});

// ============================================================
// BUILD SVG MAP
// ============================================================
const svg = document.getElementById('mapSvg');
const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (parent) parent.appendChild(e);
  return e;
}

// Background
el('rect', { x: 0, y: 0, width: 800, height: 620, fill: '#FAF8F5' }, svg);

// ---- WATER BODIES ----
const waterGroup = el('g', null, svg);

// Atlantic coast
el('path', {
  d: 'M570,170 Q590,180 600,200 Q608,230 605,260 Q600,290 595,320 Q590,350 588,380 Q585,400 580,430 Q575,460 570,500 L550,520 L540,500 L545,440 Q548,400 550,380 Q552,360 555,340 Q557,310 560,280 Q562,250 565,220 Q567,200 570,170 Z',
  fill: '#E2EBF3',
  opacity: 0.35
}, waterGroup);

// Chesapeake Bay
el('path', {
  d: 'M540,250 Q542,270 540,290 Q538,310 536,330 Q534,350 533,370 Q531,385 530,395 L528,385 Q530,365 531,345 Q532,325 534,305 Q535,285 537,265 Q538,255 540,250 Z',
  fill: '#D5E3EF',
  opacity: 0.5
}, waterGroup);

// James River
el('path', {
  d: 'M482,354 Q490,358 500,362 Q510,368 525,378 Q535,385 548,390',
  fill: 'none', stroke: '#C5D5E5', 'stroke-width': 2, opacity: 0.5
}, waterGroup);

// York River
el('path', {
  d: 'M510,358 Q518,362 525,368',
  fill: 'none', stroke: '#C5D5E5', 'stroke-width': 1.5, opacity: 0.4
}, waterGroup);

// Potomac River
el('path', {
  d: 'M448,238 Q458,248 468,258 Q478,265 488,272 Q498,278 508,280 Q520,278 530,272 Q540,266 548,260',
  fill: 'none', stroke: '#C5D5E5', 'stroke-width': 2.5, opacity: 0.45
}, waterGroup);

// Shenandoah River
el('path', {
  d: 'M420,284 Q428,275 435,268 Q442,260 452,254',
  fill: 'none', stroke: '#C5D5E5', 'stroke-width': 1.5, opacity: 0.35
}, waterGroup);

// Hudson River
el('path', {
  d: 'M572,150 Q575,138 578,125 Q580,110 582,95 Q584,80 586,65',
  fill: 'none', stroke: '#C5D5E5', 'stroke-width': 1.5, opacity: 0.45
}, waterGroup);

// Lake Champlain
el('ellipse', {
  cx: 590, cy: 55, rx: 5, ry: 22,
  fill: '#D5E3EF', opacity: 0.5
}, waterGroup);

// ---- STATE OUTLINES ----
const statesGroup = el('g', null, svg);

// New York
el('path', {
  d: 'M460,36 L520,32 L565,36 L598,40 L605,55 L600,95 L590,125 L580,152 L575,168 L565,180 L545,190 L520,190 L450,188 L440,168 L448,128 L455,85 Z',
  class: 'state-outline', fill: '#EAE8E2'
}, statesGroup);

// Pennsylvania
el('path', {
  d: 'M445,188 L520,190 L545,190 L560,200 L560,220 L545,235 L520,240 L490,242 L462,240 L445,235 L435,218 L435,200 Z',
  class: 'state-outline', fill: '#EDEBE6'
}, statesGroup);

// Maryland
el('path', {
  d: 'M445,238 L462,236 L490,240 L520,240 L540,242 L550,252 L548,270 L530,275 L508,282 L490,280 L470,272 L458,262 L448,252 Z',
  class: 'state-outline', fill: '#E8E4DF'
}, statesGroup);

// West Virginia
el('path', {
  d: 'M400,232 L445,238 L448,252 L458,262 L460,272 L450,282 L435,292 L418,298 L405,294 L398,275 L395,255 Z',
  class: 'state-outline', fill: '#EDEBE6'
}, statesGroup);

// Virginia
el('path', {
  d: 'M405,294 L418,298 L435,292 L450,282 L470,272 L492,280 L510,282 L535,275 L555,265 L558,290 L555,320 L550,350 L545,380 L535,400 L510,380 L490,365 L470,350 L450,335 L430,320 L415,310 Z',
  class: 'state-outline', fill: '#EDEBE6'
}, statesGroup);

// North Carolina (edge)
el('path', {
  d: 'M415,385 L535,400 L560,420 L575,450 L545,460 L500,440 L460,420 L430,405 Z',
  class: 'state-outline', fill: '#F0ECE7'
}, statesGroup);

// ---- STATE LABELS ----
const labelsGroup = el('g', null, svg);
[
  { text: 'NEW YORK', x: 520, y: 115 },
  { text: 'PENNSYLVANIA', x: 495, y: 212 },
  { text: 'MD', x: 540, y: 256 },
  { text: 'VIRGINIA', x: 460, y: 330 },
  { text: 'W.VA', x: 415, y: 268 },
  { text: 'N. CAROLINA', x: 490, y: 430 },
].forEach(sl => {
  const t = el('text', {
    x: sl.x, y: sl.y,
    class: 'state-label',
    'font-size': sl.text.length > 4 ? '11' : '9',
    opacity: '0.45'
  }, labelsGroup);
  t.textContent = sl.text;
});

// ---- LOCATION MARKERS ----
const locationsGroup = el('g', null, svg);

const locationMarkers = [
  { name: 'Champlain', key: 'Champlain, NY', isHome: true },
  { name: 'Plattsburgh', key: 'Plattsburgh, NY' },
  { name: 'West Point', key: 'West Point, NY', label: 'West Point (NY)' },
  { name: 'Albany', key: 'Albany, NY' },
  { name: 'Ogdensburg', key: 'Ogdensburg, NY' },
  { name: 'Washington', key: 'Washington, D.C.', label: 'Washington D.C.' },
  { name: 'Baltimore', key: 'Baltimore, MD' },
  { name: 'Harpers Ferry', key: 'Harpers Ferry, WV' },
  { name: 'Poolesville', key: 'Poolesville, MD' },
  { name: 'Winchester', key: 'Winchester, VA' },
  { name: 'Strasburg', key: 'Strasburg, VA' },
  { name: 'Front Royal', key: 'Front Royal, VA' },
  { name: 'Warrenton', key: 'Warrenton, VA' },
  { name: 'Manassas', key: 'Manassas, VA' },
  { name: 'Richmond', key: 'Richmond, VA' },
  { name: 'Yorktown', key: 'Yorktown, VA' },
  { name: 'Hampton', key: 'Hampton, VA' },
  { name: 'Ft. Monroe', key: 'Fort Monroe, VA' },
  { name: 'West Point (VA)', key: 'West Point, VA' },
  { name: "Harrison's Ldg", key: "Harrison's Landing, VA" },
  { name: 'Relay', key: 'Relay, MD' },
  { name: 'Frederick', key: 'Frederick, MD' },
  { name: 'Antietam', key: 'Antietam, MD', isBattle: true },
];

// Label placement offsets to avoid overlap
const labelOffsets = {
  'Champlain, NY': { dx: 0, dy: -14, anchor: 'middle' },
  'Plattsburgh, NY': { dx: 8, dy: 3, anchor: 'start' },
  'West Point, NY': { dx: 8, dy: 3, anchor: 'start' },
  'Albany, NY': { dx: 8, dy: 3, anchor: 'start' },
  'Ogdensburg, NY': { dx: 8, dy: 3, anchor: 'start' },
  'Washington, D.C.': { dx: 8, dy: 4, anchor: 'start' },
  'Baltimore, MD': { dx: 8, dy: 3, anchor: 'start' },
  'Harpers Ferry, WV': { dx: -8, dy: 3, anchor: 'end' },
  'Poolesville, MD': { dx: -8, dy: 3, anchor: 'end' },
  'Winchester, VA': { dx: -8, dy: 3, anchor: 'end' },
  'Strasburg, VA': { dx: -8, dy: 3, anchor: 'end' },
  'Front Royal, VA': { dx: -8, dy: -4, anchor: 'end' },
  'Warrenton, VA': { dx: -8, dy: 3, anchor: 'end' },
  'Manassas, VA': { dx: 8, dy: 3, anchor: 'start' },
  'Richmond, VA': { dx: -8, dy: 3, anchor: 'end' },
  'Yorktown, VA': { dx: 8, dy: 3, anchor: 'start' },
  'Hampton, VA': { dx: 8, dy: 3, anchor: 'start' },
  'Fort Monroe, VA': { dx: 8, dy: 3, anchor: 'start' },
  'West Point, VA': { dx: 8, dy: -4, anchor: 'start' },
  "Harrison's Landing, VA": { dx: -8, dy: 3, anchor: 'end' },
  'Relay, MD': { dx: 8, dy: -4, anchor: 'start' },
  'Frederick, MD': { dx: 8, dy: -4, anchor: 'start' },
  'Antietam, MD': { dx: -8, dy: -4, anchor: 'end' },
};

locationMarkers.forEach(lm => {
  const c = GEO[lm.key];
  if (!c) return;

  if (lm.isHome) {
    // Star icon for home
    const g = el('g', { class: 'home-icon', transform: 'translate(' + c.x + ',' + c.y + ')' }, locationsGroup);
    el('polygon', {
      points: '0,-9 3,-3 9,-3 4,1.5 6,8 0,4.5 -6,8 -4,1.5 -9,-3 -3,-3',
      fill: '#B8860B',
      stroke: '#FFFFFF',
      'stroke-width': 1.2,
      opacity: 0.85
    }, g);
    const t = el('text', {
      x: 0, y: -14,
      class: 'location-label',
      'text-anchor': 'middle',
      'font-size': '9',
      'font-weight': '600',
      fill: '#B8860B'
    }, g);
    t.textContent = 'HOME';
  } else if (lm.isBattle) {
    // Battle ring
    el('circle', {
      cx: c.x, cy: c.y, r: 4.5,
      fill: 'none',
      stroke: '#C44E52',
      'stroke-width': 1.5,
      opacity: 0.6
    }, locationsGroup);
  } else {
    // Regular city dot
    el('circle', {
      cx: c.x, cy: c.y, r: 2.5,
      fill: '#9B9B9B',
      opacity: 0.35
    }, locationsGroup);
  }

  // Label
  if (!lm.isHome) {
    const off = labelOffsets[lm.key] || { dx: 8, dy: 3, anchor: 'start' };
    const t = el('text', {
      x: c.x + off.dx, y: c.y + off.dy,
      class: 'location-label',
      'text-anchor': off.anchor,
      'font-size': '7.5'
    }, locationsGroup);
    t.textContent = lm.label || lm.name;
  }
});

// ---- BATTLE PULSES ----
const pulsesGroup = el('g', null, svg);
const battlePulses = {};

events.forEach(e => {
  if (e.type === 'battle' && e.coords) {
    const circle = el('circle', {
      cx: e.coords.x, cy: e.coords.y,
      r: 8,
      class: 'battle-pulse',
      'data-date': e.date
    }, pulsesGroup);
    battlePulses[e.date] = circle;
  }
});

// ---- TRAIL & DOT LAYERS ----
const trailsGroup = el('g', null, svg);
const dotsGroup = el('g', null, svg);

// ============================================================
// ANIMATION STATE
// ============================================================
let playing = false;
let currentIndex = 0;
let speed = 1500;
let animTimer = null;
let brotherPositions = {};
let brotherTrails = {};
let brotherDots = {};
let brotherTrailPaths = {};

// Initialize brother elements
['henry', 'alexander', 'james', 'charles'].forEach(author => {
  brotherTrails[author] = [];

  // Trail path
  const path = el('path', {
    class: 'trail-line',
    stroke: COLORS[author],
    'stroke-width': 2,
    opacity: 0.25,
    d: ''
  }, trailsGroup);
  brotherTrailPaths[author] = path;

  // Dot group with CSS transition
  const g = el('g', {
    class: 'brother-dot brother-group',
    opacity: 0,
    'data-author': author
  }, dotsGroup);

  // Outer glow
  el('circle', {
    cx: 0, cy: 0, r: 14,
    fill: COLORS[author],
    opacity: 0.1
  }, g);

  // Main circle
  el('circle', {
    cx: 0, cy: 0, r: 8,
    fill: COLORS[author],
    stroke: '#FFFFFF',
    'stroke-width': 2.5
  }, g);

  // Letter initial
  const t = el('text', {
    x: 0, y: 3.5,
    'text-anchor': 'middle',
    'font-family': 'Inter, sans-serif',
    'font-size': '8',
    'font-weight': '600',
    fill: '#FFFFFF',
    'pointer-events': 'none'
  }, g);
  t.textContent = AUTHOR_NAMES[author][0];

  brotherDots[author] = g;

  g.addEventListener('mouseenter', (evt) => showTooltip(evt, author));
  g.addEventListener('mouseleave', hideTooltip);
  g.addEventListener('click', () => showLetterDetail(author));
});

// ============================================================
// EVENT FEED
// ============================================================
const eventFeed = document.getElementById('eventFeed');
events.forEach((e, i) => {
  const card = document.createElement('div');
  card.className = 'event-card';
  card.id = 'event-' + i;
  card.innerHTML = '<div class="date">' + formatDate(e.date) + '</div>' +
    '<div class="title">' + e.label + '</div>' +
    '<span class="type-badge ' + e.type + '">' + e.type + '</span>';
  eventFeed.appendChild(card);
});

// ============================================================
// ANIMATION FUNCTIONS
// ============================================================
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[m - 1] + ' ' + d + ', ' + y;
}

function formatDateLong(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[m - 1] + ' ' + d + ', ' + y;
}

function updateToDate(dateStr) {
  const activeLetters = letters.filter(l => l.date <= dateStr);

  // Latest position per brother
  const latestByAuthor = {};
  activeLetters.forEach(l => {
    if (!latestByAuthor[l.author] || l.date >= latestByAuthor[l.author].date) {
      latestByAuthor[l.author] = l;
    }
  });

  // Build trail and update each brother
  ['henry', 'alexander', 'james', 'charles'].forEach(author => {
    const authorLetters = activeLetters.filter(l => l.author === author);
    const trail = [];
    let prevKey = '';
    authorLetters.forEach(l => {
      const key = l.coords.x + ',' + l.coords.y;
      if (key !== prevKey) {
        trail.push({ x: l.coords.x, y: l.coords.y });
        prevKey = key;
      }
    });
    brotherTrails[author] = trail;

    // Trail path
    if (trail.length > 1) {
      let d = 'M' + trail[0].x + ',' + trail[0].y;
      for (let i = 1; i < trail.length; i++) {
        d += ' L' + trail[i].x + ',' + trail[i].y;
      }
      brotherTrailPaths[author].setAttribute('d', d);
      brotherTrailPaths[author].setAttribute('opacity', '0.25');
    } else {
      brotherTrailPaths[author].setAttribute('d', '');
    }

    // Dot position (CSS transition handles smooth movement)
    const latest = latestByAuthor[author];
    if (latest) {
      brotherDots[author].setAttribute('opacity', 1);
      brotherDots[author].setAttribute('transform', 'translate(' + latest.coords.x + ',' + latest.coords.y + ')');
      brotherPositions[author] = { x: latest.coords.x, y: latest.coords.y, letter: latest };
    } else {
      brotherDots[author].setAttribute('opacity', 0);
      brotherPositions[author] = null;
    }
  });

  // Battle pulses
  Object.entries(battlePulses).forEach(([date, circle]) => {
    if (date <= dateStr) {
      const daysDiff = (new Date(dateStr) - new Date(date)) / 86400000;
      if (daysDiff < 21) {
        circle.classList.add('active');
        circle.style.opacity = 1;
      } else {
        circle.classList.remove('active');
        circle.style.opacity = 0.15;
      }
    } else {
      circle.classList.remove('active');
      circle.style.opacity = 0;
    }
  });

  // Event feed highlights
  events.forEach((e, i) => {
    const card = document.getElementById('event-' + i);
    if (e.date <= dateStr) {
      const daysDiff = (new Date(dateStr) - new Date(e.date)) / 86400000;
      if (daysDiff < 21) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        card.classList.remove('active');
      }
    } else {
      card.classList.remove('active');
    }
  });

  document.getElementById('dateDisplay').textContent = formatDateLong(dateStr);

  const slider = document.getElementById('timelineSlider');
  const idx = allDates.indexOf(dateStr);
  if (idx >= 0) {
    slider.value = (idx / (allDates.length - 1)) * 100;
  }
}

function step() {
  if (currentIndex >= allDates.length) {
    stopPlay();
    return;
  }
  updateToDate(allDates[currentIndex]);
  currentIndex++;
  if (playing) {
    animTimer = setTimeout(step, speed);
  }
}

function togglePlay() {
  if (playing) stopPlay(); else startPlay();
}

function startPlay() {
  playing = true;
  document.getElementById('playBtn').textContent = '\u275A\u275A Pause';
  document.getElementById('playBtn').classList.add('active');
  if (currentIndex >= allDates.length) currentIndex = 0;
  step();
}

function stopPlay() {
  playing = false;
  document.getElementById('playBtn').textContent = '\u25B6 Play';
  document.getElementById('playBtn').classList.remove('active');
  if (animTimer) { clearTimeout(animTimer); animTimer = null; }
}

function setSpeed(val) {
  speed = parseInt(val);
}

function scrubTimeline(val) {
  const wasPlaying = playing;
  if (playing) stopPlay();
  const idx = Math.round((val / 100) * (allDates.length - 1));
  currentIndex = Math.max(0, Math.min(idx, allDates.length - 1));
  updateToDate(allDates[currentIndex]);
  currentIndex++;
}

// ============================================================
// TOOLTIP
// ============================================================
const tooltipEl = document.getElementById('tooltip');

function showTooltip(evt, author) {
  const pos = brotherPositions[author];
  if (!pos || !pos.letter) return;

  const l = pos.letter;
  tooltipEl.innerHTML =
    '<div class="author-name" style="color:' + COLORS[author] + '">' + AUTHOR_NAMES[author] + ' Hubbell</div>' +
    '<div class="location">' + l.location + '</div>' +
    '<div class="letter-info">' + formatDate(l.date) + ' \u2014 To ' + l.recipient + '</div>' +
    (l.sigSummary ? '<div style="font-size:0.7rem;color:#6B6B6B;margin-top:4px;line-height:1.4">' + l.sigSummary.substring(0, 150) + (l.sigSummary.length > 150 ? '...' : '') + '</div>' : '');

  tooltipEl.classList.add('visible');

  const rect = document.getElementById('mapPanel').getBoundingClientRect();
  const svgEl = document.getElementById('mapSvg');
  const pt = svgEl.createSVGPoint();
  pt.x = pos.x;
  pt.y = pos.y;
  const screenPt = pt.matrixTransform(svgEl.getScreenCTM());

  let left = screenPt.x - rect.left + 18;
  let top = screenPt.y - rect.top - 30;

  if (left + 260 > rect.width) left = left - 290;
  if (top < 10) top = 10;

  tooltipEl.style.left = left + 'px';
  tooltipEl.style.top = top + 'px';
}

function hideTooltip() {
  tooltipEl.classList.remove('visible');
}

// ============================================================
// LETTER DETAIL
// ============================================================
function showLetterDetail(author) {
  const pos = brotherPositions[author];
  if (!pos || !pos.letter) return;

  const l = pos.letter;
  const panel = document.getElementById('letterDetail');
  document.getElementById('letterDetailTitle').textContent = AUTHOR_NAMES[author] + ' to ' + l.recipient;
  document.getElementById('letterDetailMeta').textContent = formatDateLong(l.date) + ' \u2014 ' + l.location;

  // Clean up transcription for display
  let excerpt = l.transcription || '(No transcription available)';
  // Skip header lines (date, location)
  const lines = excerpt.split('\\n');
  const bodyStart = lines.findIndex((line, i) => i > 2 && line.trim().length > 20);
  if (bodyStart > 0) excerpt = lines.slice(bodyStart).join('\\n');
  if (excerpt.length > 400) excerpt = excerpt.substring(0, 400) + '...';

  document.getElementById('letterDetailExcerpt').textContent = excerpt;
  panel.classList.add('visible');
}

function closeLetterDetail() {
  document.getElementById('letterDetail').classList.remove('visible');
}

// ============================================================
// COMPASS & DECORATIONS
// ============================================================
const compassGroup = el('g', { transform: 'translate(60, 540)' }, svg);
el('circle', { cx: 0, cy: 0, r: 22, fill: '#FFFFFF', stroke: '#E8E4DF', 'stroke-width': 1, opacity: 0.8 }, compassGroup);
el('polygon', { points: '0,-18 -4,-5 0,-7 4,-5', fill: '#2C2C2C', opacity: 0.6 }, compassGroup);
el('polygon', { points: '0,18 -4,5 0,7 4,5', fill: '#C5C0BA', opacity: 0.4 }, compassGroup);
el('polygon', { points: '-18,0 -5,-4 -7,0 -5,4', fill: '#C5C0BA', opacity: 0.4 }, compassGroup);
el('polygon', { points: '18,0 5,-4 7,0 5,4', fill: '#C5C0BA', opacity: 0.4 }, compassGroup);
const nt = el('text', { x: 0, y: -24, 'text-anchor': 'middle', 'font-family': 'Inter', 'font-size': '9', fill: '#6B6B6B', 'font-weight': '600' }, compassGroup);
nt.textContent = 'N';

// Scale bar
const scaleGroup = el('g', { transform: 'translate(32, 585)' }, svg);
el('line', { x1: 0, y1: 0, x2: 65, y2: 0, stroke: '#9B9B9B', 'stroke-width': 1 }, scaleGroup);
el('line', { x1: 0, y1: -3, x2: 0, y2: 3, stroke: '#9B9B9B', 'stroke-width': 1 }, scaleGroup);
el('line', { x1: 65, y1: -3, x2: 65, y2: 3, stroke: '#9B9B9B', 'stroke-width': 1 }, scaleGroup);
const st = el('text', { x: 32, y: 12, 'text-anchor': 'middle', 'font-family': 'Inter', 'font-size': '7', fill: '#9B9B9B' }, scaleGroup);
st.textContent = '~100 miles';

// Map title
const mapTitle = el('text', {
  x: 400, y: 24,
  'text-anchor': 'middle',
  'font-family': 'Playfair Display, serif',
  'font-size': '13',
  fill: '#9B9B9B',
  'font-weight': '400',
  'font-style': 'italic'
}, svg);
mapTitle.textContent = 'Eastern Theater, 1861\u20131862';

// ============================================================
// INITIALIZE
// ============================================================
updateToDate(allDates[0]);

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight' && !playing) {
    if (currentIndex < allDates.length) {
      updateToDate(allDates[currentIndex]);
      currentIndex++;
    }
  }
  if (e.code === 'ArrowLeft' && !playing) {
    if (currentIndex > 1) {
      currentIndex -= 2;
      updateToDate(allDates[currentIndex]);
      currentIndex++;
    }
  }
});

</script>
</body>
</html>`;

fs.writeFileSync(
  path.join(__dirname, 'viz-map-moves.html'),
  html,
  'utf8'
);
console.log('Written viz-map-moves.html, size:', html.length);
