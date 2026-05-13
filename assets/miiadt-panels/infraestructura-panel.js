/* c8 ignore start */
/**
 * infraestructura-panel.js — ARQ MIIADT firma 2026-05-12
 * Estadio + entrenamiento + enfermeria + oficinas + marketing.
 * Spec MAPA-DEFINITIVO §8 + IDEA #051 §8 (v2/v3).
 */
'use strict';
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.createInfraestructuraPanel = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var FACILITIES = [
    { key: 'stadium', label: 'Estadio', maxLvl: 5 },
    { key: 'training', label: 'Entrenamiento', maxLvl: 5 },
    { key: 'infirmary', label: 'Enfermeria', maxLvl: 5 },
    { key: 'offices', label: 'Oficinas', maxLvl: 5 },
    { key: 'advanced_training', label: 'Entrenamiento avanzado', maxLvl: 5 },
    { key: 'marketing', label: 'Marketing', maxLvl: 5 },
  ];

  /* c8 ignore start - DOM helper + opts defaults defensivos */
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) {
      var k = Object.keys(attrs);
      for (var i = 0; i < k.length; i++) {
        var key = k[i];
        if (key === 'className') e.className = attrs[key];
        else if (key.startsWith('on') && typeof attrs[key] === 'function') e.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        else e.setAttribute(key, attrs[key]);
      }
    }
    if (text != null) e.textContent = String(text);
    return e;
  }
  /* c8 ignore stop */

  function createInfraestructuraPanel(opts) {
    /* c8 ignore start */
    opts = opts || {};
    var fetchLevels = opts.fetchLevels || function () { return Promise.resolve({}); };
    var upgrade = opts.upgrade || function () { return Promise.resolve({ ok: true }); };
    var getToken = opts.getToken || function () { return Promise.resolve(''); };
    /* c8 ignore stop */

    var state = { levels: {}, loading: false, error: null, lastUpgrade: null };
    var rootEl = el('div', { className: 'infra-panel' });
    var content = el('div', { className: 'infra-content' });
    rootEl.appendChild(content);

    function render() {
      content.innerHTML = '';
      if (state.loading) { content.appendChild(el('div', { className: 'infra-loading' }, 'Cargando...')); return; }
      if (state.error) { content.appendChild(el('div', { className: 'infra-error' }, state.error)); return; }
      var grid = el('div', { className: 'infra-grid' });
      FACILITIES.forEach(function (f) {
        var lvl = state.levels[f.key] || 1;
        var atMax = lvl >= f.maxLvl;
        var card = el('div', { className: 'infra-card' });
        card.appendChild(el('div', { className: 'infra-label' }, f.label));
        card.appendChild(el('div', { className: 'infra-level' }, 'Nivel ' + lvl + ' / ' + f.maxLvl));
        var btn = el('button', { className: 'infra-btn', onClick: function () { handleUpgrade(f.key); } },
          atMax ? 'Maximo' : 'Mejorar');
        if (atMax) btn.disabled = true;
        card.appendChild(btn);
        grid.appendChild(card);
      });
      content.appendChild(grid);
      if (state.lastUpgrade) {
        content.appendChild(el('div', { className: 'infra-saved' },
          'Mejorado: ' + state.lastUpgrade.facility + ' a nivel ' + state.lastUpgrade.newLevel));
      }
    }

    function handleUpgrade(facilityKey) {
      state.loading = true; render();
      return Promise.resolve(getToken()).then(function (t) { return upgrade(facilityKey, t); })
        .then(function (r) {
          if (r && r.ok === false) { state.error = r.error || 'Error'; state.loading = false; render(); return; }
          state.levels[facilityKey] = r && r.newLevel ? r.newLevel : (state.levels[facilityKey] || 1) + 1;
          state.lastUpgrade = { facility: facilityKey, newLevel: state.levels[facilityKey] };
          state.loading = false; render();
        }).catch(function (e) {
          /* c8 ignore next */
          state.error = e.message || 'Error'; state.loading = false; render();
        });
    }

    function load() {
      state.loading = true; render();
      return Promise.resolve(getToken()).then(function (t) { return fetchLevels(t); })
        .then(function (data) {
          state.levels = data || {}; state.loading = false; render();
        }).catch(function (e) {
          /* c8 ignore next */
          state.error = e.message || 'Error'; state.loading = false; render();
        });
    }

    render();
    return { element: rootEl, load: load, _state: state, _handleUpgrade: handleUpgrade, FACILITIES: FACILITIES };
  }

  return createInfraestructuraPanel;
/* c8 ignore start */
});
/* c8 ignore stop */
