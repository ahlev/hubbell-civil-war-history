/* ============================================================================
   _scrollrail.js — sleek, tap-and-draggable mobile scroll rail (site-wide)

   Self-mounting. On a mobile page it appends a fixed right-rail scrollbar that
   reflects the document's scroll position and lets the user drag (or flick) the
   thumb to scroll. Pairs with _scrollrail.css. Desktop: CSS keeps it hidden.

   Default target is the document scroller (window scroll — what every full page
   uses). The reader's own container-bound rail (in reader.html) is separate and
   unaffected; this module deliberately does not touch it.

   Public hook: window.HubbellScrollRail.mount(opts?) — opts.scroller lets a page
   bind the rail to a specific overflow container instead of the document.
   ============================================================================ */
(function(){
  if (window.HubbellScrollRail) return;

  function mount(opts){
    opts = opts || {};
    // body/document scroll: read position from scrollingElement, listen on window
    var docMode  = !opts.scroller;
    var scroller = opts.scroller || document.scrollingElement || document.documentElement;
    var host     = opts.host || document.body;
    if (!host) return null;
    if (host.querySelector(':scope > .hub-scrollrail')) return null;   // mount once per host

    var rail  = document.createElement('div'); rail.className  = 'hub-scrollrail';
    var thumb = document.createElement('div'); thumb.className = 'hub-scrollthumb';
    rail.appendChild(thumb); host.appendChild(rail);

    function viewport(){ return docMode ? window.innerHeight : scroller.clientHeight; }

    // Inset = height of the top-docked sticky/fixed navbar, so the rail starts BELOW it.
    // Measured from offsetHeight (LAYOUT height — immune to the scroll-time transforms that
    // make getBoundingClientRect jitter, which was bouncing the thumb up into the nav). Cached
    // and recomputed only on resize, never per scroll frame.
    var _inset = 0;
    function measureInset(){
      if (typeof opts.topInset === 'number'){ _inset = opts.topInset; return; }
      if (!docMode){ _inset = 0; return; }
      var vw = window.innerWidth, max = 0;
      document.querySelectorAll('nav, header, .site-nav, #site-nav, [data-rail-clear]').forEach(function(el){
        var cs = getComputedStyle(el);
        if (cs.position !== 'fixed' && cs.position !== 'sticky') return;
        var r = el.getBoundingClientRect();
        var h = el.offsetHeight;
        if (h > 8 && r.width > vw * 0.6 && r.top <= h + 1) max = Math.max(max, h);   // top-docked, ~full-width
      });
      _inset = max;
    }

    function metrics(){
      var vh = viewport();
      var sh = scroller.scrollHeight;
      var railH = Math.max(40, vh - _inset);             // track is the viewport BELOW the nav
      var thumbH = Math.max(48, railH * (vh / sh));
      return { vh:vh, inset:_inset, sh:sh, overflow: sh - vh, railH:railH, thumbH:thumbH, maxTop: railH - thumbH };
    }
    // While dragging we add html.hub-dragging, whose CSS forces scroll-behavior:auto
    // and scroll-snap-type:none (!important) on html+body — so no smooth-scroll easing
    // or snap points fight the drag. Applied globally so it covers every page's own rules.
    function suspendSmooth(){ document.documentElement.classList.add('hub-dragging'); }
    function restoreSmooth(){ document.documentElement.classList.remove('hub-dragging'); }

    function getScrollTop(){ return docMode ? (scroller.scrollTop || window.pageYOffset || 0) : scroller.scrollTop; }
    function setScrollTop(v){
      // INSTANT scroll while dragging. Pages set scroll-behavior:smooth, and the
      // per-call behavior:'auto' override isn't reliably honored — so we force the
      // element's scroll-behavior to auto for the duration of the drag (see suspendSmooth).
      if (docMode) window.scrollTo(0, v);
      else scroller.scrollTop = v;
    }

    // The thumb is a position INDICATOR, kept in sync with the real scroll position.
    function update(){
      var m = metrics();
      if (m.overflow <= 8){ rail.style.display = 'none'; return; }   // nothing to scroll → hide
      rail.style.display = 'block';
      rail.style.top = m.inset + 'px';     // start below the navbar
      rail.style.height = m.railH + 'px';
      var top = m.overflow > 0 ? (getScrollTop() / m.overflow) * m.maxTop : 0;
      thumb.style.height = m.thumbH + 'px';
      thumb.style.transform = 'translateY(' + Math.max(0, Math.min(m.maxTop, top)) + 'px)';
    }

    function remeasure(){ measureInset(); update(); }
    (docMode ? window : scroller).addEventListener('scroll', update, { passive:true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('orientationchange', remeasure);
    if (window.ResizeObserver){ try{ new ResizeObserver(update).observe(docMode ? document.body : scroller); }catch(e){} }

    // ── PRESS-TO-JUMP (robust on iOS) ──────────────────────────────────────────
    // Continuous thumb-drag is unwinnable on iOS document scroll: it reports the held
    // pointer in DOCUMENT space (drifts by the scroll) AND runs its own momentum scroll,
    // so any drag forms a feedback loop. Instead: press anywhere on the rail to JUMP the
    // page to that spot. The pointer is read EXACTLY ONCE, before any scrolling happens,
    // so there is no loop to build — bulletproof on every device. (See tasks/lessons.md.)
    function jumpToClientY(clientY){
      var m = metrics();
      if (m.overflow <= 8) return;
      var railTop = rail.getBoundingClientRect().top;
      var thumbTop = Math.max(0, Math.min(m.maxTop, clientY - railTop - m.thumbH / 2));  // center thumb under finger
      var target = (thumbTop / m.maxTop) * m.overflow;
      thumb.classList.add('is-dragging');                       // brief press feedback
      try { window.scrollTo({ top: target, left: 0, behavior: 'smooth' }); }
      catch (e) { setScrollTop(target); }
    }
    rail.addEventListener('pointerdown', function(e){
      jumpToClientY(e.clientY);
      e.preventDefault(); e.stopPropagation();
    });
    function clearPress(){ thumb.classList.remove('is-dragging'); }
    rail.addEventListener('pointerup', clearPress);
    rail.addEventListener('pointercancel', clearPress);
    rail.addEventListener('pointerleave', clearPress);

    measureInset();
    update();
    // a sticky navbar can settle its height a frame or two after load — re-measure shortly after
    setTimeout(remeasure, 250);
    return { update: update, el: rail };
  }

  function autoInit(){ mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
  else autoInit();

  window.HubbellScrollRail = { mount: mount };
})();
