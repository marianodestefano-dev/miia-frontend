/* c8 ignore start */
/**
 * active-session-panel.js - TEC-LUDOMIIA-MIGRAR-20.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/session/[id]/page.tsx (Next.js, deprecado).
 *
 * Vista de partida activa con MIIA: chat, estado del juego, fin de partida.
 *
 * Uso:
 *   const panel = createActiveSessionPanel({
 *     sendAction: async (sessionId, msg, token) => { gmResponse, state },
 *     endSession: async (sessionId, token) => {},
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     onSessionEnd: () => {},
 *   });
 *   panel.load('session-id');
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createActiveSessionPanel = factory();
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

  function createActiveSessionPanel(opts) {
    opts = opts || {};
    var sendActionFn = opts.sendAction || (async () => ({ gmResponse: 'OK', state: {} }));
    var endSessionFn = opts.endSession || (async () => null);
    var getToken = opts.getToken || (async () => '');
    var onSessionEnd = opts.onSessionEnd || function () {};

    var state = {
      sessionId: null,
      messages: [],
      gameState: {},
      input: '',
      loading: false,
      gameOver: false,
    };

    var root = el('div', { className: 'active-session-panel', style: { display: 'flex', flexDirection: 'column', height: '100%' } });

    var headerEl = el('div', { className: 'session-header', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border, #333)' } });
    var sessionTitle = el('h2', { className: 'session-title', style: { fontWeight: '700', fontSize: '18px' } }, 'Partida activa');
    var endBtn = el('button', { className: 'btn-ghost session-end-btn', onClick: handleEnd });
    endBtn.textContent = 'Finalizar partida';
    headerEl.appendChild(sessionTitle);
    headerEl.appendChild(endBtn);
    root.appendChild(headerEl);

    var chatEl = el('div', { className: 'session-chat', style: { flex: '1', overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' } });
    root.appendChild(chatEl);

    var inputAreaEl = el('div', { className: 'session-input-area', style: { padding: '12px 20px', borderTop: '1px solid var(--border, #333)' } });
    var inputRow = el('div', { style: { display: 'flex', gap: '10px' } });
    var textInput = el('input', { className: 'input session-text-input', style: { flex: '1' } });
    textInput.setAttribute('placeholder', 'Describe tu accion...');
    textInput.addEventListener('input', function (e) { state.input = e.target.value; });
    textInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
    var sendBtn = el('button', { className: 'btn-primary session-send-btn', onClick: function () { handleSend(); } });
    sendBtn.textContent = 'Enviar';
    inputRow.appendChild(textInput);
    inputRow.appendChild(sendBtn);
    inputAreaEl.appendChild(inputRow);
    root.appendChild(inputAreaEl);

    var gameOverOverlay = el('div', { className: 'game-over-overlay', style: { display: 'none', position: 'fixed', inset: '0', zIndex: '500', background: 'rgba(5,5,10,0.95)', alignItems: 'center', justifyContent: 'center' } });
    var gameOverCard = el('div', { className: 'game-over-card', style: { textAlign: 'center', maxWidth: '400px', padding: '48px 40px' } });
    var trophyEl = el('div', { style: { fontSize: '64px', marginBottom: '16px' } }, '🏆');
    var gameOverTitle = el('h2', { className: 'game-over-title', style: { fontSize: '24px', fontWeight: '900', marginBottom: '8px' } }, 'Partida finalizada');
    var gameOverSub = el('p', { className: 'game-over-sub', style: { marginBottom: '32px' } });
    var gameOverActions = el('div', { className: 'game-over-actions', style: { display: 'flex', gap: '12px', justifyContent: 'center' } });
    var verPartidasBtn = el('button', { className: 'btn-primary ver-partidas-btn', onClick: function () { onSessionEnd(); } });
    verPartidasBtn.textContent = 'Ver mis partidas';
    gameOverActions.appendChild(verPartidasBtn);
    gameOverCard.appendChild(trophyEl);
    gameOverCard.appendChild(gameOverTitle);
    gameOverCard.appendChild(gameOverSub);
    gameOverCard.appendChild(gameOverActions);
    gameOverOverlay.appendChild(gameOverCard);
    root.appendChild(gameOverOverlay);

    function renderMessages() {
      chatEl.innerHTML = '';
      state.messages.forEach(function (msg) {
        var bubble = el('div', {
          className: msg.role === 'miia' ? 'chat-bubble miia-bubble' : 'chat-bubble user-bubble',
          style: { padding: '12px 16px', borderRadius: '12px', maxWidth: '80%', alignSelf: msg.role === 'miia' ? 'flex-start' : 'flex-end' },
        });
        bubble.textContent = msg.text;
        chatEl.appendChild(bubble);
      });
      if (state.loading) {
        var typingEl = el('div', { className: 'typing-indicator', style: { alignSelf: 'flex-start', padding: '12px 16px' } }, 'MIIA esta pensando...');
        chatEl.appendChild(typingEl);
      }
    }

    function updateInputState() {
      var disabled = state.loading || state.gameOver;
      if (disabled) {
        textInput.setAttribute('disabled', 'true');
        sendBtn.setAttribute('disabled', 'true');
      } else {
        textInput.removeAttribute('disabled');
        sendBtn.removeAttribute('disabled');
      }
    }

    function updateGameOverOverlay() {
      if (state.gameOver) {
        gameOverSub.textContent = 'Turno ' + (state.gameState.turn || 0) + ' completado';
        gameOverOverlay.style.display = 'flex';
      } else {
        gameOverOverlay.style.display = 'none';
      }
    }

    function render() {
      renderMessages();
      updateInputState();
      updateGameOverOverlay();
    }

    async function handleSend(text) {
      var msg = (text || state.input).trim();
      if (!msg || state.loading || state.gameOver) return;
      state.input = '';
      textInput.value = '';
      state.messages = state.messages.concat([{ role: 'user', text: msg }]);
      state.loading = true;
      render();
      try {
        var token = await getToken();
        var res = await sendActionFn(state.sessionId, msg, token);
        var miiaText = (res && res.gmResponse) ? res.gmResponse : 'Turno procesado.';
        state.messages = state.messages.concat([{ role: 'miia', text: miiaText }]);
        if (res && res.state) state.gameState = res.state;
        if (res && res.state && res.state.status === 'finished') state.gameOver = true;
        state.loading = false;
        render();
      } catch {
        state.messages = state.messages.concat([{ role: 'miia', text: 'Error al procesar tu accion.' }]);
        state.loading = false;
        render();
      }
    }

    async function handleEnd() {
      if (!state.sessionId) return;
      try {
        var token = await getToken();
        await endSessionFn(state.sessionId, token);
      } catch {
        /* c8 ignore next */
      }
      state.gameOver = true;
      render();
    }

    function load(sessionId) {
      state.sessionId = sessionId;
      state.messages = [];
      state.gameState = {};
      state.input = '';
      state.loading = false;
      state.gameOver = false;
      render();
    }

    render();

    return {
      element: root,
      load,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
      _handleSend: handleSend,
      _handleEnd: handleEnd,
    };
  }

  return createActiveSessionPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
