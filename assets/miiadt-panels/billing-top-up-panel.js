/* c8 ignore start */
/**
 * billing-top-up-panel.js — ARQ MIIADT D2 wire UI autoridad Wi 2026-05-12.
 * Spec: MAPA-DEFINITIVO §9 — top-up 1 USD = 1M creditos.
 */
'use strict';
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.createBillingTopUpPanel = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var PRESETS_USD = [5, 10, 25, 50];
  var USD_TO_CREDITS = 1000000; // 1 USD = 1M creditos firma §9

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

  function createBillingTopUpPanel(opts) {
    /* c8 ignore start */
    opts = opts || {};
    var fetchBalance = opts.fetchBalance || function () { return Promise.resolve({ balance: 0 }); };
    var topUp = opts.topUp || function () { return Promise.resolve({ ok: true }); };
    var getToken = opts.getToken || function () { return Promise.resolve(''); };
    /* c8 ignore stop */

    var state = { balance: 0, loading: false, error: null, lastTopUp: null };
    var rootEl = el('div', { className: 'topup-panel' });
    var content = el('div', { className: 'topup-content' });
    rootEl.appendChild(content);

    function formatCredits(n) {
      if (typeof n !== 'number') return '0';
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return Math.floor(n / 1000) + 'K';
      return String(n);
    }

    function render() {
      content.innerHTML = '';
      if (state.loading) { content.appendChild(el('div', { className: 'tu-loading' }, 'Cargando...')); return; }
      if (state.error) { content.appendChild(el('div', { className: 'tu-error' }, state.error)); return; }

      var balanceEl = el('div', { className: 'tu-balance' });
      balanceEl.appendChild(el('div', { className: 'tu-balance-label' }, 'Saldo actual'));
      balanceEl.appendChild(el('div', { className: 'tu-balance-amount' }, formatCredits(state.balance) + ' creditos'));
      content.appendChild(balanceEl);

      var presetsEl = el('div', { className: 'tu-presets' });
      PRESETS_USD.forEach(function (usd) {
        var credits = usd * USD_TO_CREDITS;
        var btn = el('button', { className: 'tu-preset-btn', onClick: function () { handleTopUp(usd); } });
        btn.appendChild(el('div', { className: 'tu-preset-usd' }, '$' + usd + ' USD'));
        btn.appendChild(el('div', { className: 'tu-preset-credits' }, formatCredits(credits) + ' creditos'));
        presetsEl.appendChild(btn);
      });
      content.appendChild(presetsEl);

      var customEl = el('div', { className: 'tu-custom' });
      var inp = el('input', { className: 'tu-custom-input', type: 'number', placeholder: 'USD custom (min 1)' });
      customEl.appendChild(inp);
      customEl.appendChild(el('button', { className: 'tu-custom-btn', onClick: function () {
        var n = Number(inp.value);
        handleTopUp(n);
      } }, 'Recargar custom'));
      content.appendChild(customEl);

      if (state.lastTopUp) {
        content.appendChild(el('div', { className: 'tu-last' },
          'Ultima recarga: $' + state.lastTopUp.usd + ' USD = ' + formatCredits(state.lastTopUp.credits) + ' creditos'));
      }
    }

    function handleTopUp(usdAmount) {
      if (typeof usdAmount !== 'number' || !isFinite(usdAmount) || usdAmount < 1) {
        state.error = 'Monto invalido (min $1 USD)';
        render();
        return Promise.resolve();
      }
      state.loading = true; state.error = null; render();
      return Promise.resolve(getToken()).then(function (t) { return topUp(usdAmount, t); })
        .then(function (r) {
          if (r && r.ok === false) { state.error = r.error || 'Error'; state.loading = false; render(); return; }
          var credits = (r && r.credits) || (usdAmount * USD_TO_CREDITS);
          state.balance = (r && r.newBalance != null) ? r.newBalance : (state.balance + credits);
          state.lastTopUp = { usd: usdAmount, credits: credits };
          state.loading = false; render();
        }).catch(function (e) {
          /* c8 ignore next */
          state.error = e.message || 'Error'; state.loading = false; render();
        });
    }

    function load() {
      state.loading = true; render();
      return Promise.resolve(getToken()).then(function (t) { return fetchBalance(t); })
        .then(function (data) {
          state.balance = data && typeof data.balance === 'number' ? data.balance : 0;
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
      _handleTopUp: handleTopUp,
      _formatCredits: formatCredits,
      PRESETS_USD: PRESETS_USD,
      USD_TO_CREDITS: USD_TO_CREDITS,
    };
  }

  return createBillingTopUpPanel;
/* c8 ignore start */
});
/* c8 ignore stop */
