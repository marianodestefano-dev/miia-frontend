/* c8 ignore start */
/**
 * staff-panel.js — ARQ MIIADT firma 2026-05-12
 * Generate + hire + payroll medicos/preparadores/scouts.
 * Spec IDEA #051 §10 (v3 staff extendido).
 */
'use strict';
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.createStaffPanel = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var STAFF_TYPES = ['medico', 'preparador', 'scout'];
  var QUALITY_TIERS = ['junior', 'senior', 'elite'];

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

  function createStaffPanel(opts) {
    /* c8 ignore start */
    opts = opts || {};
    var fetchPayroll = opts.fetchPayroll || function () { return Promise.resolve({ payroll: 0, staffCount: 0 }); };
    var generateAndHire = opts.generateAndHire || function () { return Promise.resolve({ ok: true }); };
    var getToken = opts.getToken || function () { return Promise.resolve(''); };
    /* c8 ignore stop */

    var state = { payroll: 0, staffCount: 0, scouting: null, loading: false, error: null, lastHire: null };
    var rootEl = el('div', { className: 'staff-panel' });
    var content = el('div', { className: 'staff-content' });
    rootEl.appendChild(content);

    function render() {
      content.innerHTML = '';
      if (state.loading) { content.appendChild(el('div', { className: 'st-loading' }, 'Cargando...')); return; }
      if (state.error) { content.appendChild(el('div', { className: 'st-error' }, state.error)); return; }

      var summary = el('div', { className: 'st-summary' });
      summary.appendChild(el('div', { className: 'st-payroll' }, 'Payroll mensual: ' + state.payroll + ' creditos'));
      summary.appendChild(el('div', { className: 'st-count' }, 'Staff activo: ' + state.staffCount));
      if (state.scouting) {
        summary.appendChild(el('div', { className: 'st-scouting' },
          'Scouting: ' + state.scouting.totalSuggestedPerWeek + ' jugs/sem (' + state.scouting.avgAccuracyPct + '%)'));
      }
      content.appendChild(summary);

      var hireForm = el('div', { className: 'st-hire-form' });
      var typeSel = el('select', { className: 'st-type' });
      STAFF_TYPES.forEach(function (t) {
        var opt = el('option', { value: t }, t);
        typeSel.appendChild(opt);
      });
      var qualitySel = el('select', { className: 'st-quality' });
      QUALITY_TIERS.forEach(function (q) {
        var opt = el('option', { value: q }, q);
        qualitySel.appendChild(opt);
      });
      hireForm.appendChild(typeSel);
      hireForm.appendChild(qualitySel);
      hireForm.appendChild(el('button', { className: 'st-hire-btn', onClick: function () {
        handleHire(typeSel.value, qualitySel.value);
      } }, 'Contratar'));
      content.appendChild(hireForm);

      if (state.lastHire) {
        content.appendChild(el('div', { className: 'st-last-hire' }, 'Contratado: ' + state.lastHire));
      }
    }

    function handleHire(staffType, qualityTier) {
      if (STAFF_TYPES.indexOf(staffType) === -1) { state.error = 'Tipo invalido'; render(); return Promise.resolve(); }
      if (QUALITY_TIERS.indexOf(qualityTier) === -1) { state.error = 'Calidad invalida'; render(); return Promise.resolve(); }
      state.loading = true; state.error = null; render();
      return Promise.resolve(getToken()).then(function (t) { return generateAndHire(staffType, qualityTier, t); })
        .then(function (r) {
          if (r && r.ok === false) { state.error = r.error || 'Error'; state.loading = false; render(); return; }
          state.lastHire = staffType + ' ' + qualityTier;
          state.staffCount += 1;
          state.loading = false; render();
        }).catch(function (e) {
          /* c8 ignore next */
          state.error = e.message || 'Error'; state.loading = false; render();
        });
    }

    function load() {
      state.loading = true; render();
      return Promise.resolve(getToken()).then(function (t) { return fetchPayroll(t); })
        .then(function (data) {
          state.payroll = data && data.payroll ? data.payroll : 0;
          state.staffCount = data && data.staffCount ? data.staffCount : 0;
          state.scouting = data && data.scouting ? data.scouting : null;
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
      _handleHire: handleHire,
      STAFF_TYPES: STAFF_TYPES,
      QUALITY_TIERS: QUALITY_TIERS,
    };
  }

  return createStaffPanel;
/* c8 ignore start */
});
/* c8 ignore stop */
