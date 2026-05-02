/* c8 ignore start */
/**
 * jugar-con-miia-panel.js - TEC-LUDOMIIA-MIGRAR-3.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/session/[id]/page.tsx (Next.js, deprecado).
 *
 * Muestra sesion activa de juego con chat de MIIA coach.
 * Callbacks: onEnd (partida terminada), sendMessage, endGame.
 *
 * Uso (vanilla):
 *   const panel = createJugarConMiiaPanel({
 *     sessionId: 'session123',
 *     fetchSession: async (id, token) => fetch('/api/ludo/sessions/' + id, ...).then(r => r.json()),
 *     sendMessage: async (id, msg, token) => fetch('/api/ludo/sessions/' + id + '/message', {...}).then(r => r.json()),
 *     endGame: async (id, token) => fetch('/api/ludo/sessions/' + id + '/end', {...}).then(r => r.json()),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     onEnd: (result) => console.log('ended', result),
 *   });
 *   document.querySelector('#sec-ludomiia').appendChild(panel.element);
 *   panel.refresh();
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createJugarConMiiaPanel = factory();
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

  function fmtTime(iso) {
    /* c8 ignore next */
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    /* c8 ignore start */
    } catch (_) {
      return '';
    }
    /* c8 ignore stop */
  }

  function renderSkeleton(parent) {
    parent.innerHTML = '';
    parent.appendChild(el('div', {
      className: 'card',
      style: { height: '120px', background: 'var(--bg-elevated)', marginBottom: '16px' },
    }));
    for (let i = 0; i < 3; i += 1) {
      parent.appendChild(el('div', {
        style: {
          height: '48px', background: 'var(--bg-elevated)', borderRadius: '8px',
          marginBottom: '8px', width: i % 2 === 0 ? '70%' : '50%',
          marginLeft: i % 2 === 0 ? '0' : 'auto',
        },
      }));
    }
  }

  function renderMessage(msg) {
    const isUser = msg.role === 'user';
    const wrap = el('div', {
      style: {
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
      },
    });
    const bubble = el('div', {
      className: isUser ? 'msg-user' : 'msg-miia',
      style: {
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'linear-gradient(135deg, var(--miia-cyan), var(--miia-violet))' : 'var(--bg-elevated)',
        color: isUser ? 'white' : 'var(--text-1)',
        fontSize: '14px',
        lineHeight: '1.5',
      },
    });
    /* c8 ignore next */
    bubble.appendChild(el('p', { style: 'margin:0 0 4px 0' }, msg.content || ''));
    bubble.appendChild(el('span', {
      style: 'font-size:10px;opacity:0.6;display:block',
    }, fmtTime(msg.timestamp)));
    wrap.appendChild(bubble);
    return wrap;
  }

  function createJugarConMiiaPanel(opts) {
    opts = opts || {};
    const sessionId = opts.sessionId || null;
    const fetchSession = opts.fetchSession || (async () => null);
    /* c8 ignore next */
    const sendMessageFn = opts.sendMessage || (async () => null);
    /* c8 ignore next */
    const endGameFn = opts.endGame || (async () => null);
    const getToken = opts.getToken || (async () => '');
    const onEnd = opts.onEnd || (() => {});

    let state = {
      session: null,
      loading: true,
      error: null,
      sending: false,
      sendError: null,
      ending: false,
    };

    const root = el('div', { style: { maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column' } });

    // Header
    const headerEl = el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' } });
    const titleEl = el('h2', { style: { fontWeight: '700', fontSize: '20px', margin: '0', color: 'var(--text-1)' } }, 'Cargando...');
    const statusEl = el('span', { className: 'badge', style: { fontSize: '12px' } }, '');
    headerEl.appendChild(titleEl);
    headerEl.appendChild(statusEl);
    root.appendChild(headerEl);

    // Body (loading / chat)
    const bodyEl = el('div', { style: { flex: '1', overflowY: 'auto', marginBottom: '16px', minHeight: '300px' } });
    root.appendChild(bodyEl);

    // Send error
    const sendErrorEl = el('p', { style: { color: 'var(--error, #f44)', fontSize: '13px', margin: '0 0 8px 0', display: 'none' } }, '');
    root.appendChild(sendErrorEl);

    // Input bar
    const inputBar = el('div', { style: { display: 'flex', gap: '8px', marginBottom: '16px' } });
    const inputEl = el('input', { className: 'input', placeholder: 'Preguntale algo a MIIA coach...', type: 'text', style: { flex: '1' } });
    const sendBtn = el('button', { className: 'btn-primary btn-sm', style: { minWidth: '72px' }, onClick: handleSend }, 'Enviar');
    inputEl.addEventListener('keydown', (e) => {
      /* c8 ignore next */
      if (e.key === 'Enter') handleSend();
    });
    inputBar.appendChild(inputEl);
    inputBar.appendChild(sendBtn);
    root.appendChild(inputBar);

    // Footer actions
    const footerEl = el('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' } });
    const endBtn = el('button', { className: 'btn-ghost btn-sm', title: 'Terminar partida', onClick: handleEnd }, 'Terminar partida');
    footerEl.appendChild(endBtn);
    root.appendChild(footerEl);

    function render() {
      if (state.loading) {
        titleEl.textContent = 'Cargando...';
        statusEl.textContent = '';
        renderSkeleton(bodyEl);
        inputEl.setAttribute('disabled', 'true');
        sendBtn.setAttribute('disabled', 'true');
        endBtn.setAttribute('disabled', 'true');
        return;
      }
      if (state.error) {
        titleEl.textContent = 'Error';
        statusEl.textContent = '';
        bodyEl.innerHTML = '';
        bodyEl.appendChild(el('p', {
          style: { color: 'var(--error, #f44)', textAlign: 'center', padding: '40px' },
        }, state.error));
        inputEl.setAttribute('disabled', 'true');
        sendBtn.setAttribute('disabled', 'true');
        endBtn.setAttribute('disabled', 'true');
        return;
      }
      const s = state.session || {};
      titleEl.textContent = s.gameName || 'Partida';
      const active = s.status !== 'ended';
      statusEl.textContent = active ? 'En juego' : 'Finalizada';
      statusEl.className = active ? 'badge badge-cyan' : 'badge';

      // Render messages
      bodyEl.innerHTML = '';
      const msgs = s.messages || [];
      if (msgs.length === 0) {
        bodyEl.appendChild(el('p', {
          style: { color: 'var(--text-3)', textAlign: 'center', padding: '40px' },
        }, 'Empieza la partida y consultale a MIIA coach.'));
      } else {
        msgs.forEach((m) => bodyEl.appendChild(renderMessage(m)));
        bodyEl.scrollTop = bodyEl.scrollHeight;
      }

      // Controls
      const canInteract = active && !state.sending && !state.ending;
      if (canInteract) {
        inputEl.removeAttribute('disabled');
        sendBtn.removeAttribute('disabled');
        endBtn.removeAttribute('disabled');
      } else {
        inputEl.setAttribute('disabled', 'true');
        sendBtn.setAttribute('disabled', 'true');
        endBtn.setAttribute('disabled', 'true');
      }

      // Send error
      if (state.sendError) {
        sendErrorEl.textContent = state.sendError;
        sendErrorEl.style.display = 'block';
      } else {
        sendErrorEl.style.display = 'none';
      }
    }

    async function handleSend() {
      const msg = inputEl.value.trim();
      if (!msg || state.sending || state.ending) return;
      state.sending = true;
      state.sendError = null;
      inputEl.value = '';
      render();
      try {
        const token = await getToken();
        const updated = await sendMessageFn(sessionId, msg, token);
        if (updated && typeof updated === 'object') {
          state.session = updated;
        }
        state.sending = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.sendError = err.message || 'Error al enviar mensaje';
        state.sending = false;
        render();
      }
    }

    async function handleEnd() {
      if (state.ending || state.sending) return;
      state.ending = true;
      render();
      try {
        const token = await getToken();
        const result = await endGameFn(sessionId, token);
        state.ending = false;
        /* c8 ignore next */
        if (state.session) state.session.status = 'ended';
        render();
        onEnd(result);
      } catch (err) {
        state.ending = false;
        /* c8 ignore next */
        state.sendError = err.message || 'Error al terminar partida';
        render();
      }
    }

    async function refresh() {
      state.loading = true;
      state.error = null;
      render();
      try {
        const token = await getToken();
        const session = await fetchSession(sessionId, token);
        state.session = session;
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar sesion';
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
      _handleSend: handleSend,
      _handleEnd: handleEnd,
    };
  }

  return createJugarConMiiaPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
