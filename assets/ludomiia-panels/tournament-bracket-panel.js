/* c8 ignore start */
/**
 * tournament-bracket-panel.js - TEC-LUDOMIIA-MIGRAR-9.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/tournament/* (Next.js, deprecado).
 *
 * Muestra bracket de torneo con rondas, partidos y estado de avance.
 *
 * Uso:
 *   const panel = createTournamentBracketPanel({
 *     tournamentId: 't1',
 *     fetchTournament: async (id, token) => res.json(),
 *     reportResult: async (id, matchId, result, token) => res.json(),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createTournamentBracketPanel = factory();
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

  function renderMatch(match, onReport) {
    var wrap = el('div', {
      className: 'match-card',
      style: {
        background: 'var(--bg-elevated)',
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '10px',
        border: match.status === 'done' ? '1px solid var(--miia-cyan)' : '1px solid var(--border, #333)',
      },
    });
    var p1Div = el('div', {
      style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' },
    });
    var p1Name = el('span', { style: { fontWeight: match.winnerId === match.player1Id ? '700' : '400' } });
    /* c8 ignore next */
    p1Name.textContent = match.player1Name || 'TBD';
    var p1Score = el('span', { style: { color: 'var(--text-3)' } });
    /* c8 ignore next */
    p1Score.textContent = match.score1 != null ? String(match.score1) : '-';
    p1Div.appendChild(p1Name);
    p1Div.appendChild(p1Score);

    var p2Div = el('div', {
      style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' },
    });
    var p2Name = el('span', { style: { fontWeight: match.winnerId === match.player2Id ? '700' : '400' } });
    /* c8 ignore next */
    p2Name.textContent = match.player2Name || 'TBD';
    var p2Score = el('span', { style: { color: 'var(--text-3)' } });
    /* c8 ignore next */
    p2Score.textContent = match.score2 != null ? String(match.score2) : '-';
    p2Div.appendChild(p2Name);
    p2Div.appendChild(p2Score);

    wrap.appendChild(p1Div);
    wrap.appendChild(p2Div);

    if (match.status !== 'done' && onReport) {
      var btnRow = el('div', { style: { marginTop: '8px', display: 'flex', gap: '6px' } });
      var btn1 = el('button', {
        className: 'btn-sm btn-ghost report-btn',
        style: { flex: '1', fontSize: '12px' },
        onClick: function () { onReport(match.matchId, match.player1Id); },
      });
      /* c8 ignore next */
      btn1.textContent = (match.player1Name || 'J1') + ' gana';
      var btn2 = el('button', {
        className: 'btn-sm btn-ghost report-btn',
        style: { flex: '1', fontSize: '12px' },
        onClick: function () { onReport(match.matchId, match.player2Id); },
      });
      /* c8 ignore next */
      btn2.textContent = (match.player2Name || 'J2') + ' gana';
      btnRow.appendChild(btn1);
      btnRow.appendChild(btn2);
      wrap.appendChild(btnRow);
    }
    return wrap;
  }

  function renderRound(round, roundIdx, onReport) {
    var div = el('div', {
      className: 'round-col',
      style: { minWidth: '200px', flex: '1' },
    });
    var title = el('div', {
      style: { fontWeight: '600', fontSize: '13px', color: 'var(--text-3)', marginBottom: '10px', textAlign: 'center' },
    });
    /* c8 ignore next */
    title.textContent = round.name || ('Ronda ' + (roundIdx + 1));
    div.appendChild(title);
    var matches = round.matches || [];
    matches.forEach(function (m) { div.appendChild(renderMatch(m, onReport)); });
    return div;
  }

  function createTournamentBracketPanel(opts) {
    opts = opts || {};
    var tournamentId = opts.tournamentId || null;
    var fetchTournament = opts.fetchTournament || (async () => null);
    /* c8 ignore next */
    var reportResultFn = opts.reportResult || (async () => null);
    var getToken = opts.getToken || (async () => '');

    var state = {
      tournament: null,
      loading: true,
      error: null,
      reporting: false,
    };

    var root = el('div', { style: { maxWidth: '100%', overflowX: 'auto' } });

    // Header
    var header = el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' } });
    var titleEl = el('h2', { style: { fontWeight: '700', fontSize: '20px', margin: '0' } }, 'Bracket del Torneo');
    var statusBadge = el('span', { className: 'badge', style: { fontSize: '12px' } });
    statusBadge.textContent = '';
    header.appendChild(titleEl);
    header.appendChild(statusBadge);
    root.appendChild(header);

    // Body
    var bodyEl = el('div', { style: { display: 'flex', gap: '16px', alignItems: 'flex-start' } });
    root.appendChild(bodyEl);

    function render() {
      bodyEl.innerHTML = '';
      if (state.loading) {
        var sk = el('div', { style: { padding: '40px', color: 'var(--text-3)' } });
        sk.textContent = 'Cargando bracket...';
        bodyEl.appendChild(sk);
        statusBadge.textContent = '';
        return;
      }
      if (state.error) {
        var errDiv = el('div', { style: { padding: '40px', color: 'var(--error, #f44)' } });
        errDiv.textContent = state.error;
        bodyEl.appendChild(errDiv);
        return;
      }
      var t = state.tournament || {};
      var active = t.status !== 'finished';
      statusBadge.textContent = active ? 'En curso' : 'Finalizado';
      statusBadge.className = active ? 'badge badge-cyan' : 'badge';
      var rounds = t.rounds || [];
      if (rounds.length === 0) {
        var emptyDiv = el('div', { style: { padding: '40px', color: 'var(--text-3)' } });
        emptyDiv.textContent = 'Sin rondas disponibles.';
        bodyEl.appendChild(emptyDiv);
        return;
      }
      rounds.forEach(function (r, i) {
        bodyEl.appendChild(renderRound(r, i, active && !state.reporting ? handleReport : null));
      });
    }

    async function handleReport(matchId, winnerId) {
      if (state.reporting) return;
      state.reporting = true;
      render();
      try {
        var token = await getToken();
        var updated = await reportResultFn(tournamentId, matchId, { winnerId }, token);
        if (updated && typeof updated === 'object') state.tournament = updated;
        state.reporting = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al reportar resultado';
        state.reporting = false;
        render();
      }
    }

    async function refresh() {
      state.loading = true;
      state.error = null;
      render();
      try {
        var token = await getToken();
        var tournament = await fetchTournament(tournamentId, token);
        state.tournament = tournament;
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar torneo';
        state.loading = false;
        render();
      }
    }

    render();

    return {
      element: root,
      refresh,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
      _handleReport: handleReport,
    };
  }

  return createTournamentBracketPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
