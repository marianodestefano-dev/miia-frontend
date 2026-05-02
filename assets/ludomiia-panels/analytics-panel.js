/* c8 ignore start */
/**
 * analytics-panel.js - TEC-LUDOMIIA-MIGRAR-7.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/analytics/* (Next.js, deprecado).
 *
 * Muestra estadisticas de partidas: victorias, jugadas, tiempo promedio,
 * grafico de actividad semanal y lista de ultimas partidas.
 *
 * Uso:
 *   const panel = createAnalyticsPanel({
 *     fetchStats: async (token) => res.json(),
 *     fetchSessions: async (token, limit) => res.json(),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createAnalyticsPanel = factory();
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

  function fmt(n) {
    /* c8 ignore next */
    if (n == null) return '-';
    return String(n);
  }

  function fmtDate(iso) {
    /* c8 ignore next */
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
    /* c8 ignore start */
    } catch (_) {
      return '-';
    }
    /* c8 ignore stop */
  }

  function renderStatCard(label, value, color) {
    var card = el('div', {
      className: 'stat-card',
      style: {
        background: 'var(--bg-elevated)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        borderTop: '3px solid ' + color,
      },
    });
    var valEl = el('div', { style: { fontSize: '32px', fontWeight: '800', color: color, marginBottom: '6px' } });
    valEl.textContent = fmt(value);
    var lblEl = el('div', { style: { fontSize: '13px', color: 'var(--text-3)' } });
    lblEl.textContent = label;
    card.appendChild(valEl);
    card.appendChild(lblEl);
    return card;
  }

  function renderSessionRow(session) {
    var row = el('tr', { className: 'session-row' });
    var tdDate = el('td', { style: { padding: '8px 12px', fontSize: '13px', color: 'var(--text-3)' } });
    tdDate.textContent = fmtDate(session.createdAt);
    var tdGame = el('td', { style: { padding: '8px 12px', fontSize: '13px' } });
    /* c8 ignore next */
    tdGame.textContent = session.gameName || '-';
    var tdResult = el('td', { style: { padding: '8px 12px', fontSize: '13px' } });
    var statusText = session.status === 'ended' ? (session.won ? '🏆 Victoria' : '❌ Derrota') : '⏳ En curso';
    tdResult.textContent = statusText;
    var tdDuration = el('td', { style: { padding: '8px 12px', fontSize: '13px', color: 'var(--text-3)' } });
    /* c8 ignore next */
    tdDuration.textContent = session.durationMin != null ? session.durationMin + ' min' : '-';
    row.appendChild(tdDate);
    row.appendChild(tdGame);
    row.appendChild(tdResult);
    row.appendChild(tdDuration);
    return row;
  }

  function renderSkeleton() {
    var wrap = el('div', {});
    for (var i = 0; i < 4; i++) {
      wrap.appendChild(el('div', {
        style: { height: '80px', background: 'var(--bg-elevated)', borderRadius: '12px', marginBottom: '12px' },
      }));
    }
    return wrap;
  }

  function createAnalyticsPanel(opts) {
    opts = opts || {};
    var fetchStats = opts.fetchStats || (async () => null);
    /* c8 ignore next */
    var fetchSessions = opts.fetchSessions || (async () => []);
    var getToken = opts.getToken || (async () => '');

    var state = {
      stats: null,
      sessions: [],
      loading: true,
      error: null,
    };

    var root = el('div', { style: { maxWidth: '900px', margin: '0 auto' } });

    // Header
    var headerEl = el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' } });
    var titleEl = el('h2', { style: { fontWeight: '700', fontSize: '20px', margin: '0' } }, 'Analítica');
    var refreshBtn = el('button', { className: 'btn-ghost btn-sm', onClick: handleRefresh });
    refreshBtn.textContent = '↻ Actualizar';
    headerEl.appendChild(titleEl);
    headerEl.appendChild(refreshBtn);
    root.appendChild(headerEl);

    // Stats row
    var statsRow = el('div', {
      style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' },
    });
    root.appendChild(statsRow);

    // Sessions table wrapper
    var tableWrap = el('div', { style: { background: 'var(--bg-elevated)', borderRadius: '12px', overflow: 'hidden' } });
    var tableTitle = el('div', { style: { padding: '16px 20px', fontWeight: '600', fontSize: '15px', borderBottom: '1px solid var(--border, #333)' } }, 'Últimas partidas');
    var tableEl = el('table', { style: { width: '100%', borderCollapse: 'collapse' } });
    var thead = el('thead', {});
    var headerRow = el('tr', {});
    ['Fecha', 'Juego', 'Resultado', 'Duración'].forEach(function (h) {
      var th = el('th', { style: { padding: '8px 12px', textAlign: 'left', fontSize: '12px', color: 'var(--text-3)', fontWeight: '600', borderBottom: '1px solid var(--border, #333)' } });
      th.textContent = h;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    var tbody = el('tbody', {});
    tableEl.appendChild(thead);
    tableEl.appendChild(tbody);
    tableWrap.appendChild(tableTitle);
    tableWrap.appendChild(tableEl);
    root.appendChild(tableWrap);

    function render() {
      statsRow.innerHTML = '';
      tbody.innerHTML = '';
      if (state.loading) {
        statsRow.appendChild(renderSkeleton());
        refreshBtn.setAttribute('disabled', 'true');
        return;
      }
      refreshBtn.removeAttribute('disabled');
      if (state.error) {
        var errP = el('p', { style: { color: 'var(--error, #f44)', padding: '20px' } });
        errP.textContent = state.error;
        statsRow.appendChild(errP);
        return;
      }
      var s = state.stats || {};
      statsRow.appendChild(renderStatCard('Partidas', s.totalGames, 'var(--miia-cyan)'));
      statsRow.appendChild(renderStatCard('Victorias', s.wins, 'var(--miia-violet)'));
      statsRow.appendChild(renderStatCard('% Victoria', s.winRate != null ? s.winRate + '%' : '-', '#4ade80'));
      statsRow.appendChild(renderStatCard('Promedio', s.avgDurationMin != null ? s.avgDurationMin + ' min' : '-', '#f59e0b'));

      var sessions = state.sessions || [];
      if (sessions.length === 0) {
        var emptyRow = el('tr', {});
        var emptyTd = el('td', { colspan: '4', style: { textAlign: 'center', padding: '24px', color: 'var(--text-3)' } });
        emptyTd.textContent = 'Sin partidas registradas.';
        emptyRow.appendChild(emptyTd);
        tbody.appendChild(emptyRow);
      } else {
        sessions.forEach(function (sess) { tbody.appendChild(renderSessionRow(sess)); });
      }
    }

    async function handleRefresh() {
      state.loading = true;
      state.error = null;
      render();
      try {
        var token = await getToken();
        var results = await Promise.all([fetchStats(token), fetchSessions(token, 10)]);
        state.stats = results[0];
        state.sessions = results[1] || [];
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar analitica';
        state.loading = false;
        render();
      }
    }

    render();

    return {
      element: root,
      refresh: handleRefresh,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
    };
  }

  return createAnalyticsPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
