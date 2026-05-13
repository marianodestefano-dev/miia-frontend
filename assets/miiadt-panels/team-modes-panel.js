/* c8 ignore start */
/**
 * team-modes-panel.js — ARQ MIIADT D2 wire UI autoridad Wi 2026-05-12.
 * Spec: MAPA-DEFINITIVO §2 — max 2 modos abiertos: local | internacional | amigos.
 */
'use strict';
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.createTeamModesPanel = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var VALID_MODES = ['local', 'internacional', 'amigos'];
  var MAX_ACTIVE_MODES = 2;

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

  function createTeamModesPanel(opts) {
    /* c8 ignore start */
    opts = opts || {};
    var fetchModes = opts.fetchModes || function () { return Promise.resolve({ activeModes: [] }); };
    var activateMode = opts.activateMode || function () { return Promise.resolve({ ok: true }); };
    var getToken = opts.getToken || function () { return Promise.resolve(''); };
    /* c8 ignore stop */

    var state = { activeModes: [], loading: false, error: null, lastActivated: null };
    var rootEl = el('div', { className: 'team-modes-panel' });
    var content = el('div', { className: 'tm-content' });
    rootEl.appendChild(content);

    function render() {
      content.innerHTML = '';
      if (state.loading) { content.appendChild(el('div', { className: 'tm-loading' }, 'Cargando...')); return; }
      if (state.error) { content.appendChild(el('div', { className: 'tm-error' }, state.error)); return; }

      var header = el('div', { className: 'tm-header' });
      var slotsLeft = Math.max(0, MAX_ACTIVE_MODES - state.activeModes.length);
      header.appendChild(el('div', { className: 'tm-active-count' },
        'Modos activos: ' + state.activeModes.length + ' / ' + MAX_ACTIVE_MODES + ' (' + slotsLeft + ' libre' + (slotsLeft === 1 ? '' : 's') + ')'));
      content.appendChild(header);

      if (state.activeModes.length > 0) {
        var listEl = el('div', { className: 'tm-active-list' });
        state.activeModes.forEach(function (m) {
          var modeData = typeof m === 'string' ? { mode: m } : m;
          var row = el('div', { className: 'tm-active-row' });
          row.appendChild(el('span', { className: 'tm-mode-name' }, modeData.mode));
          if (modeData.countryCode) {
            row.appendChild(el('span', { className: 'tm-mode-country' }, modeData.countryCode));
          }
          listEl.appendChild(row);
        });
        content.appendChild(listEl);
      }

      if (slotsLeft > 0) {
        var form = el('div', { className: 'tm-activate-form' });
        var sel = el('select', { className: 'tm-mode-select' });
        VALID_MODES.forEach(function (mode) {
          var active = state.activeModes.some(function (m) {
            return (typeof m === 'string' ? m : m.mode) === mode;
          });
          if (!active) {
            sel.appendChild(el('option', { value: mode }, mode));
          }
        });
        form.appendChild(sel);

        var countryInput = el('input', { className: 'tm-country', type: 'text', placeholder: 'AR / BR / MX (solo local)' });
        form.appendChild(countryInput);

        form.appendChild(el('button', { className: 'tm-activate-btn', onClick: function () {
          handleActivate(sel.value, countryInput.value);
        } }, 'Activar modo'));
        content.appendChild(form);
      }

      if (state.lastActivated) {
        content.appendChild(el('div', { className: 'tm-last-activated' }, 'Modo activado: ' + state.lastActivated));
      }
    }

    function handleActivate(mode, countryCode) {
      if (VALID_MODES.indexOf(mode) === -1) { state.error = 'Modo invalido'; render(); return Promise.resolve(); }
      if (mode === 'local' && !countryCode) { state.error = 'Liga Local requiere country code'; render(); return Promise.resolve(); }
      state.loading = true; state.error = null; render();
      return Promise.resolve(getToken()).then(function (t) {
        return activateMode({ mode: mode, countryCode: countryCode || null }, t);
      }).then(function (r) {
        if (r && r.ok === false) { state.error = r.error || 'Error'; state.loading = false; render(); return; }
        state.activeModes.push({ mode: mode, countryCode: countryCode || null });
        state.lastActivated = mode + (countryCode ? ' (' + countryCode + ')' : '');
        state.loading = false; render();
      }).catch(function (e) {
        /* c8 ignore next */
        state.error = e.message || 'Error'; state.loading = false; render();
      });
    }

    function load() {
      state.loading = true; render();
      return Promise.resolve(getToken()).then(function (t) { return fetchModes(t); })
        .then(function (data) {
          state.activeModes = data && Array.isArray(data.activeModes) ? data.activeModes : [];
          state.loading = false; render();
        }).catch(function (e) {
          /* c8 ignore next */
          state.error = e.message || 'Error'; state.loading = false; render();
        });
    }

    render();
    return {
      element: rootEl,
      load: load,
      _state: state,
      _handleActivate: handleActivate,
      VALID_MODES: VALID_MODES,
      MAX_ACTIVE_MODES: MAX_ACTIVE_MODES,
    };
  }

  return createTeamModesPanel;
/* c8 ignore start */
});
/* c8 ignore stop */
