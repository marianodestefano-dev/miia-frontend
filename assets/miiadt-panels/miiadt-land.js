/* c8 ignore start */
/**
 * miiadt-land.js - ARQ-LAND-1
 *
 * Logica JS para miiadt.html landing: navegacion + scroll.
 * Separado para coverage 100% branches via vitest.
 */
'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.miiadtLand = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function handleNav(action, location) {
    if (!location) return;
    if (action === 'signup') {
      location.href = '/login.html?mode=signup&product=miiadt';
    } else {
      location.href = '/login.html?mode=login&product=miiadt';
    }
  }

  function scrollToSection(sectionId, doc) {
    if (!doc) return;
    var el = doc.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return { handleNav: handleNav, scrollToSection: scrollToSection };
/* c8 ignore start */
}));
/* c8 ignore stop */
