/* c8 ignore start */
/**
 * library-panel.js - TEC-LUDOMIIA-MIGRAR-16.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/library/page.tsx (Next.js, deprecado).
 *
 * Catalogo de juegos: busqueda, filtro por tipo, grid de cards.
 *
 * Uso:
 *   const panel = createLibraryPanel({
 *     fetchGames: async (token) => [],
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     isOwner: false,
 *     onSelectGame: (game) => {},
 *     onSetupGame: (game) => {},
 *     onAddGame: () => {},
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createLibraryPanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var GAME_TYPES = ['Todos', 'competitivo', 'cooperativo', 'solitario'];

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

  function createLibraryPanel(opts) {
    opts = opts || {};
    var fetchGames = opts.fetchGames || (async () => []);
    var getToken = opts.getToken || (async () => '');
    var isOwner = !!opts.isOwner;
    var onSelectGame = opts.onSelectGame || function () {};
    var onSetupGame = opts.onSetupGame || function () {};
    var onAddGame = opts.onAddGame || function () {};

    var state = {
      games: [],
      loading: true,
      error: null,
      search: '',
      typeFilter: 'Todos',
    };

    var root = el('div', { style: { maxWidth: '1200px', margin: '0 auto' } });

    var headerEl = el('div', {
      className: 'library-header',
      style: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
    });

    var searchInput = el('input', {
      className: 'input library-search',
      style: { flex: '1', minWidth: '200px' },
    });
    searchInput.setAttribute('placeholder', 'Buscar juego...');
    searchInput.addEventListener('input', function (e) {
      state.search = e.target.value;
      renderGrid();
    });

    var filtersEl = el('div', { className: 'type-filters', style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } });
    GAME_TYPES.forEach(function (type) {
      var btn = el('button', {
        className: state.typeFilter === type ? 'btn-primary btn-sm type-btn' : 'btn-ghost btn-sm type-btn',
        onClick: function () {
          state.typeFilter = type;
          renderFilters();
          renderGrid();
        },
      });
      btn.textContent = type;
      btn.setAttribute('data-type', type);
      filtersEl.appendChild(btn);
    });

    headerEl.appendChild(searchInput);
    headerEl.appendChild(filtersEl);
    root.appendChild(headerEl);

    var countEl = el('p', { className: 'library-count', style: { fontSize: '13px', marginBottom: '20px' } });
    countEl.textContent = 'Cargando...';
    root.appendChild(countEl);

    var gridEl = el('div', { className: 'library-grid', style: { display: 'grid', gap: '16px', marginBottom: '80px' } });
    root.appendChild(gridEl);

    if (isOwner) {
      var fabBtn = el('button', { className: 'btn-primary library-fab', onClick: function () { onAddGame(); } });
      fabBtn.textContent = '➕ Agregar juego';
      root.appendChild(fabBtn);
    }

    function filterGames() {
      return state.games.filter(function (g) {
        var matchSearch = !state.search || (g.name || '').toLowerCase().includes(state.search.toLowerCase());
        var matchType = state.typeFilter === 'Todos' || g.type === state.typeFilter;
        return matchSearch && matchType;
      });
    }

    function renderFilters() {
      var btns = filtersEl.querySelectorAll('.type-btn');
      btns.forEach(function (btn) {
        var t = btn.getAttribute('data-type');
        btn.className = t === state.typeFilter ? 'btn-primary btn-sm type-btn' : 'btn-ghost btn-sm type-btn';
      });
    }

    function renderCard(game) {
      var card = el('div', {
        className: 'game-card',
        style: { display: 'flex', flexDirection: 'column', cursor: 'pointer' },
        onClick: function () { onSelectGame(game); },
      });

      var bar = el('div', { className: 'game-card-bar', style: { height: '6px', borderRadius: '4px 4px 0 0', marginBottom: '14px' } });

      var infoEl = el('div', { style: { flex: '1' } });

      var nameRow = el('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' } });
      var nameEl = el('h3', { style: { fontWeight: '700', fontSize: '15px', lineHeight: '1.3' } }, game.name || '');

      nameRow.appendChild(nameEl);
      if (game.type) {
        var typeBadge = el('span', { className: 'badge badge-cyan game-type-badge', style: { marginLeft: '8px', flexShrink: '0', fontSize: '10px' } }, game.type);
        nameRow.appendChild(typeBadge);
      }

      if (game.minPlayers != null) {
        var playersEl = el('p', { className: 'game-players', style: { fontSize: '12px', marginBottom: '4px' } });
        var playersText = game.minPlayers + '';
        if (game.maxPlayers != null && game.maxPlayers !== game.minPlayers) {
          playersText += '-' + game.maxPlayers;
        }
        playersText += ' jugadores';
        if (game.avgDuration) playersText += ' · ' + game.avgDuration + ' min';
        playersEl.textContent = playersText;
        infoEl.appendChild(nameRow);
        infoEl.appendChild(playersEl);
      } else {
        infoEl.appendChild(nameRow);
      }

      if (game.description) {
        var descEl = el('p', { className: 'game-desc', style: { fontSize: '13px', marginTop: '8px', lineHeight: '1.5' } });
        descEl.textContent = game.description.length > 80 ? game.description.slice(0, 80) + '...' : game.description;
        infoEl.appendChild(descEl);
      }

      var actionsEl = el('div', { className: 'game-actions', style: { display: 'flex', gap: '8px', marginTop: '16px' } });
      var playBtn = el('button', {
        className: 'btn-primary btn-sm game-play-btn',
        style: { flex: '1' },
        onClick: function (e) { e.stopPropagation(); onSetupGame(game); },
      });
      playBtn.textContent = '🎲 Jugar';
      var detailBtn = el('button', {
        className: 'btn-ghost btn-sm game-detail-btn',
        onClick: function (e) { e.stopPropagation(); onSelectGame(game); },
      });
      detailBtn.textContent = 'Ver';
      actionsEl.appendChild(playBtn);
      actionsEl.appendChild(detailBtn);

      card.appendChild(bar);
      card.appendChild(infoEl);
      card.appendChild(actionsEl);
      return card;
    }

    function renderGrid() {
      gridEl.innerHTML = '';
      if (state.loading) {
        var loadEl = el('div', { className: 'loading-state', style: { padding: '40px', textAlign: 'center' } });
        loadEl.textContent = 'Cargando...';
        gridEl.appendChild(loadEl);
        countEl.textContent = 'Cargando...';
        return;
      }
      if (state.error) {
        var errEl = el('div', { className: 'error-state', style: { padding: '40px', textAlign: 'center' } });
        errEl.textContent = state.error;
        gridEl.appendChild(errEl);
        return;
      }
      var filtered = filterGames();
      var n = filtered.length;
      countEl.textContent = n + ' juego' + (n !== 1 ? 's' : '') + ' encontrado' + (n !== 1 ? 's' : '');
      if (n === 0) {
        var emptyEl = el('div', { className: 'empty-state', style: { padding: '40px', textAlign: 'center' } });
        emptyEl.textContent = 'No se encontraron juegos.';
        gridEl.appendChild(emptyEl);
        return;
      }
      filtered.forEach(function (game) {
        gridEl.appendChild(renderCard(game));
      });
    }

    async function refresh() {
      state.loading = true;
      state.error = null;
      renderGrid();
      try {
        var token = await getToken();
        var games = await fetchGames(token);
        state.games = games || [];
        state.loading = false;
        renderGrid();
      } catch (err) {
        /* c8 ignore start */
        state.error = err.message || 'Error al cargar juegos';
        state.loading = false;
        renderGrid();
        /* c8 ignore stop */
      }
    }

    renderGrid();

    return {
      element: root,
      refresh,
      _state: state,
      _setState: function (s) { Object.assign(state, s); renderGrid(); },
      _filterGames: filterGames,
      _renderFilters: renderFilters,
    };
  }

  return createLibraryPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
