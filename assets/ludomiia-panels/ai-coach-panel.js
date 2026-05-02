/* c8 ignore start */
/**
 * ai-coach-panel.js - TEC-LUDOMIIA-MIGRAR-4.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia app/(app)/coach/* (Next.js, deprecado).
 *
 * Muestra analisis de IA y tips estrategicos para el juego activo.
 *
 * Uso:
 *   const panel = createAiCoachPanel({
 *     sessionId: 's1',
 *     fetchAnalysis: async (id, token) => fetch('/api/ludo/sessions/' + id + '/coach').then(r => r.json()),
 *     requestTip: async (id, context, token) => fetch('/api/ludo/sessions/' + id + '/coach/tip', { method:'POST', body: JSON.stringify({ context }) }).then(r => r.json()),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     onClose: () => history.back(),
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createAiCoachPanel = factory();
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

  function renderTip(tip, index) {
    const item = el('div', {
      className: 'coach-tip',
      style: {
        padding: '12px 16px',
        marginBottom: '8px',
        background: 'var(--bg-elevated)',
        borderRadius: '8px',
        borderLeft: '3px solid var(--miia-cyan)',
      },
    });
    const num = el('span', {
      style: { fontWeight: '700', fontSize: '12px', color: 'var(--miia-cyan)', marginRight: '8px' },
    }, String(index + 1) + '.');
    /* c8 ignore next */
    const text = el('span', { style: { fontSize: '14px', color: 'var(--text-1)', lineHeight: '1.5' } }, tip.text || '');
    item.appendChild(num);
    item.appendChild(text);
    if (tip.priority === 'high') {
      item.style.borderLeftColor = 'var(--miia-violet)';
      item.style.background = 'linear-gradient(90deg, rgba(139,92,246,0.08), var(--bg-elevated))';
    }
    return item;
  }

  function renderSkeleton(parent) {
    parent.innerHTML = '';
    for (let i = 0; i < 4; i += 1) {
      parent.appendChild(el('div', {
        style: {
          height: '56px', background: 'var(--bg-elevated)', borderRadius: '8px',
          marginBottom: '8px', opacity: String(1 - i * 0.15),
        },
      }));
    }
  }

  function createAiCoachPanel(opts) {
    opts = opts || {};
    const sessionId = opts.sessionId || null;
    const fetchAnalysis = opts.fetchAnalysis || (async () => null);
    /* c8 ignore next */
    const requestTip = opts.requestTip || (async () => null);
    const getToken = opts.getToken || (async () => '');
    const onClose = opts.onClose || (() => {});

    let state = {
      analysis: null,
      loading: true,
      error: null,
      requesting: false,
      requestError: null,
      tipContext: '',
    };

    const root = el('div', { style: { maxWidth: '700px', margin: '0 auto' } });

    // Header
    const header = el('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    });
    const title = el('h2', {
      style: { fontWeight: '700', fontSize: '20px', margin: '0', color: 'var(--text-1)' },
    }, 'MIIA Coach');
    const closeBtn = el('button', { className: 'btn-ghost btn-sm', title: 'Cerrar', onClick: onClose }, '✕');
    header.appendChild(title);
    header.appendChild(closeBtn);
    root.appendChild(header);

    // Score summary card
    const scoreCard = el('div', {
      className: 'card',
      style: { marginBottom: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' },
    });
    root.appendChild(scoreCard);

    // Tips section
    const tipsTitle = el('h3', {
      style: { fontWeight: '600', fontSize: '16px', marginBottom: '12px', color: 'var(--text-1)' },
    }, 'Tips estrategicos');
    root.appendChild(tipsTitle);

    const tipsBody = el('div', { style: { marginBottom: '20px' } });
    root.appendChild(tipsBody);

    // Request tip section
    const reqSection = el('div', {
      style: { borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' },
    });
    const reqLabel = el('p', {
      style: { fontSize: '14px', color: 'var(--text-2)', marginBottom: '8px' },
    }, 'Pedi un tip especifico:');
    const reqBar = el('div', { style: { display: 'flex', gap: '8px' } });
    const reqInput = el('input', { className: 'input', placeholder: 'Ej: como mejorar mi posicion actual...', type: 'text', style: { flex: '1' } });
    const reqBtn = el('button', { className: 'btn-primary btn-sm', onClick: handleRequestTip }, 'Pedir tip');
    reqBar.appendChild(reqInput);
    reqBar.appendChild(reqBtn);
    reqSection.appendChild(reqLabel);
    reqSection.appendChild(reqBar);

    const reqError = el('p', {
      style: { color: 'var(--error, #f44)', fontSize: '13px', margin: '8px 0 0 0', display: 'none' },
    }, '');
    reqSection.appendChild(reqError);
    root.appendChild(reqSection);

    function render() {
      if (state.loading) {
        scoreCard.innerHTML = '';
        renderSkeleton(tipsBody);
        reqInput.setAttribute('disabled', 'true');
        reqBtn.setAttribute('disabled', 'true');
        return;
      }
      if (state.error) {
        scoreCard.innerHTML = '';
        tipsBody.innerHTML = '';
        tipsBody.appendChild(el('p', {
          style: { color: 'var(--error, #f44)', padding: '20px', textAlign: 'center' },
        }, state.error));
        reqInput.setAttribute('disabled', 'true');
        reqBtn.setAttribute('disabled', 'true');
        return;
      }

      const a = state.analysis || {};

      // Score card
      scoreCard.innerHTML = '';
      const metrics = [
        { label: 'Puntuacion', value: a.score != null ? String(a.score) : '-' },
        { label: 'Posicion', value: a.position != null ? '#' + a.position : '-' },
        { label: 'Turno', value: a.currentTurn || '-' },
      ];
      metrics.forEach((m) => {
        const stat = el('div', { style: { textAlign: 'center', minWidth: '80px' } });
        stat.appendChild(el('p', { style: { fontSize: '24px', fontWeight: '700', margin: '0', color: 'var(--miia-cyan)' } }, m.value));
        stat.appendChild(el('p', { style: { fontSize: '12px', color: 'var(--text-3)', margin: '4px 0 0 0' } }, m.label));
        scoreCard.appendChild(stat);
      });

      // Tips
      tipsBody.innerHTML = '';
      const tips = (a.tips || []);
      if (tips.length === 0) {
        tipsBody.appendChild(el('p', {
          style: { color: 'var(--text-3)', textAlign: 'center', padding: '24px' },
        }, 'No hay tips disponibles. Pedi uno especifico abajo.'));
      } else {
        tips.forEach((tip, i) => tipsBody.appendChild(renderTip(tip, i)));
      }

      // Controls
      const canRequest = !state.requesting;
      if (canRequest) {
        reqInput.removeAttribute('disabled');
        reqBtn.removeAttribute('disabled');
      } else {
        reqInput.setAttribute('disabled', 'true');
        reqBtn.setAttribute('disabled', 'true');
      }

      if (state.requestError) {
        reqError.textContent = state.requestError;
        reqError.style.display = 'block';
      } else {
        reqError.style.display = 'none';
      }
    }

    async function handleRequestTip() {
      const context = reqInput.value.trim();
      if (!context || state.requesting) return;
      state.requesting = true;
      state.requestError = null;
      reqInput.value = '';
      render();
      try {
        const token = await getToken();
        const result = await requestTip(sessionId, context, token);
        if (result && Array.isArray(result.tips)) {
          if (!state.analysis) state.analysis = {};
          state.analysis.tips = result.tips;
        }
        state.requesting = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.requestError = err.message || 'Error al pedir tip';
        state.requesting = false;
        render();
      }
    }

    async function refresh() {
      state.loading = true;
      state.error = null;
      render();
      try {
        const token = await getToken();
        const analysis = await fetchAnalysis(sessionId, token);
        state.analysis = analysis;
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar analisis';
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
      _handleRequestTip: handleRequestTip,
    };
  }

  return createAiCoachPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
