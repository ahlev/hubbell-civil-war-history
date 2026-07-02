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
    var mobileMQ = window.matchMedia('(max-width: 640px)');
    function update(){
      var m = metrics();
      if (m.overflow <= 8){
        rail.style.display = 'none';
        if (docMode) document.documentElement.classList.remove('hub-rail-live');
        return;   // nothing to scroll → hide
      }
      rail.style.display = 'block';
      // While the custom rail is live on a phone, hide the NATIVE scrollbar —
      // otherwise the page shows two right-edge scrollbars slightly out of step.
      if (docMode) document.documentElement.classList.toggle('hub-rail-live', mobileMQ.matches);
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

    // ── PRESS-TO-JUMP + HELD DRAG (frozen metrics) ─────────────────────────────
    // History: naive thumb-drag jittered on iOS because every pointermove re-read
    // getBoundingClientRect on elements that were themselves moving with the scroll,
    // and iOS momentum scrolling fed back into the loop (see tasks/lessons.md — the
    // interim fix was press-to-jump only). The reliable drag recipe:
    //   1. touch-action:none on the rail (CSS) — the browser never scrolls natively
    //      from this gesture, so there is no momentum to fight;
    //   2. read rail position + metrics EXACTLY ONCE at pointerdown (frozen for the
    //      whole drag — nothing mid-drag ever re-measures layout);
    //   3. move by pointer DELTA from the press point (clientY is viewport-relative
    //      and stable), mapping thumb-travel → scrollTop instantly (smooth suspended).
    // A simple press (no movement) still jumps the page to that spot, as before.
    var dragging = false, dragStartY = 0, dragStartThumbTop = 0, dragM = null;
    rail.addEventListener('pointerdown', function(e){
      var m = metrics();
      if (m.overflow <= 8) return;
      var railTop = rail.getBoundingClientRect().top;    // read ONCE, before any scrolling
      var curThumbTop = Math.max(0, Math.min(m.maxTop, (getScrollTop() / m.overflow) * m.maxTop));
      var y = e.clientY - railTop;
      var onThumb = y >= curThumbTop - 6 && y <= curThumbTop + m.thumbH + 6;
      dragging = true; dragM = m; dragStartY = e.clientY;
      suspendSmooth();
      thumb.classList.add('is-dragging');
      if (onThumb){
        dragStartThumbTop = curThumbTop;                 // grab in place — no jump
      } else {
        // press elsewhere on the rail: jump the thumb under the finger, then drag from there
        dragStartThumbTop = Math.max(0, Math.min(m.maxTop, y - m.thumbH / 2));
        setScrollTop((dragStartThumbTop / m.maxTop) * m.overflow);
      }
      try { rail.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault(); e.stopPropagation();
    });
    rail.addEventListener('pointermove', function(e){
      if (!dragging || !dragM) return;
      var t = Math.max(0, Math.min(dragM.maxTop, dragStartThumbTop + (e.clientY - dragStartY)));
      setScrollTop((t / dragM.maxTop) * dragM.overflow);   // frozen metrics, delta math only
      e.preventDefault();
    });
    function endDrag(){
      if (!dragging) return;
      dragging = false; dragM = null;
      restoreSmooth();
      thumb.classList.remove('is-dragging');
    }
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
    rail.addEventListener('lostpointercapture', endDrag);

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
