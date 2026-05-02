/* c8 ignore start */
/**
 * game-detail-panel.js - TEC-LUDOMIIA-MIGRAR-19.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/games/[id]/page.tsx (Next.js, deprecado).
 *
 * Muestra detalle de un juego: nombre, descripcion, reglas, expansiones.
 *
 * Uso:
 *   const panel = createGameDetailPanel({
 *     fetchGame: async (id, token) => game|null,
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     onStartSession: (gameId) => {},
 *     onBack: () => {},
 *   });
 *   panel.load('game-id');
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createGameDetailPanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function el(tag, attrs, ...children) {
    var e = document.createElement(tag);
    /* c8 ignore next */
    if (attrs) {
      for (var k of Object.keys(attrs)) {
        if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
        else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === 'className') e.className = attrs[k];
        /* c8 ignore next */
        else e.setAttribute(k, attrs[k]);
      }
    }
    for (var c of children) {
      /* c8 ignore next */
      if (c == null) continue;
      /* c8 ignore next */
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  function createGameDetailPanel(opts) {
    opts = opts || {};
    var fetchGame = opts.fetchGame || (async () => null);
    var getToken = opts.getToken || (async () => '');
    var onStartSession = opts.onStartSession || function () {};
    var onBack = opts.onBack || function () {};

    var state = {
      game: null,
      loading: false,
      error: null,
    };

    var root = el('div', { className: 'game-detail-panel', style: { maxWidth: '800px', margin: '0 auto' } });

    var backBtn = el('button', { className: 'btn-ghost back-btn', style: { marginBottom: '20px' }, onClick: function () { onBack(); } });
    backBtn.textContent = '← Volver';
    root.appendChild(backBtn);

    var bodyEl = el('div', { className: 'game-detail-body' });
    root.appendChild(bodyEl);

    function render() {
      bodyEl.innerHTML = '';

      if (state.loading) {
        var loadEl = el('div', { className: 'loading-state', style: { padding: '40px', textAlign: 'center' } }, 'Cargando juego...');
        bodyEl.appendChild(loadEl);
        return;
      }

      if (state.error) {
        var errEl = el('div', { className: 'error-state', style: { padding: '40px', textAlign: 'center' } }, state.error);
        bodyEl.appendChild(errEl);
        return;
      }

      if (!state.game) {
        var notFoundEl = el('div', { className: 'not-found-state', style: { padding: '40px', textAlign: 'center' } }, 'Juego no encontrado.');
        bodyEl.appendChild(notFoundEl);
        return;
      }

      var game = state.game;

      var titleEl = el('h1', { className: 'game-detail-title', style: { fontSize: '28px', fontWeight: '900', marginBottom: '16px' } }, game.name || '');
      bodyEl.appendChild(titleEl);

      if (game.category || (game.minPlayers != null && game.maxPlayers != null)) {
        var metaEl = el('div', { className: 'game-detail-meta', style: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' } });
        if (game.category) {
          metaEl.appendChild(el('span', { className: 'badge badge-cyan' }, game.category));
        }
        if (game.minPlayers != null && game.maxPlayers != null) {
          metaEl.appendChild(el('span', { className: 'badge' }, game.minPlayers + '–' + game.maxPlayers + ' jugadores'));
        }
        bodyEl.appendChild(metaEl);
      }

      if (game.description) {
        var descEl = el('p', { className: 'game-detail-desc', style: { fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' } });
        descEl.textContent = game.description;
        bodyEl.appendChild(descEl);
      }

      if (game.rules) {
        var rulesSection = el('section', { className: 'game-rules-section' });
        var rulesTitle = el('h2', { style: { fontSize: '18px', fontWeight: '700', marginBottom: '12px' } }, 'Reglas');
        var rulesEl = el('div', { className: 'game-rules' });
        rulesEl.textContent = game.rules;
        rulesSection.appendChild(rulesTitle);
        rulesSection.appendChild(rulesEl);
        bodyEl.appendChild(rulesSection);
      }

      if (game.expansions && game.expansions.length > 0) {
        var expSection = el('section', { className: 'game-expansions-section', style: { marginTop: '24px' } });
        var expTitle = el('h2', { style: { fontSize: '18px', fontWeight: '700', marginBottom: '12px' } }, 'Expansiones');
        var expList = el('ul', { className: 'expansions-list', style: { listStyle: 'none', padding: '0' } });
        game.expansions.forEach(function (exp) {
          var item = el('li', { className: 'expansion-item', style: { marginBottom: '8px', padding: '12px', borderRadius: '8px' } });
          var expName = el('strong', {}, exp.name || '');
          item.appendChild(expName);
          if (exp.description) {
            var expDesc = document.createTextNode(' — ' + exp.description);
            item.appendChild(expDesc);
          }
          expList.appendChild(item);
        });
        expSection.appendChild(expTitle);
        expSection.appendChild(expList);
        bodyEl.appendChild(expSection);
      }

      var ctaSection = el('section', { className: 'game-cta-section', style: { marginTop: '32px', padding: '24px', borderRadius: '12px' } });
      var ctaTitle = el('h2', { style: { fontSize: '18px', fontWeight: '700', marginBottom: '16px' } }, 'Iniciar sesion');
      var startBtn = el('button', { className: 'btn-primary game-start-btn', onClick: function () { onStartSession(game.id); } });
      startBtn.textContent = '🎲 Iniciar partida';
      ctaSection.appendChild(ctaTitle);
      ctaSection.appendChild(startBtn);
      bodyEl.appendChild(ctaSection);
    }

    async function load(gameId) {
      state.loading = true;
      state.error = null;
      state.game = null;
      render();
      try {
        var token = await getToken();
        var game = await fetchGame(gameId, token);
        state.game = game;
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore start */
        state.error = err.message || 'Error al cargar juego';
        state.loading = false;
        render();
        /* c8 ignore stop */
      }
    }

    render();

    return {
      element: root,
      load,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
    };
  }

  return createGameDetailPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
