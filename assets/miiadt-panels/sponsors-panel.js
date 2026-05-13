/* c8 ignore start */
/**
 * sponsors-panel.js — ARQ MIIADT firma 2026-05-12 21:30 COT
 * Selector de los 8 sponsors firmados Mariano 2026-05-02 §5.
 */
'use strict';
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createSponsorsPanel = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var SPONSORS = [
    { id: 'adaidas',  name: 'Adaidas',  perk: '+30M creditos por temporada' },
    { id: 'niko',     name: 'Niko',     perk: '+25% fans iniciales' },
    { id: 'uver',     name: 'Uver',     perk: '-30% costo estadio' },
    { id: 'rappid',   name: 'Rappid',   perk: '-30% costo entrenamiento' },
    { id: 'coka',     name: 'Coka',     perk: '+20% fans por punto equipo' },
    { id: 'mercadia', name: 'Mercadia', perk: '-20% costo compras jugadores' },
    { id: 'vise',     name: 'Vise',     perk: '+25% recaudacion merch' },
    { id: 'samsang',  name: 'Samsang',  perk: '+5 pts al jugador mas caro' },
  ];

  /* c8 ignore start - DOM helper + opts defaults defensivos */
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) {
      var keys = Object.keys(attrs);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k === 'className') e.className = attrs[k];
        else if (k.startsWith('on') && typeof attrs[k] === 'function') {
          e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else e.setAttribute(k, attrs[k]);
      }
    }
    if (text != null) e.textContent = String(text);
    return e;
  }
  /* c8 ignore stop */

  function createSponsorsPanel(opts) {
    /* c8 ignore start */
    opts = opts || {};
    var fetchCurrent = opts.fetchCurrent || function () { return Promise.resolve(null); };
    var saveSponsor = opts.saveSponsor || function () { return Promise.resolve({ ok: true }); };
    var getToken = opts.getToken || function () { return Promise.resolve(''); };
    /* c8 ignore stop */

    var state = { current: null, loading: false, error: null, savedAt: null };
    var rootEl = el('div', { className: 'sponsors-panel' });
    var content = el('div', { className: 'sponsors-content' });
    rootEl.appendChild(content);

    function render() {
      content.innerHTML = '';
      if (state.loading) { content.appendChild(el('div', { className: 'sp-loading' }, 'Cargando...')); return; }
      if (state.error) { content.appendChild(el('div', { className: 'sp-error' }, state.error)); return; }
      var grid = el('div', { className: 'sponsors-grid' });
      SPONSORS.forEach(function (s) {
        var card = el('div', { className: 'sponsor-card' + (state.current === s.id ? ' selected' : '') });
        card.appendChild(el('div', { className: 'sp-name' }, s.name));
        card.appendChild(el('div', { className: 'sp-perk' }, s.perk));
        var btn = el('button', { className: 'sp-btn', onClick: function () { selectSponsor(s.id); } },
          state.current === s.id ? 'Activo' : 'Elegir');
        if (state.current === s.id) btn.disabled = true;
        card.appendChild(btn);
        grid.appendChild(card);
      });
      content.appendChild(grid);
      if (state.savedAt) {
        content.appendChild(el('div', { className: 'sp-saved' }, 'Sponsor actualizado.'));
      }
    }

    function selectSponsor(sponsorId) {
      state.loading = true; render();
      return Promise.resolve(getToken()).then(function (t) {
        return saveSponsor(sponsorId, t);
      }).then(function (r) {
        if (r && r.ok === false) { state.error = r.error || 'Error al guardar'; state.loading = false; render(); return; }
        state.current = sponsorId;
        state.savedAt = new Date().toISOString();
        state.loading = false;
        render();
      }).catch(function (e) {
        /* c8 ignore next */
        state.error = e.message || 'Error';
        state.loading = false;
        render();
      });
    }

    function load() {
      state.loading = true; render();
      return Promise.resolve(getToken()).then(function (t) { return fetchCurrent(t); })
        .then(function (data) {
          state.current = data && data.sponsorId ? data.sponsorId : null;
          state.loading = false; render();
        }).catch(function (e) {
          /* c8 ignore next */
          state.error = e.message || 'Error'; state.loading = false; render();
        });
    }

    render();
    return { element: rootEl, load: load, _state: state, _selectSponsor: selectSponsor, SPONSORS: SPONSORS };
  }

  return createSponsorsPanel;
/* c8 ignore start */
});
/* c8 ignore stop */
