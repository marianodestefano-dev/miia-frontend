/* c8 ignore start */
/**
 * leaderboard-panel.js - TEC-LUDOMIIA-MIGRAR-8.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/leaderboard/* (Next.js, deprecado).
 *
 * Muestra tabla de posiciones global y por juego especifico.
 *
 * Uso:
 *   const panel = createLeaderboardPanel({
 *     fetchLeaderboard: async (gameId, token) => res.json(),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     games: [{ id: 'chess', name: 'Ajedrez' }, ...],
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createLeaderboardPanel = factory();
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

  var MEDAL = ['🥇', '🥈', '🥉'];

  function renderRow(entry, rank) {
    var row = el('tr', { className: 'lb-row' });
    var tdRank = el('td', { style: { padding: '10px 12px', textAlign: 'center', fontWeight: '700', fontSize: '18px' } });
    tdRank.textContent = MEDAL[rank] || String(rank + 1);
    var tdUser = el('td', { style: { padding: '10px 12px', fontSize: '14px', fontWeight: '600' } });
    /* c8 ignore next */
    tdUser.textContent = entry.displayName || entry.uid || 'Anon';
    var tdWins = el('td', { style: { padding: '10px 12px', textAlign: 'center', fontSize: '14px' } });
    /* c8 ignore next */
    tdWins.textContent = entry.wins != null ? String(entry.wins) : '-';
    var tdGames = el('td', { style: { padding: '10px 12px', textAlign: 'center', fontSize: '14px', color: 'var(--text-3)' } });
    /* c8 ignore next */
    tdGames.textContent = entry.gamesPlayed != null ? String(entry.gamesPlayed) : '-';
    var tdRate = el('td', { style: { padding: '10px 12px', textAlign: 'center', fontSize: '14px' } });
    /* c8 ignore next */
    tdRate.textContent = entry.winRate != null ? entry.winRate + '%' : '-';
    row.appendChild(tdRank);
    row.appendChild(tdUser);
    row.appendChild(tdWins);
    row.appendChild(tdGames);
    row.appendChild(tdRate);
    return row;
  }

  function createLeaderboardPanel(opts) {
    opts = opts || {};
    var fetchLeaderboard = opts.fetchLeaderboard || (async () => []);
    var getToken = opts.getToken || (async () => '');
    var games = opts.games || [];

    var state = {
      entries: [],
      selectedGameId: null,
      loading: true,
      error: null,
    };

    var root = el('div', { style: { maxWidth: '800px', margin: '0 auto' } });

    // Header
    var headerEl = el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' } });
    var titleEl = el('h2', { style: { fontWeight: '700', fontSize: '20px', margin: '0' } }, 'Tabla de Posiciones');
    headerEl.appendChild(titleEl);

    // Game filter
    if (games.length > 0) {
      var selectEl = el('select', { className: 'input', style: { fontSize: '14px', padding: '6px 10px' }, onChange: handleGameChange });
      var defaultOpt = el('option', { value: '' });
      defaultOpt.textContent = 'Todos los juegos';
      selectEl.appendChild(defaultOpt);
      games.forEach(function (g) {
        var opt = el('option', { value: g.id });
        opt.textContent = g.name;
        selectEl.appendChild(opt);
      });
      headerEl.appendChild(selectEl);
    }
    root.appendChild(headerEl);

    // Table
    var tableWrap = el('div', { style: { background: 'var(--bg-elevated)', borderRadius: '12px', overflow: 'hidden' } });
    var tableEl = el('table', { style: { width: '100%', borderCollapse: 'collapse' } });
    var thead = el('thead', {});
    var thRow = el('tr', {});
    ['#', 'Jugador', 'Victorias', 'Partidas', '% Vic.'].forEach(function (h) {
      var th = el('th', { style: { padding: '10px 12px', textAlign: h === 'Jugador' ? 'left' : 'center', fontSize: '12px', color: 'var(--text-3)', fontWeight: '600', borderBottom: '1px solid var(--border, #333)' } });
      th.textContent = h;
      thRow.appendChild(th);
    });
    thead.appendChild(thRow);
    var tbody = el('tbody', {});
    tableEl.appendChild(thead);
    tableEl.appendChild(tbody);
    tableWrap.appendChild(tableEl);
    root.appendChild(tableWrap);

    function render() {
      tbody.innerHTML = '';
      if (state.loading) {
        var loadRow = el('tr', {});
        var loadTd = el('td', { colspan: '5', style: { textAlign: 'center', padding: '40px', color: 'var(--text-3)' } });
        loadTd.textContent = 'Cargando...';
        loadRow.appendChild(loadTd);
        tbody.appendChild(loadRow);
        return;
      }
      if (state.error) {
        var errRow = el('tr', {});
        var errTd = el('td', { colspan: '5', style: { textAlign: 'center', padding: '40px', color: 'var(--error, #f44)' } });
        errTd.textContent = state.error;
        errRow.appendChild(errTd);
        tbody.appendChild(errRow);
        return;
      }
      var entries = state.entries || [];
      if (entries.length === 0) {
        var emptyRow = el('tr', {});
        var emptyTd = el('td', { colspan: '5', style: { textAlign: 'center', padding: '40px', color: 'var(--text-3)' } });
        emptyTd.textContent = 'Sin datos aun.';
        emptyRow.appendChild(emptyTd);
        tbody.appendChild(emptyRow);
      } else {
        entries.forEach(function (e, i) { tbody.appendChild(renderRow(e, i)); });
      }
    }

    async function loadData() {
      state.loading = true;
      state.error = null;
      render();
      try {
        var token = await getToken();
        var data = await fetchLeaderboard(state.selectedGameId, token);
        state.entries = data || [];
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar ranking';
        state.loading = false;
        render();
      }
    }

    function handleGameChange(e) {
      state.selectedGameId = e.target.value || null;
      loadData();
    }

    loadData();

    return {
      element: root,
      refresh: loadData,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
      _handleGameChange: handleGameChange,
    };
  }

  return createLeaderboardPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
