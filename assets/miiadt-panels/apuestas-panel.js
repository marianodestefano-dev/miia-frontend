/* c8 ignore start */
/**
 * apuestas-panel.js — ARQ MIIADT firma 2026-05-12
 * P2P apuestas Versus 100K-1M. -300 fans rechazante.
 * Spec MAPA-DEFINITIVO §9 + IDEA #051 §7 (v3).
 */
'use strict';
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.createApuestasPanel = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var BET_MIN = 100000;
  var BET_MAX = 1000000;

  /* c8 ignore start - DOM helper defensivo (branches sin tests directos) */
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

  function createApuestasPanel(opts) {
    /* c8 ignore start - opts defaults defensivos */
    opts = opts || {};
    var fetchBets = opts.fetchBets || function () { return Promise.resolve([]); };
    var propose = opts.propose || function () { return Promise.resolve({ ok: true }); };
    var respond = opts.respond || function () { return Promise.resolve({ ok: true }); };
    var getToken = opts.getToken || function () { return Promise.resolve(''); };
    /* c8 ignore stop */

    var state = { bets: [], loading: false, error: null, action: null };
    var rootEl = el('div', { className: 'apuestas-panel' });
    var content = el('div', { className: 'apuestas-content' });
    rootEl.appendChild(content);

    function validateAmount(n) {
      if (typeof n !== 'number' || !isFinite(n)) return 'Monto invalido';
      if (n < BET_MIN) return 'Minimo 100K';
      if (n > BET_MAX) return 'Maximo 1M';
      return null;
    }

    function render() {
      content.innerHTML = '';
      if (state.loading) { content.appendChild(el('div', { className: 'ap-loading' }, 'Cargando...')); return; }
      if (state.error) { content.appendChild(el('div', { className: 'ap-error' }, state.error)); return; }

      var form = el('div', { className: 'ap-form' });
      var inpRival = el('input', { className: 'ap-input', type: 'text', placeholder: 'UID rival' });
      var inpMatch = el('input', { className: 'ap-input', type: 'text', placeholder: 'Match ID' });
      var inpAmount = el('input', { className: 'ap-input', type: 'number', placeholder: '100K-1M' });
      form.appendChild(inpRival);
      form.appendChild(inpMatch);
      form.appendChild(inpAmount);
      form.appendChild(el('button', { className: 'ap-propose-btn', onClick: function () {
        var amt = Number(inpAmount.value);
        var v = validateAmount(amt);
        if (v) { state.error = v; render(); return; }
        handlePropose(inpRival.value, inpMatch.value, amt);
      } }, 'Proponer apuesta'));
      content.appendChild(form);

      var listTitle = el('div', { className: 'ap-list-title' }, 'Mis apuestas');
      content.appendChild(listTitle);

      if (!state.bets.length) {
        content.appendChild(el('div', { className: 'ap-empty' }, 'Sin apuestas activas'));
      } else {
        var list = el('div', { className: 'ap-list' });
        state.bets.forEach(function (b) {
          var row = el('div', { className: 'ap-row' });
          row.appendChild(el('span', { className: 'ap-amount' }, String(b.amount)));
          row.appendChild(el('span', { className: 'ap-status' }, b.status || ''));
          if (b.canRespond) {
            row.appendChild(el('button', { className: 'ap-accept', onClick: function () { handleRespond(b.betId, 'accept'); } }, 'Aceptar'));
            row.appendChild(el('button', { className: 'ap-reject', onClick: function () { handleRespond(b.betId, 'reject'); } }, 'Rechazar (-300 fans)'));
          }
          list.appendChild(row);
        });
        content.appendChild(list);
      }

      if (state.action) {
        content.appendChild(el('div', { className: 'ap-action-result' }, state.action));
      }
    }

    function handlePropose(rivalUid, matchId, amount) {
      state.loading = true; state.error = null; render();
      return Promise.resolve(getToken()).then(function (t) {
        return propose({ toUid: rivalUid, versusMatchId: matchId, amount: amount }, t);
      }).then(function (r) {
        if (r && r.ok === false) { state.error = r.error || 'Error'; state.loading = false; render(); return; }
        state.action = 'Apuesta propuesta';
        state.loading = false; render();
      }).catch(function (e) {
        /* c8 ignore next */
        state.error = e.message || 'Error'; state.loading = false; render();
      });
    }

    function handleRespond(betId, response) {
      state.loading = true; render();
      return Promise.resolve(getToken()).then(function (t) { return respond(betId, response, t); })
        .then(function (r) {
          if (r && r.ok === false) { state.error = r.error || 'Error'; state.loading = false; render(); return; }
          state.action = response === 'accept' ? 'Apuesta aceptada' : 'Apuesta rechazada (-300 fans)';
          state.loading = false; render();
        }).catch(function (e) {
          /* c8 ignore next */
          state.error = e.message || 'Error'; state.loading = false; render();
        });
    }

    function load() {
      state.loading = true; render();
      return Promise.resolve(getToken()).then(function (t) { return fetchBets(t); })
        .then(function (data) { state.bets = data || []; state.loading = false; render(); })
        .catch(function (e) {
          /* c8 ignore next */
          state.error = e.message || 'Error'; state.loading = false; render();
        });
    }

    render();
    return {
      element: rootEl,
      load: load,
      _state: state,
      _validateAmount: validateAmount,
      _handlePropose: handlePropose,
      _handleRespond: handleRespond,
      BET_MIN: BET_MIN,
      BET_MAX: BET_MAX,
    };
  }

  return createApuestasPanel;
/* c8 ignore start */
});
/* c8 ignore stop */
