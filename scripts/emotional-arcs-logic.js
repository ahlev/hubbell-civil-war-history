// === CONSTANTS ===
var AUTHORS = {
  henry:     { name: 'Henry',     color: '#2D5F8A' },
  alexander: { name: 'Alexander', color: '#B8860B' },
  james:     { name: 'James',     color: '#4A7C59' },
  charles:   { name: 'Charles',   color: '#8B3A3A' },
  mother:    { name: 'Mother',    color: '#7B5EA7' }
};
var EMOTION_MAP = { low: 1, moderate: 2, high: 3, extreme: 4 };
var EMOTION_LABELS = ['', 'Low', 'Moderate', 'High', 'Extreme'];
var EMOTION_COLORS = { low: '#9B9B9B', moderate: '#6B6B6B', high: '#B8860B', extreme: '#C44E52' };

function parseDate(d) {
  if (d && d.endsWith('-00')) d = d.slice(0, -2) + '15';
  return new Date(d + 'T12:00:00');
}
function formatDate(d) {
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}
function formatDateRange(d) {
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + d.getFullYear();
}

var knownAuthors = Object.keys(AUTHORS);
var letterData = LETTERS.map(function(l, i) {
  return Object.assign({}, l, { _uid: i, dateObj: parseDate(l.date), emotionVal: EMOTION_MAP[l.emotion] || 2 });
});
var eventData = EVENTS.map(function(e) {
  return Object.assign({}, e, { dateObj: parseDate(e.date) });
});

// === CHART DIMENSIONS ===
var margin = { top: 90, right: 40, bottom: 60, left: 62 };
var W = 1100, H = 454;
var iW = W - margin.left - margin.right;
var iH = H - margin.top - margin.bottom;

var FULL_MIN = new Date('1861-06-01T12:00:00');
var FULL_MAX = new Date('1866-01-01T12:00:00');

// === ZOOM STATE ===
var zoomDateMin = null;
var zoomDateMax = null;
var zoomHistory = [];
var brushStartX = null;
var brushRect = null;
var _brushHandlers = { move: null, up: null };

function getXMin() { return zoomDateMin ? parseDate(zoomDateMin) : FULL_MIN; }
function getXMax() { return zoomDateMax ? parseDate(zoomDateMax) : FULL_MAX; }

function xScale(date) {
  var mn = getXMin(), mx = getXMax();
  return margin.left + ((date - mn) / (mx - mn)) * iW;
}
function yScale(val) {
  return margin.top + iH - ((val - 0.5) / (4.5 - 0.5)) * iH;
}

function pushZoomState() { zoomHistory.push({ min: zoomDateMin, max: zoomDateMax }); }

function updateZoomUI() {
  var isZoomed = zoomDateMin !== null || zoomDateMax !== null;
  document.getElementById('resetZoomBtn').style.display = isZoomed ? 'inline-block' : 'none';
  document.getElementById('zoomBackBtn').style.display = zoomHistory.length > 0 ? 'inline-block' : 'none';
  document.getElementById('zoomOutBtn').style.opacity = isZoomed ? '1' : '0.4';
  var mn = getXMin(), mx = getXMax();
  document.getElementById('zoomRange').textContent = formatDateRange(mn) + ' \u2014 ' + formatDateRange(mx);
  var track = document.getElementById('scrollTrack');
  var thumb = document.getElementById('scrollThumb');
  if (isZoomed) {
    track.classList.add('visible');
    var fullRange = FULL_MAX - FULL_MIN;
    var thumbWidth = Math.max(5, ((mx - mn) / fullRange) * 100);
    var thumbLeft = ((mn - FULL_MIN) / fullRange) * 100;
    thumb.style.width = thumbWidth + '%';
    thumb.style.left = thumbLeft + '%';
  } else {
    track.classList.remove('visible');
  }
}

function zoomInCenter() {
  pushZoomState();
  var mn = getXMin().getTime(), mx = getXMax().getTime();
  var shrink = (mx - mn) * 0.15;
  zoomDateMin = new Date(mn + shrink).toISOString().slice(0, 10);
  zoomDateMax = new Date(mx - shrink).toISOString().slice(0, 10);
  renderMainChart(); updateZoomUI();
}
function zoomOutCenter() {
  if (!zoomDateMin && !zoomDateMax) return;
  pushZoomState();
  var mn = getXMin().getTime(), mx = getXMax().getTime();
  var expand = (mx - mn) * 0.15;
  var newMin = Math.max(FULL_MIN.getTime(), mn - expand);
  var newMax = Math.min(FULL_MAX.getTime(), mx + expand);
  if (newMax - newMin >= FULL_MAX - FULL_MIN) { zoomDateMin = null; zoomDateMax = null; }
  else { zoomDateMin = new Date(newMin).toISOString().slice(0, 10); zoomDateMax = new Date(newMax).toISOString().slice(0, 10); }
  renderMainChart(); updateZoomUI();
}
function zoomBack() {
  if (zoomHistory.length === 0) return;
  var prev = zoomHistory.pop();
  zoomDateMin = prev.min; zoomDateMax = prev.max;
  renderMainChart(); updateZoomUI();
}
function resetZoom() {
  if (!zoomDateMin && !zoomDateMax) return;
  pushZoomState();
  zoomDateMin = null; zoomDateMax = null;
  renderMainChart(); updateZoomUI();
}
function panLeft() {
  if (!zoomDateMin && !zoomDateMax) return;
  var mn = getXMin().getTime(), mx = getXMax().getTime();
  var shift = (mx - mn) * 0.25;
  var newMin = Math.max(FULL_MIN.getTime(), mn - shift);
  zoomDateMin = new Date(newMin).toISOString().slice(0, 10);
  zoomDateMax = new Date(newMin + (mx - mn)).toISOString().slice(0, 10);
  renderMainChart(); updateZoomUI();
}
function panRight() {
  if (!zoomDateMin && !zoomDateMax) return;
  var mn = getXMin().getTime(), mx = getXMax().getTime();
  var shift = (mx - mn) * 0.25;
  var newMax = Math.min(FULL_MAX.getTime(), mx + shift);
  zoomDateMax = new Date(newMax).toISOString().slice(0, 10);
  zoomDateMin = new Date(newMax - (mx - mn)).toISOString().slice(0, 10);
  renderMainChart(); updateZoomUI();
}

document.getElementById('zoomInBtn').addEventListener('click', zoomInCenter);
document.getElementById('zoomOutBtn').addEventListener('click', zoomOutCenter);
document.getElementById('zoomBackBtn').addEventListener('click', zoomBack);
document.getElementById('resetZoomBtn').addEventListener('click', resetZoom);

// === VISIBILITY STATE ===
var visible = { henry: true, alexander: true, james: true, charles: true, mother: true };
var selectedPoint = null;

// === LEGEND ===
function buildLegend() {
  var legend = document.getElementById('legend');
  legend.innerHTML = '';
  Object.entries(AUTHORS).forEach(function(entry) {
    var key = entry[0], info = entry[1];
    var count = letterData.filter(function(l) { return l.author === key; }).length;
    var el = document.createElement('div');
    el.className = 'legend-item' + (visible[key] ? '' : ' dimmed');
    el.innerHTML = '<div class="legend-swatch" style="background:' + info.color + '"></div>' +
      '<div class="legend-dot" style="background:' + info.color + '"></div> ' +
      info.name + ' <span style="color:#9B9B9B">(' + count + ')</span>';
    el.dataset.author = key;
    el.addEventListener('click', function() {
      var a = this.dataset.author;
      visible[a] = !visible[a];
      this.classList.toggle('dimmed');
      renderMainChart(); renderFreqChart();
    });
    legend.appendChild(el);
  });
}

// === SVG HELPERS ===
function svgEl(tag, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) Object.keys(attrs).forEach(function(k) { el.setAttribute(k, attrs[k]); });
  return el;
}

function monotonePath(points) {
  if (points.length < 2) return '';
  if (points.length === 2) return 'M' + points[0][0] + ',' + points[0][1] + 'L' + points[1][0] + ',' + points[1][1];
  var n = points.length;
  var dx = [], dy = [], m = [], tg = [];
  for (var i = 0; i < n - 1; i++) { dx.push(points[i+1][0] - points[i][0]); dy.push(points[i+1][1] - points[i][1]); m.push(dy[i] / (dx[i] || 1)); }
  tg.push(m[0]);
  for (var i = 1; i < n - 1; i++) { tg.push(m[i-1] * m[i] <= 0 ? 0 : (m[i-1] + m[i]) / 2); }
  tg.push(m[n-2]);
  for (var i = 0; i < n - 1; i++) {
    if (Math.abs(m[i]) < 1e-12) { tg[i] = 0; tg[i+1] = 0; continue; }
    var a = tg[i] / m[i], b = tg[i+1] / m[i], s = a*a + b*b;
    if (s > 9) { var t = 3 / Math.sqrt(s); tg[i] = t*a*m[i]; tg[i+1] = t*b*m[i]; }
  }
  var d = 'M' + points[0][0] + ',' + points[0][1];
  for (var i = 0; i < n - 1; i++) {
    var dxi = dx[i] / 3;
    d += 'C' + (points[i][0]+dxi).toFixed(1) + ',' + (points[i][1]+tg[i]*dxi).toFixed(1) + ',' +
         (points[i+1][0]-dxi).toFixed(1) + ',' + (points[i+1][1]-tg[i+1]*dxi).toFixed(1) + ',' +
         points[i+1][0].toFixed(1) + ',' + points[i+1][1].toFixed(1);
  }
  return d;
}

// === TOOLTIP ===
var tooltipEl = document.getElementById('tooltip');
function showTooltip(e, letter) {
  var authorColor = (AUTHORS[letter.author] || {}).color || '#2C2C2C';
  var html = '<div class="tt-author" style="color:' + authorColor + '">' + letter.authorName + '</div>';
  html += '<div class="tt-date">' + formatDate(letter.dateObj) + (letter.location ? ' \u2014 ' + letter.location : '') + '</div>';
  var ec = EMOTION_COLORS[letter.emotion] || '#6B6B6B';
  html += '<span class="tt-emotion" style="background:' + ec + '22;color:' + ec + '">' + letter.emotion + '</span>';
  var flags = [];
  if (letter.hasBattle) flags.push('Battle');
  if (letter.hasIllness) flags.push('Illness');
  if (letter.hasDeath) flags.push('Death');
  if (letter.hasWound) flags.push('Wound');
  if (flags.length) html += '<div class="tt-flags">' + flags.map(function(f) { return '<span class="tt-flag">' + f + '</span>'; }).join('') + '</div>';
  if (letter.notes) html += '<div class="tt-notes">' + letter.notes + '</div>';
  tooltipEl.innerHTML = html;
  tooltipEl.classList.add('visible');
  var rect = tooltipEl.getBoundingClientRect();
  var tx = e.clientX + 14, ty = e.clientY - 10;
  if (tx + rect.width > window.innerWidth - 8) tx = e.clientX - rect.width - 14;
  if (ty + rect.height > window.innerHeight - 8) ty = e.clientY - rect.height - 10;
  if (ty < 8) ty = 8;
  tooltipEl.style.left = tx + 'px'; tooltipEl.style.top = ty + 'px';
}
function hideTooltip() { tooltipEl.classList.remove('visible'); }

// === LETTER OVERLAY ===
function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function formatTranscription(text) {
  var escaped = escapeHtml(text);
  var paragraphs = escaped.split(/\n\s*\n/).filter(function(p) { return p.trim(); });
  return paragraphs.map(function(p) { return '<p>' + p.replace(/\n/g, ' ').trim() + '</p>'; }).join('');
}

function openLetterOverlay(letter) {
  closeLetterOverlay();
  selectedPoint = letter;
  var color = (AUTHORS[letter.author] || {}).color || '#2C2C2C';
  var authorName = letter.authorName || letter.author;

  // Badges
  var badges = '';
  var sigClass = (letter.significance === 'critical' || letter.significance === 'major') ? 'sig-' + letter.significance : (letter.significance === 'notable' ? 'sig-notable' : 'sig-other');
  badges += '<span class="detail-badge ' + sigClass + '">' + (letter.significance || 'routine') + '</span>';
  var emoClass = 'emo-' + letter.emotion;
  badges += '<span class="detail-badge ' + emoClass + '">' + letter.emotion + ' emotion</span>';
  if (letter.hasBattle) badges += '<span class="detail-badge event">Battle</span>';
  if (letter.hasIllness) badges += '<span class="detail-badge event">Illness</span>';
  if (letter.hasDeath) badges += '<span class="detail-badge event">Death</span>';
  if (letter.hasWound) badges += '<span class="detail-badge event">Wound</span>';

  // Editorial
  var editorialSection = '';
  if (letter.editorial) {
    editorialSection = '<div class="lo-section-label">Editorial Summary</div><div class="lo-editorial">' + escapeHtml(letter.editorial) + '</div>';
  }

  // Transcription
  var bodySection = '';
  if (letter.transcription) {
    bodySection = '<div class="lo-section-label">Full Transcription</div><div class="lo-body">' + formatTranscription(letter.transcription) + '</div>';
  } else {
    bodySection = '<div class="lo-section-label">Summary</div><div class="lo-body"><p>' + escapeHtml(letter.sigSummary || letter.notes || 'No transcription available.') + '</p></div>';
  }

  var backdrop = document.createElement('div');
  backdrop.className = 'letter-overlay-backdrop';
  backdrop.id = 'letter-overlay-backdrop';
  backdrop.onclick = function(e) { if (e.target === backdrop) closeLetterOverlay(); };
  backdrop.innerHTML = '<div class="letter-overlay-panel">' +
    '<button class="lo-close" onclick="closeLetterOverlay()" title="Close (Esc)">\u2715</button>' +
    '<div class="lo-date" style="color:' + color + '">' + formatDate(letter.dateObj) + '</div>' +
    '<div class="lo-meta">' + authorName + (letter.recipient ? ' \u2192 ' + letter.recipient : '') + (letter.location ? ' \u00b7 ' + letter.location : '') + '</div>' +
    '<div class="lo-badges">' + badges + '</div>' +
    editorialSection +
    bodySection +
    '</div>';
  document.body.appendChild(backdrop);
  renderMainChart();
}

function closeLetterOverlay() {
  var existing = document.getElementById('letter-overlay-backdrop');
  if (existing) existing.remove();
  selectedPoint = null;
  renderMainChart();
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeLetterOverlay(); }
  if (e.key === 'ArrowLeft') panLeft();
  if (e.key === 'ArrowRight') panRight();
});

// === MAIN CHART RENDER ===
function renderMainChart() {
  var container = document.getElementById('mainChart');
  container.innerHTML = '';
  var curXMin = getXMin(), curXMax = getXMax();
  var svg = svgEl('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, style: 'overflow:visible;' });
  svg._xMin = curXMin; svg._xMax = curXMax;

  // Grid + Y labels
  for (var v = 1; v <= 4; v++) {
    var y = yScale(v);
    svg.appendChild(svgEl('line', { x1: margin.left, y1: y, x2: W - margin.right, y2: y, stroke: '#F0ECE7', 'stroke-width': 1 }));
    var txt = svgEl('text', { x: margin.left - 10, y: y + 4, fill: '#757575', 'font-size': '11', 'text-anchor': 'end' });
    txt.textContent = EMOTION_LABELS[v]; svg.appendChild(txt);
  }
  var yLabel = svgEl('text', { x: 16, y: margin.top + iH/2, fill: '#757575', 'font-size': '11', 'text-anchor': 'middle', transform: 'rotate(-90, 16, ' + (margin.top + iH/2) + ')' });
  yLabel.textContent = 'Emotional Intensity'; svg.appendChild(yLabel);

  // X axis ticks — adaptive density
  var dayRange = (curXMax - curXMin) / (1000*60*60*24);
  var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var tickInterval = dayRange > 365*4 ? 6 : dayRange > 365*2 ? 3 : 1;
  var cur = new Date(curXMin.getFullYear(), curXMin.getMonth(), 1);
  var monthEnd = new Date(curXMax.getFullYear(), curXMax.getMonth() + 2, 1);
  while (cur < monthEnd) {
    var x = xScale(cur);
    if (x >= margin.left - 1 && x <= W - margin.right + 1) {
      var moIdx = cur.getMonth();
      var showLabel = (moIdx % tickInterval === 0) || moIdx === 0;
      svg.appendChild(svgEl('line', { x1: x, y1: margin.top, x2: x, y2: margin.top + iH + 6, stroke: '#F0ECE7', 'stroke-width': moIdx === 0 ? 1.5 : 0.5 }));
      if (showLabel) {
        var label = monthNames[moIdx] + (moIdx === 0 || moIdx === 6 ? ' ' + cur.getFullYear() : '');
        if (cur <= new Date(curXMin.getFullYear(), curXMin.getMonth() + 1, 1)) label = monthNames[moIdx] + ' ' + cur.getFullYear();
        var lbl = svgEl('text', { x: x, y: margin.top + iH + 22, fill: '#757575', 'font-size': '10', 'text-anchor': 'middle' });
        lbl.textContent = label; svg.appendChild(lbl);
      }
    }
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  // Year dividers
  for (var yr = 1862; yr <= 1871; yr++) {
    var yx = xScale(new Date(yr + '-01-01T12:00:00'));
    if (yx > margin.left && yx < W - margin.right)
      svg.appendChild(svgEl('line', { x1: yx, y1: margin.top - 4, x2: yx, y2: margin.top + iH, stroke: '#D8D4CF', 'stroke-width': 1.5 }));
  }

  // Events
  var visibleEvents = [];
  eventData.forEach(function(ev) {
    var ex = xScale(ev.dateObj);
    if (ex >= margin.left && ex <= W - margin.right) visibleEvents.push({ ev: ev, ex: ex });
  });
  visibleEvents.forEach(function(ve, vi) {
    var col = ve.ev.type === 'battle' ? '#C44E52' : '#B8860B';
    svg.appendChild(svgEl('line', { x1: ve.ex, y1: margin.top - 8, x2: ve.ex, y2: margin.top + iH, stroke: col, 'stroke-width': 1, 'stroke-dasharray': '4,3', opacity: '0.45' }));
    var level = 0, usedLevels = {};
    for (var vj = vi - 1; vj >= 0; vj--) { if (ve.ex - visibleEvents[vj].ex < 80) usedLevels[visibleEvents[vj]._level] = true; }
    while (usedLevels[level]) level++;
    ve._level = level;
    var yOff = margin.top - 4 - level * 12;
    var evTxt = svgEl('text', { x: ve.ex + 3, y: yOff, fill: col, 'font-size': '8.5', 'text-anchor': 'start', opacity: '0.8', transform: 'rotate(-32, ' + (ve.ex+3) + ', ' + yOff + ')' });
    evTxt.textContent = ve.ev.label; svg.appendChild(evTxt);
  });

  // Brush overlay (transparent rect for drag-to-zoom)
  var brushOverlay = svgEl('rect', { x: margin.left, y: margin.top, width: iW, height: iH, fill: 'transparent', style: 'cursor:crosshair;' });
  svg.appendChild(brushOverlay);

  // Per-author lines and points
  knownAuthors.forEach(function(author) {
    var info = AUTHORS[author];
    if (!visible[author]) return;
    var pts = letterData.filter(function(l) { return l.author === author; }).sort(function(a,b) { return a.dateObj - b.dateObj; });
    if (pts.length === 0) return;
    // Filter to visible range with padding for path continuity
    var visPts = pts.filter(function(p) { var x = xScale(p.dateObj); return x >= margin.left - 30 && x <= W - margin.right + 30; });
    if (visPts.length === 0) return;

    var coords = visPts.map(function(p, idx) {
      var baseX = xScale(p.dateObj), baseY = yScale(p.emotionVal);
      var sameCount = 0, sameTotal = 0;
      for (var j = 0; j < visPts.length; j++) { if (visPts[j].date === p.date && visPts[j].emotionVal === p.emotionVal) { sameTotal++; if (j < idx) sameCount++; } }
      if (sameTotal > 1) baseX += (sameCount - (sameTotal-1)/2) * 8;
      return [baseX, baseY];
    });

    // Smooth curve
    if (coords.length >= 2) svg.appendChild(svgEl('path', { d: monotonePath(coords), fill: 'none', stroke: info.color, 'stroke-width': '2.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: '0.8' }));

    // Diamond markers for flagged letters
    visPts.forEach(function(p, pi) {
      if (!(p.hasBattle || p.hasIllness || p.hasDeath || p.hasWound)) return;
      var cx = coords[pi][0], cy = coords[pi][1];
      if (cx < margin.left || cx > W - margin.right) return;
      var s = 5;
      svg.appendChild(svgEl('path', { d: 'M'+cx+','+(cy-s)+'L'+(cx+s)+','+cy+'L'+cx+','+(cy+s)+'L'+(cx-s)+','+cy+'Z', fill: p.hasBattle ? '#C44E52' : '#B8860B', opacity: '0.55' }));
    });

    // Interactive circles
    visPts.forEach(function(p, pi) {
      var cx = coords[pi][0], cy = coords[pi][1];
      if (cx < margin.left || cx > W - margin.right) return;
      var isSel = selectedPoint && selectedPoint._uid === p._uid;
      var circle = svgEl('circle', { cx: cx, cy: cy, r: isSel ? 7 : 5, fill: '#FFFFFF', stroke: info.color, 'stroke-width': isSel ? 3 : 2, style: 'cursor:pointer;' });
      circle.addEventListener('mouseenter', function(e) { this.setAttribute('r','7'); this.setAttribute('stroke-width','3'); showTooltip(e, p); });
      circle.addEventListener('mousemove', function(e) { showTooltip(e, p); });
      circle.addEventListener('mouseleave', function() { if (!(selectedPoint && selectedPoint._uid === p._uid)) { this.setAttribute('r','5'); this.setAttribute('stroke-width','2'); } hideTooltip(); });
      circle.addEventListener('click', function() { openLetterOverlay(p); });
      svg.appendChild(circle);
    });

    // Annotations at key inflection points
    var annotated = 0, maxAnn = 3;
    var candidates = visPts.map(function(p,idx){return{p:p,idx:idx};})
      .filter(function(c){ var cx=coords[c.idx][0]; return cx>=margin.left && cx<=W-margin.right && ((c.p.emotionVal>=3 && c.p.significance==='major') || c.p.emotionVal===4); })
      .sort(function(a,b){ return b.p.emotionVal - a.p.emotionVal; });
    candidates.forEach(function(ac) {
      if (annotated >= maxAnn) return;
      var acx = coords[ac.idx][0], acy = coords[ac.idx][1];
      var lbl = ac.p.sigSummary ? ac.p.sigSummary.substring(0, 50) : '';
      if (!lbl) return;
      if (lbl.length >= 50) lbl = lbl.substring(0, lbl.lastIndexOf(' ')) + '...';
      var above = annotated % 2 === 0;
      var lineY = above ? acy - 18 : acy + 18;
      var labelY = above ? lineY - 4 : lineY + 12;
      svg.appendChild(svgEl('line', { x1: acx, y1: acy + (above ? -8 : 8), x2: acx, y2: lineY, stroke: info.color, 'stroke-width': 0.8, opacity: 0.5, 'stroke-dasharray': '2,2' }));
      var annText = svgEl('text', { x: acx, y: labelY, 'text-anchor': 'middle', 'font-size': '7.5', fill: info.color, opacity: 0.75, style: 'pointer-events:none;' });
      annText.textContent = lbl; svg.appendChild(annText);
      annotated++;
    });
  });

  container.appendChild(svg);

  // === BRUSH (drag-to-zoom) ===
  if (_brushHandlers.move) document.removeEventListener('mousemove', _brushHandlers.move);
  if (_brushHandlers.up) document.removeEventListener('mouseup', _brushHandlers.up);

  function getSvgX(clientX) {
    var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    return (clientX - r.left) / (r.width / vb.width);
  }
  function svgXToDate(svgX) {
    var mn = svg._xMin.getTime(), mx = svg._xMax.getTime();
    return new Date(mn + ((svgX - margin.left) / iW) * (mx - mn)).toISOString().slice(0, 10);
  }

  brushOverlay.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return;
    brushStartX = getSvgX(e.clientX);
    brushRect = svgEl('rect', { 'class': 'brush-rect', x: brushStartX, y: margin.top, width: 0, height: iH });
    svg.appendChild(brushRect);
    e.preventDefault();
  });

  _brushHandlers.move = function(e) {
    if (brushStartX === null || !brushRect) return;
    var cx = getSvgX(e.clientX);
    var x1 = Math.min(brushStartX, cx), x2 = Math.max(brushStartX, cx);
    brushRect.setAttribute('x', Math.max(margin.left, x1));
    brushRect.setAttribute('width', Math.min(x2, W - margin.right) - Math.max(margin.left, x1));
  };
  _brushHandlers.up = function(e) {
    if (brushStartX === null) return;
    var endX = getSvgX(e.clientX);
    var x1 = Math.max(margin.left, Math.min(brushStartX, endX));
    var x2 = Math.min(W - margin.right, Math.max(brushStartX, endX));
    brushStartX = null;
    if (brushRect) { brushRect.remove(); brushRect = null; }
    if (x2 - x1 > 20) {
      pushZoomState();
      zoomDateMin = svgXToDate(x1); zoomDateMax = svgXToDate(x2);
      renderMainChart(); updateZoomUI();
    }
  };
  document.addEventListener('mousemove', _brushHandlers.move);
  document.addEventListener('mouseup', _brushHandlers.up);
}

// === FREQUENCY CHART ===
function renderFreqChart() {
  var container = document.getElementById('freqChart');
  container.innerHTML = '';
  var fH = 180, fMargin = { top: 16, right: 30, bottom: 36, left: 62 };
  var fIW = W - fMargin.left - fMargin.right, fIH = fH - fMargin.top - fMargin.bottom;

  var buckets = {};
  var cur = new Date(FULL_MIN);
  while (cur < FULL_MAX) {
    var key = cur.getFullYear() + '-' + String(cur.getMonth()+1).padStart(2,'0');
    var b = {}; knownAuthors.forEach(function(a){b[a]=0;}); buckets[key] = b;
    cur = new Date(cur.getFullYear(), cur.getMonth()+1, 1);
  }
  letterData.forEach(function(l) {
    var key = l.dateObj.getFullYear() + '-' + String(l.dateObj.getMonth()+1).padStart(2,'0');
    if (buckets[key] && buckets[key][l.author] !== undefined) buckets[key][l.author]++;
  });

  var keys = Object.keys(buckets).sort();
  var maxCount = 0;
  keys.forEach(function(k) { Object.values(buckets[k]).forEach(function(v){ if(v>maxCount)maxCount=v; }); });
  if (maxCount < 1) maxCount = 1;

  var svg = svgEl('svg', { width: W, height: fH, viewBox: '0 0 ' + W + ' ' + fH });
  var step = Math.max(1, Math.ceil(maxCount/5));
  for (var v = 0; v <= maxCount; v += step) {
    var y = fMargin.top + fIH - (v/maxCount)*fIH;
    svg.appendChild(svgEl('line', { x1: fMargin.left, y1: y, x2: W-fMargin.right, y2: y, stroke: '#F0ECE7', 'stroke-width': '0.5' }));
    var txt = svgEl('text', { x: fMargin.left-10, y: y+4, fill: '#757575', 'font-size': '10', 'text-anchor': 'end' });
    txt.textContent = v; svg.appendChild(txt);
  }

  var barGroupW = fIW / keys.length;
  var barW = Math.min(barGroupW * 0.16, 8);
  var nA = knownAuthors.length;
  var monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  keys.forEach(function(k, i) {
    var gx = fMargin.left + i*barGroupW + barGroupW/2;
    knownAuthors.forEach(function(author, ai) {
      if (!visible[author]) return;
      var count = buckets[k][author];
      if (count === 0) return;
      var bh = (count/maxCount)*fIH;
      var bx = gx + (ai - (nA-1)/2) * (barW+1);
      svg.appendChild(svgEl('rect', { x: bx-barW/2, y: fMargin.top+fIH-bh, width: barW, height: bh, fill: AUTHORS[author].color, rx: '1.5', opacity: '0.75' }));
    });
    var parts = k.split('-'), mo = parseInt(parts[1]), yr = parts[0];
    if (mo === 1 || mo === 7) {
      var label = monthNames[mo] + ' ' + yr;
      var lbl = svgEl('text', { x: gx, y: fH-6, fill: '#757575', 'font-size': '7', 'text-anchor': 'middle' });
      lbl.textContent = label; svg.appendChild(lbl);
    }
  });
  container.appendChild(svg);
}

// === INIT ===
buildLegend();
renderMainChart();
renderFreqChart();
updateZoomUI();
