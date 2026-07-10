/* ============================================================
   _bio-map.js — Shared "Wartime Footprint" map builder.
   Extracted verbatim from the per-brother bio pages so the
   canonical bio view (who-they-were.html stage) can render the
   same Leaflet footprint per person. Aggregates movement rows
   (03-data/map-movements.js) by place, sizes circles by days
   spent, tints battle sites red, and draws the chronological
   path. Returns true when a map was built, false when the
   person has no movement data (e.g. the mother, home front) —
   callers use that to hide the section.
   ============================================================ */
window.HubbellBioMap = (function () {
  var current = null; // last Leaflet map instance — removed before rebuilding

  function build(el, personId, color) {
    if (!window.L || !window.__MAP_MOVEMENTS__ || !el) return false;
    var moves = window.__MAP_MOVEMENTS__.movements.filter(function (m) { return m.brother === personId; });
    if (!moves.length) return false;

    if (current) { try { current.remove(); } catch (e) {} current = null; }

    // Aggregate by placeName
    var places = {};
    moves.forEach(function (m) {
      var key = m.placeName || (m.lat + ',' + m.lon);
      if (!places[key]) places[key] = { lat: m.lat, lon: m.lon, name: m.placeName, days: 0, hasBattle: false, first: m.date, last: m.endDate || m.date };
      var start = new Date(m.date + 'T12:00:00');
      var end = new Date((m.endDate || m.date) + 'T12:00:00');
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      var days = Math.max(1, Math.round((end - start) / 86400000));
      places[key].days += days;
      if (m.hasBattle) places[key].hasBattle = true;
      if (m.date < places[key].first) places[key].first = m.date;
      if ((m.endDate || m.date) > places[key].last) places[key].last = m.endDate || m.date;
    });

    var pts = Object.values(places);
    var maxDays = Math.max.apply(null, pts.map(function (p) { return p.days; }));

    var map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: true
    });
    current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &amp; CARTO',
      maxZoom: 18
    }).addTo(map);

    // Draw movement path (chronological)
    var sorted = moves.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var pathCoords = [];
    var seen = {};
    sorted.forEach(function (m) {
      var key = m.lat + ',' + m.lon;
      if (!seen[key]) {
        pathCoords.push([m.lat, m.lon]);
        seen[key] = true;
      }
    });
    if (pathCoords.length > 1) {
      L.polyline(pathCoords, { color: color, weight: 1.5, opacity: 0.3, dashArray: '4 6' }).addTo(map);
    }

    // Draw circles sized by duration
    pts.forEach(function (p) {
      var r = 6 + Math.sqrt(p.days / maxDays) * 20;
      var fillColor = p.hasBattle ? '#C44E52' : color;
      L.circleMarker([p.lat, p.lon], {
        radius: r,
        fillColor: fillColor,
        fillOpacity: 0.25,
        color: fillColor,
        weight: 1.5,
        opacity: 0.6
      }).bindTooltip(p.name + ' (' + p.days + ' days)', { direction: 'top', offset: [0, -r] }).addTo(map);
    });

    // Fit bounds with padding
    var bounds = L.latLngBounds(pts.map(function (p) { return [p.lat, p.lon]; }));
    map.fitBounds(bounds, { padding: [30, 30] });
    // Containers revealed by a view transition can be measured too early —
    // re-measure once layout has settled so all tiles render.
    setTimeout(function () {
      if (current === map) { map.invalidateSize(); map.fitBounds(bounds, { padding: [30, 30] }); }
    }, 350);
    return true;
  }

  return { build: build };
})();
