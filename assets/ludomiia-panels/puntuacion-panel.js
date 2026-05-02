/* c8 ignore start */
/**
 * puntuacion-panel.js - TEC-LUDOMIIA-MIGRAR-5.
 *
 * Panel JS vanilla para owner-dashboard.html.
 * Muestra tabla de puntuaciones, winner al finalizar, historial partidas.
 *
 * Uso:
 *   const panel = createPuntuacionPanel({
 *     sessionId: 's1',
 *     getScores: async (id, token) => fetch('/api/ludo/sessions/' + id + '/scores').then(r => r.json()),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     onClose: () => history.back(),
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createPuntuacionPanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function el(tag, attrs) {
    const e = document.createElement(tag);
    /* c8 ignore next */
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
        else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === 'className') e.className = attrs[k];
        /* c8 ignore next */
        else e.setAttribute(k, attrs[k]);
      }
    }
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      /* c8 ignore next */
      if (c == null) continue;
      /* c8 ignore next */
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  const MEDAL = ['🥇', '🥈', '🥉'];

  function renderRow(player, rank) {
    const highlight = rank === 0;
    const row = el('div', {
      className: 'score-row',
      style: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', marginBottom: '8px',
        background: highlight
          ? 'linear-gradient(90deg, rgba(6,182,212,0.1), var(--bg-elevated))'
          : 'var(--bg-elevated)',
        borderRadius: '8px',
        borderLeft: highlight ? '3px solid var(--miia-cyan)' : '3px solid transparent',
      },
    });
    const medal = el('span', { style: { fontSize: '20px', minWidth: '28px', textAlign: 'center' } });
    medal.textContent = MEDAL[rank] || String(rank + 1);
    const name = el('span', { style: { flex: '1', fontWeight: '600', fontSize: '14px', color: 'var(--text-1)' } });
    name.textContent = player.displayName || player.uid || 'Jugador';
    const score = el('span', { style: { fontWeight: '700', fontSize: '20px', color: highlight ? 'var(--miia-cyan)' : 'var(--text-1)' } });
    score.textContent = String(player.score != null ? player.score : 0);
    row.appendChild(medal);
    row.appendChild(name);
    row.appendChild(score);
    return row;
  }

  function renderHistoryItem(item) {
    const row = el('div', {
      style: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 12px', marginBottom: '6px',
        background: 'var(--bg-elevated)', borderRadius: '6px', fontSize: '13px',
      },
    });
    const game = el('span', { style: { color: 'var(--text-1)', fontWeight: '500' } });
    game.textContent = item.gameName || 'Partida';
    const result = el('span', { style: { color: item.won ? 'var(--miia-cyan)' : 'var(--text-3)', fontWeight: '600' } });
    result.textContent = item.won ? 'Victoria' : 'Derrota';
    row.appendChild(game);
    row.appendChild(result);
    return row;
  }

  function renderSkeleton(parent) {
    parent.innerHTML = '';
    for (let i = 0; i < 3; i += 1) {
      parent.appendChild(el('div', {
        style: {
          height: '52px', background: 'var(--bg-elevated)', borderRadius: '8px',
          marginBottom: '8px', opacity: String(1 - i * 0.2),
        },
      }));
    }
  }

  function createPuntuacionPanel(opts) {
    opts = opts || {};
    const sessionId = opts.sessionId || null;
    const getScores = opts.getScores || (async () => null);
    const getToken = opts.getToken || (async () => '');
    const onClose = opts.onClose || (() => {});

    let state = {
      loading: true,
      error: null,
      scores: null,
    };

    const root = el('div', { style: { maxWidth: '700px', margin: '0 auto' } });

    const header = el('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    });
    const titleEl = el('h2', { style: { fontWeight: '700', fontSize: '20px', margin: '0', color: 'var(--text-1)' } });
    titleEl.textContent = 'Puntuaciones';
    const closeBtn = el('button', { className: 'btn-ghost btn-sm', title: 'Cerrar', onClick: onClose });
    closeBtn.textContent = '✕';
    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    root.appendChild(header);

    const winnerBanner = el('div', {
      className: 'winner-banner',
      style: {
        display: 'none', marginBottom: '20px', padding: '16px', borderRadius: '12px',
        background: 'linear-gradient(135deg, var(--miia-cyan), var(--miia-violet))',
        textAlign: 'center', color: 'white',
      },
    });
    root.appendChild(winnerBanner);

    const scoresTitleEl = el('h3', { style: { fontWeight: '600', fontSize: '16px', marginBottom: '12px', color: 'var(--text-1)' } });
    scoresTitleEl.textContent = 'Tabla de posiciones';
    root.appendChild(scoresTitleEl);

    const scoresBody = el('div', { style: { marginBottom: '24px' } });
    root.appendChild(scoresBody);

    const historyTitleEl = el('h3', {
      style: {
        fontWeight: '600', fontSize: '16px', marginBottom: '12px', color: 'var(--text-1)',
        borderTop: '1px solid var(--border)', paddingTop: '16px',
      },
    });
    historyTitleEl.textContent = 'Historial';
    root.appendChild(historyTitleEl);

    const historyBody = el('div', {});
    root.appendChild(historyBody);

    const refreshBtn = el('button', {
      className: 'btn-ghost btn-sm',
      style: { marginTop: '16px' },
      onClick: refresh,
    });
    refreshBtn.textContent = 'Actualizar';
    root.appendChild(refreshBtn);

    function render() {
      if (state.loading) {
        winnerBanner.style.display = 'none';
        renderSkeleton(scoresBody);
        historyBody.innerHTML = '';
        refreshBtn.setAttribute('disabled', 'true');
        return;
      }
      if (state.error) {
        winnerBanner.style.display = 'none';
        scoresBody.innerHTML = '';
        const errP = el('p', { style: { color: 'var(--error, #f44)', textAlign: 'center', padding: '24px' } });
        errP.textContent = state.error;
        scoresBody.appendChild(errP);
        historyBody.innerHTML = '';
        refreshBtn.removeAttribute('disabled');
        return;
      }

      const data = state.scores || {};
      const players = data.players || [];
      const history = data.history || [];
      const winner = data.winner || null;

      if (winner) {
        winnerBanner.style.display = 'block';
        winnerBanner.innerHTML = '';
        const trophy = el('p', { style: { fontSize: '28px', margin: '0 0 4px 0' } }, '🏆');
        const winnerName = el('p', { style: { fontWeight: '700', fontSize: '18px', margin: '0' } });
        winnerName.textContent = '¡Ganador: ' + (winner.displayName || winner.uid || 'Jugador') + '!';
        winnerBanner.appendChild(trophy);
        winnerBanner.appendChild(winnerName);
      } else {
        winnerBanner.style.display = 'none';
      }

      scoresBody.innerHTML = '';
      if (players.length === 0) {
        const emptyP = el('p', { style: { color: 'var(--text-3)', textAlign: 'center', padding: '24px' } });
        emptyP.textContent = 'Sin jugadores registrados aun.';
        scoresBody.appendChild(emptyP);
      } else {
        players.forEach((p, i) => scoresBody.appendChild(renderRow(p, i)));
      }

      historyBody.innerHTML = '';
      if (history.length === 0) {
        const emptyH = el('p', { style: { color: 'var(--text-3)', fontSize: '13px' } });
        emptyH.textContent = 'Sin historial de partidas.';
        historyBody.appendChild(emptyH);
      } else {
        history.forEach((item) => historyBody.appendChild(renderHistoryItem(item)));
      }

      refreshBtn.removeAttribute('disabled');
    }

    async function refresh() {
      state.loading = true;
      state.error = null;
      render();
      try {
        const token = await getToken();
        const scores = await getScores(sessionId, token);
        state.scores = scores;
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar puntuaciones';
        state.loading = false;
        render();
      }
    }

    render();

    return {
      element: root,
      refresh,
      _state: state,
      _setState: (s) => { Object.assign(state, s); render(); },
    };
  }

  return createPuntuacionPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
