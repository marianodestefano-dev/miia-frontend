/**
 * selector-juego.js - TEC-LUDOMIIA-MIGRAR-2.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/library/page.tsx (Next.js, deprecado).
 *
 * Renderiza grid de juegos con search + filter por tipo.
 * Click sobre juego dispara onSelect callback. Click "Jugar" dispara
 * onStart callback. Owner puede agregar juego (FAB +).
 *
 * Uso (vanilla):
 *   const panel = createSelectorJuegoPanel({
 *     fetchGames: async (token) => fetch('/api/ludo/games', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.json()),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     isOwner: true,
 *     onSelect: (game) => console.log('selected', game),
 *     onStart: (game) => console.log('start', game),
 *     onAddGame: () => location.hash = '#ludomiia/add-game',
 *   });
 *   document.querySelector('#sec-ludomiia').appendChild(panel.element);
 *   panel.refresh();
 *
 * Importa v2-design-system.css (clases .card, .input, .btn-primary, .btn-ghost,
 * .badge, .badge-cyan).
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    /* istanbul ignore next — UMD browser path; tests run in node via require */
    root.createSelectorJuegoPanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {

  const GAME_TYPES = ['Todos', 'competitivo', 'cooperativo', 'solitario'];

  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
        else if (k === 'dataset' && typeof attrs[k] === 'object') Object.assign(e.dataset, attrs[k]);
        else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === 'className') e.className = attrs[k];
        else if (k === 'innerHTML') e.innerHTML = attrs[k];
        else e.setAttribute(k, attrs[k]);
      }
    }
    for (const c of children) {
      if (c == null) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  function renderSkeleton(parent, count) {
    parent.innerHTML = '';
    for (let i = 0; i < count; i += 1) {
      const skel = el('div', { className: 'card', style: { height: '180px', background: 'var(--bg-elevated)' } });
      parent.appendChild(skel);
    }
  }

  function renderEmpty(parent, count) {
    parent.innerHTML = '';
    const msg = el('p', { style: { color: 'var(--text-3)', fontSize: '14px', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' } },
      count === 0 ? 'No tenes juegos aun. Agrega uno con el boton +.' : 'No hay juegos que coincidan con tu busqueda.');
    parent.appendChild(msg);
  }

  function renderGameCard(game, opts) {
    const card = el('div', {
      className: 'card',
      style: { display: 'flex', flexDirection: 'column', cursor: 'pointer' },
      onClick: () => opts.onSelect(game),
    });
    card.appendChild(el('div', { style: { height: '6px', borderRadius: '4px 4px 0 0', marginBottom: '14px', background: game.color || 'linear-gradient(90deg, var(--miia-cyan), var(--miia-violet))' } }));

    const body = el('div', { style: { flex: '1' } });
    const header = el('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' } });
    header.appendChild(el('h3', { style: { fontWeight: '700', fontSize: '15px', lineHeight: '1.3', margin: '0' } }, game.name || 'Sin nombre'));
    if (game.type) {
      header.appendChild(el('span', { className: 'badge badge-cyan', style: { marginLeft: '8px', flexShrink: '0', fontSize: '10px' } }, game.type));
    }
    body.appendChild(header);

    if (game.minPlayers) {
      const pl = game.minPlayers + (game.maxPlayers && game.maxPlayers !== game.minPlayers ? '-' + game.maxPlayers : '') + ' jugadores' +
        (game.avgDuration ? ' . ' + game.avgDuration + ' min' : '');
      body.appendChild(el('p', { style: { fontSize: '12px', color: 'var(--text-2)', margin: '0 0 4px 0' } }, pl));
    }
    if (game.description) {
      const desc = (game.description || '').slice(0, 80) + ((game.description || '').length > 80 ? '...' : '');
      body.appendChild(el('p', { style: { fontSize: '13px', color: 'var(--text-2)', marginTop: '8px', lineHeight: '1.5' } }, desc));
    }
    card.appendChild(body);

    const actions = el('div', { style: { display: 'flex', gap: '8px', marginTop: '16px' } });
    const btnPlay = el('button', {
      className: 'btn-primary btn-sm',
      style: { flex: '1' },
      onClick: (e) => { e.stopPropagation(); opts.onStart(game); },
    }, 'Jugar');
    const btnView = el('button', {
      className: 'btn-ghost btn-sm',
      onClick: (e) => { e.stopPropagation(); opts.onSelect(game); },
    }, 'Ver');
    actions.appendChild(btnPlay);
    actions.appendChild(btnView);
    card.appendChild(actions);
    return card;
  }

  function applyFilters(games, search, typeFilter) {
    const lower = (search || '').toLowerCase();
    return games.filter((g) => {
      const matchSearch = !lower || (g.name || '').toLowerCase().includes(lower);
      const matchType = !typeFilter || typeFilter === 'Todos' || g.type === typeFilter;
      return matchSearch && matchType;
    });
  }

  function createSelectorJuegoPanel(opts) {
    opts = opts || {};
    const fetchGames = opts.fetchGames || (async () => []);
    const getToken = opts.getToken || (async () => '');
    const isOwner = !!opts.isOwner;
    const onSelect = opts.onSelect || (() => {});
    const onStart = opts.onStart || (() => {});
    const onAddGame = opts.onAddGame || (() => {});

    let state = { games: [], search: '', typeFilter: 'Todos', loading: true };

    const root = el('div', { style: { maxWidth: '1200px', margin: '0 auto' } });

    // Header search + filter
    const header = el('div', { style: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' } });
    const inputWrap = el('div', { style: { flex: '1', minWidth: '200px' } });
    const input = el('input', { className: 'input', placeholder: 'Buscar juego...', type: 'text' });
    input.addEventListener('input', () => { state.search = input.value; render(); });
    inputWrap.appendChild(input);
    header.appendChild(inputWrap);

    const filtersWrap = el('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } });
    GAME_TYPES.forEach((t) => {
      const btn = el('button', {
        className: 'btn-ghost btn-sm',
        dataset: { type: t },
        onClick: () => { state.typeFilter = t; updateFilterButtons(); render(); },
      }, t);
      filtersWrap.appendChild(btn);
    });
    header.appendChild(filtersWrap);
    root.appendChild(header);

    function updateFilterButtons() {
      filtersWrap.querySelectorAll('button').forEach((b) => {
        b.className = b.dataset.type === state.typeFilter ? 'btn-primary btn-sm' : 'btn-ghost btn-sm';
      });
    }
    updateFilterButtons();

    // Counter
    const counter = el('p', { style: { fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px' } });
    root.appendChild(counter);

    // Grid
    const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '80px' } });
    root.appendChild(grid);

    // FAB owner
    if (isOwner) {
      const fab = el('button', {
        style: {
          position: 'fixed', bottom: '80px', right: '24px', width: '56px', height: '56px',
          borderRadius: '50%', background: 'linear-gradient(135deg, var(--miia-cyan), var(--miia-violet))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
          boxShadow: '0 4px 16px rgba(0,229,255,0.3)', zIndex: '50', cursor: 'pointer', border: 'none', color: 'white',
        },
        title: 'Agregar juego',
        onClick: () => onAddGame(),
      }, '+');
      root.appendChild(fab);
    }

    function render() {
      const filtered = applyFilters(state.games, state.search, state.typeFilter);
      if (state.loading) {
        counter.textContent = 'Cargando...';
        renderSkeleton(grid, 8);
        return;
      }
      counter.textContent = filtered.length + ' juego' + (filtered.length !== 1 ? 's' : '') + ' encontrado' + (filtered.length !== 1 ? 's' : '');
      if (!filtered.length) {
        renderEmpty(grid, state.games.length);
        return;
      }
      grid.innerHTML = '';
      filtered.forEach((game) => {
        grid.appendChild(renderGameCard(game, { onSelect, onStart }));
      });
    }

    async function refresh() {
      state.loading = true;
      render();
      try {
        const token = await getToken();
        const games = await fetchGames(token);
        state.games = Array.isArray(games) ? games : [];
        state.loading = false;
        render();
      } catch (err) {
        state.games = [];
        state.loading = false;
        render();
      }
    }

    render();

    return {
      element: root,
      refresh,
      // Test helpers
      _state: state,
      _setState: (s) => { Object.assign(state, s); render(); },
      _applyFilters: applyFilters,
      _renderGameCard: renderGameCard,
    };
  }

  return createSelectorJuegoPanel;
}));
