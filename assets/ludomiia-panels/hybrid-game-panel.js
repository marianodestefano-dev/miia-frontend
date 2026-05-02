/* c8 ignore start */
/**
 * hybrid-game-panel.js - TEC-LUDOMIIA-MIGRAR-5.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia app/(app)/hybrid/* (Next.js, deprecado).
 *
 * Modo hibrido: tablero fisico + overlay digital con MIIA.
 * Permite escanear tablero, registrar movimientos y obtener IA overlay.
 *
 * Uso:
 *   const panel = createHybridGamePanel({
 *     sessionId: 's1',
 *     fetchState: async (id, token) => res.json(),
 *     recordMove: async (id, move, token) => res.json(),
 *     requestOverlay: async (id, token) => res.json(),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     onEnd: (result) => location.hash = '#ludomiia',
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createHybridGamePanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function el(tag, attrs, ...children) {
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
    for (const c of children) {
      /* c8 ignore next */
      if (c == null) continue;
      /* c8 ignore next */
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  function renderOverlayItem(item) {
    const div = el('div', {
      className: 'overlay-item',
      style: {
        padding: '10px 14px',
        marginBottom: '6px',
        background: 'var(--bg-elevated)',
        borderRadius: '6px',
        borderLeft: item.type === 'warning' ? '3px solid #f59e0b' : '3px solid var(--miia-cyan)',
        fontSize: '13px',
        color: 'var(--text-1)',
      },
    });
    /* c8 ignore next */
    div.textContent = (item.type === 'warning' ? '⚠ ' : '→ ') + (item.text || '');
    return div;
  }

  function renderMove(move, index) {
    const row = el('div', {
      className: 'move-row',
      style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border, #333)' },
    });
    row.appendChild(el('span', { style: { color: 'var(--text-3)', fontSize: '12px', minWidth: '24px' } }, String(index + 1)));
    row.appendChild(el('span', { style: { fontSize: '14px', flex: '1' } }, move.description || move.action || ''));
    row.appendChild(el('span', { style: { fontSize: '11px', color: 'var(--text-3)' } }, move.player || ''));
    return row;
  }

  function renderSkeleton(parent) {
    parent.innerHTML = '';
    for (let i = 0; i < 3; i += 1) {
      parent.appendChild(el('div', {
        style: { height: '44px', background: 'var(--bg-elevated)', borderRadius: '6px', marginBottom: '6px' },
      }));
    }
  }

  function createHybridGamePanel(opts) {
    opts = opts || {};
    const sessionId = opts.sessionId || null;
    const fetchState = opts.fetchState || (async () => null);
    /* c8 ignore next */
    const recordMoveFn = opts.recordMove || (async () => null);
    /* c8 ignore next */
    const requestOverlayFn = opts.requestOverlay || (async () => null);
    const getToken = opts.getToken || (async () => '');
    const onEnd = opts.onEnd || (() => {});

    let state = {
      gameState: null,
      loading: true,
      error: null,
      moveInput: '',
      recording: false,
      loadingOverlay: false,
      overlayError: null,
    };

    const root = el('div', { style: { maxWidth: '900px', margin: '0 auto' } });

    // Header
    const header = el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' } });
    const titleEl = el('h2', { style: { fontWeight: '700', fontSize: '20px', margin: '0' } }, 'Modo Hibrido');
    const statusBadge = el('span', { className: 'badge', style: { fontSize: '12px' } }, '');
    header.appendChild(titleEl);
    header.appendChild(statusBadge);
    root.appendChild(header);

    // Two-column layout
    const cols = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' } });
    root.appendChild(cols);

    // Left col: move history
    const leftCol = el('div', {});
    leftCol.appendChild(el('h3', { style: { fontWeight: '600', fontSize: '15px', marginBottom: '12px' } }, 'Historial de movimientos'));
    const movesBody = el('div', { style: { marginBottom: '16px', maxHeight: '280px', overflowY: 'auto' } });
    leftCol.appendChild(movesBody);

    // Record move form
    const moveForm = el('div', { style: { display: 'flex', gap: '8px' } });
    const moveInput = el('input', { className: 'input', placeholder: 'Ej: Mover ficha A3 -> B4', type: 'text', style: { flex: '1' } });
    const recordBtn = el('button', { className: 'btn-primary btn-sm', onClick: handleRecordMove }, 'Registrar');
    moveForm.appendChild(moveInput);
    moveForm.appendChild(recordBtn);
    leftCol.appendChild(moveForm);
    cols.appendChild(leftCol);

    // Right col: overlay
    const rightCol = el('div', {});
    rightCol.appendChild(el('h3', { style: { fontWeight: '600', fontSize: '15px', marginBottom: '12px' } }, 'Overlay MIIA'));
    const overlayBody = el('div', { style: { marginBottom: '12px', minHeight: '120px' } });
    rightCol.appendChild(overlayBody);

    const overlayBtn = el('button', { className: 'btn-ghost btn-sm', style: { width: '100%' }, onClick: handleRefreshOverlay }, 'Actualizar overlay');
    rightCol.appendChild(overlayBtn);
    cols.appendChild(rightCol);

    // Footer
    const footerEl = el('div', { style: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end' } });
    const endBtn = el('button', { className: 'btn-ghost btn-sm', title: 'Terminar partida hibrida', onClick: handleEnd }, 'Terminar');
    footerEl.appendChild(endBtn);
    root.appendChild(footerEl);

    function render() {
      if (state.loading) {
        renderSkeleton(movesBody);
        renderSkeleton(overlayBody);
        statusBadge.textContent = 'Cargando...';
        moveInput.setAttribute('disabled', 'true');
        recordBtn.setAttribute('disabled', 'true');
        overlayBtn.setAttribute('disabled', 'true');
        endBtn.setAttribute('disabled', 'true');
        return;
      }
      if (state.error) {
        movesBody.innerHTML = '';
        movesBody.appendChild(el('p', { style: { color: 'var(--error, #f44)', padding: '16px' } }, state.error));
        overlayBody.innerHTML = '';
        moveInput.setAttribute('disabled', 'true');
        recordBtn.setAttribute('disabled', 'true');
        overlayBtn.setAttribute('disabled', 'true');
        endBtn.setAttribute('disabled', 'true');
        return;
      }

      const gs = state.gameState || {};
      const active = gs.status !== 'ended';
      statusBadge.textContent = active ? 'Activo' : 'Finalizado';
      statusBadge.className = active ? 'badge badge-cyan' : 'badge';

      // Moves
      movesBody.innerHTML = '';
      const moves = gs.moves || [];
      if (moves.length === 0) {
        movesBody.appendChild(el('p', { style: { color: 'var(--text-3)', padding: '16px', textAlign: 'center' } }, 'Sin movimientos aun.'));
      } else {
        moves.forEach((m, i) => movesBody.appendChild(renderMove(m, i)));
      }

      // Overlay
      overlayBody.innerHTML = '';
      if (state.loadingOverlay) {
        renderSkeleton(overlayBody);
      } else {
        const items = (gs.overlay || []);
        if (items.length === 0) {
          overlayBody.appendChild(el('p', { style: { color: 'var(--text-3)', padding: '12px' } }, 'Sin overlay. Actualizalo para ver sugerencias.'));
        } else {
          items.forEach((item) => overlayBody.appendChild(renderOverlayItem(item)));
        }
      }

      if (state.overlayError) {
        overlayBody.appendChild(el('p', { style: { color: 'var(--error, #f44)', fontSize: '13px' } }, state.overlayError));
      }

      // Controls
      const canInteract = active && !state.recording && !state.loadingOverlay;
      if (canInteract) {
        moveInput.removeAttribute('disabled');
        recordBtn.removeAttribute('disabled');
        overlayBtn.removeAttribute('disabled');
        endBtn.removeAttribute('disabled');
      } else {
        moveInput.setAttribute('disabled', 'true');
        recordBtn.setAttribute('disabled', 'true');
        overlayBtn.setAttribute('disabled', 'true');
        endBtn.setAttribute('disabled', 'true');
      }
    }

    async function handleRecordMove() {
      const description = moveInput.value.trim();
      if (!description || state.recording) return;
      state.recording = true;
      moveInput.value = '';
      render();
      try {
        const token = await getToken();
        const updated = await recordMoveFn(sessionId, { description }, token);
        if (updated && typeof updated === 'object') {
          state.gameState = updated;
        }
        state.recording = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al registrar movimiento';
        state.recording = false;
        render();
      }
    }

    async function handleRefreshOverlay() {
      if (state.loadingOverlay) return;
      state.loadingOverlay = true;
      state.overlayError = null;
      render();
      try {
        const token = await getToken();
        const result = await requestOverlayFn(sessionId, token);
        if (result && Array.isArray(result.overlay)) {
          if (!state.gameState) state.gameState = {};
          state.gameState.overlay = result.overlay;
        }
        state.loadingOverlay = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.overlayError = err.message || 'Error al cargar overlay';
        state.loadingOverlay = false;
        render();
      }
    }

    async function handleEnd() {
      onEnd(state.gameState);
    }

    async function refresh() {
      state.loading = true;
      state.error = null;
      render();
      try {
        const token = await getToken();
        const gameState = await fetchState(sessionId, token);
        state.gameState = gameState;
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar estado';
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
      _handleRecordMove: handleRecordMove,
      _handleRefreshOverlay: handleRefreshOverlay,
      _handleEnd: handleEnd,
    };
  }

  return createHybridGamePanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
