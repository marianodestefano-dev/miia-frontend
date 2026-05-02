/* c8 ignore start */
/**
 * game-history-panel.js - TEC-LUDOMIIA-MIGRAR-10.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/history/* (Next.js, deprecado).
 *
 * Lista paginada del historial de partidas con detalle expandible.
 *
 * Uso:
 *   const panel = createGameHistoryPanel({
 *     fetchHistory: async (page, limit, token) => res.json(),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     pageSize: 10,
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createGameHistoryPanel = factory();
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

  function fmtDate(iso) {
    /* c8 ignore next */
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    /* c8 ignore start */
    } catch (_) {
      return '-';
    }
    /* c8 ignore stop */
  }

  function renderHistoryRow(session, onExpand) {
    var row = el('div', {
      className: 'history-row',
      style: {
        padding: '14px 16px',
        borderBottom: '1px solid var(--border, #333)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      },
      onClick: function () { onExpand(session.sessionId); },
    });
    var statusIcon = el('span', { style: { fontSize: '18px', minWidth: '24px' } });
    var isWin = session.status === 'ended' && session.won;
    var isActive = session.status !== 'ended';
    statusIcon.textContent = isActive ? '⏳' : (isWin ? '🏆' : '❌');
    var info = el('div', { style: { flex: '1' } });
    var gameName = el('div', { style: { fontWeight: '600', fontSize: '14px' } });
    /* c8 ignore next */
    gameName.textContent = session.gameName || 'Partida';
    var meta = el('div', { style: { fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' } });
    /* c8 ignore next */
    meta.textContent = fmtDate(session.createdAt) + (session.durationMin != null ? ' · ' + session.durationMin + ' min' : '');
    info.appendChild(gameName);
    info.appendChild(meta);
    var chevron = el('span', { style: { color: 'var(--text-3)', fontSize: '16px' } });
    chevron.textContent = '›';
    row.appendChild(statusIcon);
    row.appendChild(info);
    row.appendChild(chevron);
    return row;
  }

  function renderDetail(session) {
    var wrap = el('div', {
      className: 'history-detail',
      style: {
        padding: '12px 16px 16px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border, #333)',
        fontSize: '13px',
        color: 'var(--text-2)',
      },
    });
    var lines = [
      ['Juego', session.gameName || '-'],
      ['Estado', session.status || '-'],
      ['Resultado', session.won ? 'Victoria' : (session.status === 'ended' ? 'Derrota' : 'En curso')],
      ['Duración', session.durationMin != null ? session.durationMin + ' min' : '-'],
      ['Jugadores', session.playerCount != null ? String(session.playerCount) : '-'],
    ];
    lines.forEach(function (pair) {
      var lineDiv = el('div', { style: { display: 'flex', gap: '8px', marginBottom: '4px' } });
      var lbl = el('span', { style: { color: 'var(--text-3)', minWidth: '80px' } });
      lbl.textContent = pair[0] + ':';
      var val = el('span', {});
      val.textContent = pair[1];
      lineDiv.appendChild(lbl);
      lineDiv.appendChild(val);
      wrap.appendChild(lineDiv);
    });
    return wrap;
  }

  function createGameHistoryPanel(opts) {
    opts = opts || {};
    var fetchHistory = opts.fetchHistory || (async () => ({ sessions: [], total: 0 }));
    var getToken = opts.getToken || (async () => '');
    var pageSize = opts.pageSize || 10;

    var state = {
      sessions: [],
      total: 0,
      page: 1,
      expandedId: null,
      loading: true,
      error: null,
    };

    var root = el('div', { style: { maxWidth: '700px', margin: '0 auto' } });

    // Header
    var header = el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' } });
    var titleEl = el('h2', { style: { fontWeight: '700', fontSize: '20px', margin: '0' } }, 'Historial de Partidas');
    var totalEl = el('span', { style: { fontSize: '13px', color: 'var(--text-3)' } });
    totalEl.textContent = '';
    header.appendChild(titleEl);
    header.appendChild(totalEl);
    root.appendChild(header);

    // List
    var listEl = el('div', { style: { background: 'var(--bg-elevated)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' } });
    root.appendChild(listEl);

    // Pagination
    var paginationEl = el('div', { style: { display: 'flex', justifyContent: 'center', gap: '8px' } });
    var prevBtn = el('button', { className: 'btn-ghost btn-sm', onClick: handlePrev });
    prevBtn.textContent = '← Anterior';
    var pageInfoEl = el('span', { style: { fontSize: '13px', color: 'var(--text-3)', padding: '6px 0' } });
    pageInfoEl.textContent = '';
    var nextBtn = el('button', { className: 'btn-ghost btn-sm', onClick: handleNext });
    nextBtn.textContent = 'Siguiente →';
    paginationEl.appendChild(prevBtn);
    paginationEl.appendChild(pageInfoEl);
    paginationEl.appendChild(nextBtn);
    root.appendChild(paginationEl);

    function render() {
      listEl.innerHTML = '';
      if (state.loading) {
        var sk = el('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--text-3)' } });
        sk.textContent = 'Cargando...';
        listEl.appendChild(sk);
        prevBtn.setAttribute('disabled', 'true');
        nextBtn.setAttribute('disabled', 'true');
        pageInfoEl.textContent = '';
        totalEl.textContent = '';
        return;
      }
      if (state.error) {
        var errDiv = el('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--error, #f44)' } });
        errDiv.textContent = state.error;
        listEl.appendChild(errDiv);
        prevBtn.setAttribute('disabled', 'true');
        nextBtn.setAttribute('disabled', 'true');
        return;
      }
      var sessions = state.sessions || [];
      var totalPages = Math.max(1, Math.ceil(state.total / pageSize));
      totalEl.textContent = state.total + ' partidas';
      pageInfoEl.textContent = 'Pág. ' + state.page + ' / ' + totalPages;

      if (sessions.length === 0) {
        var emptyDiv = el('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--text-3)' } });
        emptyDiv.textContent = 'Sin partidas registradas.';
        listEl.appendChild(emptyDiv);
      } else {
        sessions.forEach(function (sess) {
          listEl.appendChild(renderHistoryRow(sess, handleExpand));
          if (state.expandedId === sess.sessionId) {
            listEl.appendChild(renderDetail(sess));
          }
        });
      }

      // Pagination controls
      if (state.page <= 1) {
        prevBtn.setAttribute('disabled', 'true');
      } else {
        prevBtn.removeAttribute('disabled');
      }
      if (state.page >= totalPages) {
        nextBtn.setAttribute('disabled', 'true');
      } else {
        nextBtn.removeAttribute('disabled');
      }
    }

    function handleExpand(sessionId) {
      state.expandedId = state.expandedId === sessionId ? null : sessionId;
      render();
    }

    async function handlePrev() {
      if (state.page <= 1) return;
      state.page -= 1;
      await loadPage();
    }

    async function handleNext() {
      var totalPages = Math.max(1, Math.ceil(state.total / pageSize));
      if (state.page >= totalPages) return;
      state.page += 1;
      await loadPage();
    }

    async function loadPage() {
      state.loading = true;
      state.error = null;
      render();
      try {
        var token = await getToken();
        var result = await fetchHistory(state.page, pageSize, token);
        state.sessions = (result && result.sessions) || [];
        state.total = (result && result.total) || 0;
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar historial';
        state.loading = false;
        render();
      }
    }

    loadPage();

    return {
      element: root,
      refresh: loadPage,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
      _handleExpand: handleExpand,
      _handlePrev: handlePrev,
      _handleNext: handleNext,
    };
  }

  return createGameHistoryPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
