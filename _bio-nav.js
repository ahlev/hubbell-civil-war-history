/* _bio-nav.js — Left navigation sidebar for bio pages
   Dynamically builds a sticky sidebar from .chapter / .silence elements.
   Requires: _bio.css sidebar styles loaded.

   Exposes window.HubbellBioNav.build(narrativeEl) so the SAME builder can run on a
   narrative injected after load (e.g. the "Who They Were" inline full-bio view) —
   not just the document's own narrative on page load. Idempotent per narrative. */

(function () {
  'use strict';

  function buildBioNav(narrative) {
    if (!narrative) return;
    if (narrative.dataset.bioNavBuilt === '1') return;   // build once per narrative

    var sections = narrative.querySelectorAll('.chapter, .silence');
    if (!sections.length) return;
    narrative.dataset.bioNavBuilt = '1';

    // --- Assign IDs to each section ---
    var chIdx = 0, silIdx = 0;
    sections.forEach(function (el) {
      if (el.classList.contains('silence')) {
        el.id = el.id || ('silence-' + silIdx++);
      } else {
        el.id = el.id || ('ch-' + chIdx++);
      }
    });

    // --- Build sidebar data: extract title + year ---
    var items = [];
    var lastYear = null;
    sections.forEach(function (el) {
      var title, year;
      var h2 = el.querySelector('h2');
      title = h2 ? h2.textContent.trim() : '';
      if (el.classList.contains('silence')) {
        year = lastYear;
      } else {
        var dateEl = el.querySelector('.ch-date');
        if (dateEl) {
          var m = dateEl.textContent.match(/\b(1[89]\d{2})\b/);
          year = m ? m[1] : lastYear;
        } else {
          year = lastYear;
        }
      }
      if (year) lastYear = year;
      items.push({ id: el.id, title: title, year: year || '—', isSilence: el.classList.contains('silence'), el: el });
    });

    // --- Create sidebar DOM ---
    var sidebar = document.createElement('nav');
    sidebar.className = 'bio-sidebar';
    sidebar.setAttribute('aria-label', 'Chapter navigation');

    var currentYear = null;
    var isClickScrolling = false;

    function setActive(targetId) {
      var activeLink = null;
      var allLinks = sidebar.querySelectorAll('.bio-sidebar-link');
      var allYearHeadings = sidebar.querySelectorAll('.bio-sidebar-year');
      allLinks.forEach(function (l) {
        var isActive = l.dataset.target === targetId;
        l.classList.toggle('active', isActive);
        if (isActive) activeLink = l;
      });
      var activeYear = activeLink ? activeLink.dataset.year : null;
      allYearHeadings.forEach(function (y) { y.classList.toggle('active', y.textContent === activeYear); });
      if (activeLink && !isClickScrolling && !document.documentElement.classList.contains('hub-dragging')) {
        activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    items.forEach(function (item) {
      if (item.year !== currentYear) {
        currentYear = item.year;
        var yearDiv = document.createElement('div');
        yearDiv.className = 'bio-sidebar-year';
        yearDiv.textContent = currentYear;
        sidebar.appendChild(yearDiv);
      }
      var link = document.createElement('a');
      link.className = 'bio-sidebar-link' + (item.isSilence ? ' silence-link' : '');
      link.textContent = item.title;
      link.title = item.title;
      link.href = '#' + item.id;
      link.dataset.target = item.id;
      link.dataset.year = item.year;
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var target = narrative.querySelector('#' + item.id) || document.getElementById(item.id);
        if (target) {
          isClickScrolling = true;
          setActive(item.id);
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(function () { isClickScrolling = false; }, 600);
        }
      });
      sidebar.appendChild(link);
    });

    // --- Wrap narrative in flex layout ---
    var wrapper = document.createElement('div');
    wrapper.className = 'bio-nav-layout';
    narrative.parentNode.insertBefore(wrapper, narrative);
    wrapper.appendChild(sidebar);
    wrapper.appendChild(narrative);

    // --- Scroll tracking via IntersectionObserver ---
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-10% 0px -70% 0px', threshold: 0 });
    sections.forEach(function (el) { observer.observe(el); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildBioNav(document.querySelector('.narrative'));
  });

  window.HubbellBioNav = { build: buildBioNav };
})();
