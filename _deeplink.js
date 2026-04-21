/* ───────────────────────────────────────────────────────────
   _deeplink.js — Shared deep-linking & share-URL module
   Hubbell Civil War Letters Project
   ─────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ── State ──────────────────────────────────────────────── */
  var _stateReader  = null;   // fn() → { key: value, … }
  var _stateApplier = null;   // fn(params) → restore view
  var _historyEnabled = false;

  /* ── URL helpers ────────────────────────────────────────── */
  function read() {
    var params = new URLSearchParams(window.location.search);
    var obj = {};
    params.forEach(function (v, k) { obj[k] = v; });
    return obj;
  }

  /** Replace/push current URL with new params object.
   *  Keys with null/undefined values are removed.
   *  options.replace  → use replaceState (default false → pushState)
   */
  function update(params, options) {
    var opts = options || {};
    var sp = new URLSearchParams();
    Object.keys(params).forEach(function (k) {
      if (params[k] != null && params[k] !== '') sp.set(k, params[k]);
    });
    var qs = sp.toString();
    var url = window.location.pathname + (qs ? '?' + qs : '');
    if (opts.replace) {
      window.history.replaceState({}, '', url);
    } else {
      window.history.pushState({}, '', url);
    }
  }

  /** Set a single param (pushState). */
  function set(key, val) {
    var p = read();
    p[key] = val;
    update(p);
  }

  /** Remove a single param (pushState). */
  function remove(key) {
    var p = read();
    delete p[key];
    update(p);
  }

  /** Build the full share URL from the registered state reader. */
  function buildShareUrl() {
    if (!_stateReader) return window.location.href;
    var state = _stateReader();
    var sp = new URLSearchParams();
    Object.keys(state).forEach(function (k) {
      if (state[k] != null && state[k] !== '') sp.set(k, state[k]);
    });
    var qs = sp.toString();
    return window.location.origin + window.location.pathname + (qs ? '?' + qs : '');
  }

  /** Copy the share URL to clipboard and show toast. */
  function copyShareUrl() {
    var url = buildShareUrl();
    navigator.clipboard.writeText(url).then(function () {
      showToast('Link copied!');
    }, function () {
      // Fallback for older browsers / non-HTTPS
      var ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('Link copied!'); }
      catch (e) { showToast('Could not copy link'); }
      document.body.removeChild(ta);
    });
  }

  /* ── Toast ──────────────────────────────────────────────── */
  function showToast(msg) {
    var existing = document.getElementById('dl-toast');
    if (existing) existing.remove();

    var el = document.createElement('div');
    el.id = 'dl-toast';
    el.textContent = msg;
    document.body.appendChild(el);

    // trigger reflow then animate in
    void el.offsetWidth;
    el.classList.add('dl-toast-visible');

    setTimeout(function () {
      el.classList.remove('dl-toast-visible');
      setTimeout(function () { el.remove(); }, 400);
    }, 2000);
  }

  /* ── Share Button (injected into navbar) ────────────────── */
  function injectShareButton() {
    // Inject CSS once
    if (!document.getElementById('dl-styles')) {
      var style = document.createElement('style');
      style.id = 'dl-styles';
      style.textContent =
        /* Share button — fixed bottom-right circle */
        '.dl-share-btn{' +
          'position:fixed;bottom:24px;right:24px;z-index:9000;' +
          'width:42px;height:42px;border-radius:50%;' +
          'background:var(--bg-elev,#fff);border:1px solid rgba(0,0,0,0.1);' +
          'cursor:pointer;padding:0;' +
          'display:flex;align-items:center;justify-content:center;' +
          'box-shadow:0 3px 12px rgba(0,0,0,0.16),0 1px 3px rgba(0,0,0,0.08);' +
          'color:var(--ink-2,#6B6B6B);transition:all .25s cubic-bezier(.4,0,.2,1);' +
          'font-family:inherit;' +
        '}' +
        '.dl-share-btn:hover{' +
          'color:#fff;background:var(--accent,#B8860B);border-color:var(--accent,#B8860B);' +
          'box-shadow:0 6px 20px rgba(184,134,11,0.35),0 2px 6px rgba(0,0,0,0.1);' +
          'transform:translateY(-2px) scale(1.08);' +
        '}' +
        '.dl-share-btn:active{transform:translateY(0) scale(0.95);}' +
        '.dl-share-btn svg{width:18px;height:18px;fill:currentColor;}' +
        '.dl-share-btn span{display:none;}' +

        /* Toast */
        '#dl-toast{' +
          'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);' +
          'background:#2d2a23;color:#e8d5b7;padding:10px 24px;border-radius:8px;' +
          'font-size:14px;font-family:inherit;z-index:100000;' +
          'opacity:0;transition:opacity .3s,transform .3s;' +
          'pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.4);' +
          'border:1px solid rgba(232,213,183,.15);' +
        '}' +
        '#dl-toast.dl-toast-visible{opacity:1;transform:translateX(-50%) translateY(0);}' +

        /* Modal share button */
        '.dl-modal-share{' +
          'background:none;border:1px solid rgba(232,213,183,.2);border-radius:6px;' +
          'cursor:pointer;padding:4px 10px;font-size:13px;color:#b0a89a;' +
          'transition:color .2s,border-color .2s,background .2s;' +
          'display:inline-flex;align-items:center;gap:4px;' +
          'font-family:inherit;vertical-align:middle;margin-left:6px;' +
        '}' +
        '.dl-modal-share:hover{color:#e8d5b7;border-color:rgba(232,213,183,.4);background:rgba(232,213,183,.08);}' +
        '.dl-modal-share svg{width:14px;height:14px;fill:currentColor;}';
      document.head.appendChild(style);
    }

    function tryInject() {
      // Don't inject twice
      if (document.querySelector('.dl-share-btn')) return;

      var btn = document.createElement('button');
      btn.className = 'dl-share-btn';
      btn.title = 'Copy share link';
      btn.innerHTML =
        '<svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 ' +
        '12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 ' +
        '18 8a3 3 0 1 0-3-3c0 .24.04.47.09.7L8.04 9.81A2.99 2.99 0 0 0 6 9a3 ' +
        '3 0 1 0 0 6c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a2.88 ' +
        '2.88 0 0 0 2.92 2.88 2.88 2.88 0 0 0 2.88-2.88A2.88 2.88 0 0 0 18 16.08z"/></svg>' +
        '<span>Share</span>';
      btn.onclick = function (e) {
        e.preventDefault();
        copyShareUrl();
      };

      document.body.appendChild(btn);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryInject);
    } else {
      tryInject();
    }
  }

  /* ── Modal Share Button ────────────────────────────────── */
  /** Copy a URL with ?letter=ID for the current page. */
  function copyLetterUrl(letterId) {
    var sp = new URLSearchParams();
    sp.set('letter', letterId);
    var url = window.location.origin + window.location.pathname + '?' + sp.toString();
    navigator.clipboard.writeText(url).then(function () {
      showToast('Letter link copied!');
    }, function () {
      var ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('Letter link copied!'); }
      catch (e) { showToast('Could not copy link'); }
      document.body.removeChild(ta);
    });
  }

  /** Returns an HTML string for a share button inside a modal.
   *  letterId — the LTR-… id to encode in the URL.
   */
  function letterShareBtn(letterId) {
    return '<button class="dl-modal-share" onclick="HubbellDeepLink.copyLetterUrl(\'' +
      letterId.replace(/'/g, "\\'") + '\')" title="Copy link to this letter">' +
      '<svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 ' +
      '12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 ' +
      '18 8a3 3 0 1 0-3-3c0 .24.04.47.09.7L8.04 9.81A2.99 2.99 0 0 0 6 9a3 ' +
      '3 0 1 0 0 6c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a2.88 ' +
      '2.88 0 0 0 2.92 2.88 2.88 2.88 0 0 0 2.88-2.88A2.88 2.88 0 0 0 18 16.08z"/></svg>' +
      'Share</button>';
  }

  /* ── Registration ───────────────────────────────────────── */
  function registerStateReader(fn) {
    _stateReader = fn;
  }

  function registerStateApplier(fn) {
    _stateApplier = fn;
  }

  /* ── History (popstate) ─────────────────────────────────── */
  function enableHistory() {
    if (_historyEnabled) return;
    _historyEnabled = true;
    window.addEventListener('popstate', function () {
      if (_stateApplier) {
        _stateApplier(read());
      }
    });
  }

  /* ── Apply on load ──────────────────────────────────────── */
  /** Call after registering applier — reads URL params and restores state. */
  function applyOnLoad() {
    var params = read();
    var hasParams = Object.keys(params).length > 0;
    if (hasParams && _stateApplier) {
      _stateApplier(params);
    }
  }

  /* ── Public API ─────────────────────────────────────────── */
  window.HubbellDeepLink = {
    read:                read,
    update:              update,
    set:                 set,
    remove:              remove,
    buildShareUrl:       buildShareUrl,
    copyShareUrl:        copyShareUrl,
    copyLetterUrl:       copyLetterUrl,
    letterShareBtn:      letterShareBtn,
    showToast:           showToast,
    injectShareButton:   injectShareButton,
    registerStateReader: registerStateReader,
    registerStateApplier:registerStateApplier,
    enableHistory:       enableHistory,
    applyOnLoad:         applyOnLoad
  };
})();
