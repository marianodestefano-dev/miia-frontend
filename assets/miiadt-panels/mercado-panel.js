/* c8 ignore start */
/**
 * mercado-panel.js - ARQ-PANEL-3
 *
 * Panel UMD: lista pujas activas, boton pujar, contador tiempo restante.
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createMercadoPanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function el(tag, attrs) {
    var e = document.createElement(tag);
    /* c8 ignore next */
    if (attrs) {
      var keys = Object.keys(attrs);
      for (var ki = 0; ki < keys.length; ki++) {
        var k = keys[ki];
        if (k === 'style' && typeof attrs[k] === 'object') { Object.assign(e.style, attrs[k]); }
        else if (k.startsWith('on') && typeof attrs[k] === 'function') { e.addEventListener(k.slice(2).toLowerCase(), attrs[k]); }
        else if (k === 'className') { e.className = attrs[k]; }
        /* c8 ignore next */
        else { e.setAttribute(k, attrs[k]); }
      }
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      /* c8 ignore next */
      if (c == null) { continue; }
      /* c8 ignore next */
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  function formatTimeLeft(expiresAt) {
    if (!expiresAt) return 'Sin tiempo';
    var diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expirada';
    var hours = Math.floor(diff / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    return hours + 'h ' + mins + 'm';
  }

  function renderBidCard(bid, onBid) {
    var card = el('div', { className: 'mercado-bid-card' });
    var playerEl = el('span', { className: 'mercado-bid-player' });
    playerEl.textContent = bid.playerName || 'Jugador';
    var amountEl = el('span', { className: 'mercado-bid-amount' });
    amountEl.textContent = String(bid.currentBid || 0);
    var timeEl = el('span', { className: 'mercado-bid-time' });
    timeEl.textContent = formatTimeLeft(bid.expiresAt);
    var bId = bid.id;
    var bidBtn = el('button', {
      className: 'mercado-bid-btn',
      onClick: function() { onBid(bId || null); },
    });
    bidBtn.textContent = 'Pujar';
    card.appendChild(playerEl);
    card.appendChild(amountEl);
    card.appendChild(timeEl);
    card.appendChild(bidBtn);
    return card;
  }

  function createMercadoPanel(opts) {
    opts = opts || {};
    var fetchMarket = opts.fetchMarket || function() { return Promise.resolve(null); };
    var getToken    = opts.getToken    || function() { return Promise.resolve(''); };
    var onBid       = opts.onBid       || function() {};

    var state = {
      loading: false,
      error: null,
      market: null,
    };

    var rootEl = el('div', { className: 'mercado-panel' });
    var contentEl = el('div', { className: 'mercado-content' });
    rootEl.appendChild(contentEl);

    function render() {
      contentEl.innerHTML = '';

      if (state.loading) {
        var loadEl = el('div', { className: 'mercado-loading' }, 'Cargando...');
        contentEl.appendChild(loadEl);
        return;
      }

      if (state.error) {
        var errEl = el('div', { className: 'mercado-error' });
        errEl.textContent = state.error;
        contentEl.appendChild(errEl);
        return;
      }

      if (state.market === null) {
        var emptyEl = el('div', { className: 'mercado-empty' });
        emptyEl.textContent = 'Sin mercado disponible';
        contentEl.appendChild(emptyEl);
        return;
      }

      var bids = state.market.bids || [];
      if (bids.length === 0) {
        var emptyMsg = el('p', { className: 'mercado-no-bids' }, 'Sin pujas activas');
        contentEl.appendChild(emptyMsg);
      } else {
        bids.forEach(function(bid) {
          contentEl.appendChild(renderBidCard(bid, onBid));
        });
      }
    }

    function load() {
      state.loading = true;
      state.error = null;
      render();
      return Promise.resolve(getToken()).then(function(token) {
        return fetchMarket(token);
      }).then(function(data) {
        state.market = data;
        state.loading = false;
        render();
      }).catch(function(err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar mercado';
        state.loading = false;
        render();
      });
    }

    render();

    return {
      element: rootEl,
      load: load,
      _state: state,
      _setState: function(s) { Object.assign(state, s); render(); },
    };
  }

  return createMercadoPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
