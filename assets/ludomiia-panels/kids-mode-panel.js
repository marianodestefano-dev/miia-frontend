/* c8 ignore start */
/**
 * kids-mode-panel.js - TEC-LUDOMIIA-MIGRAR-6.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/kids/* (Next.js, deprecado).
 *
 * Modo infantil: interfaz simplificada con personajes, colores
 * y pasos guiados para ninos.
 *
 * Uso:
 *   const panel = createKidsModePanel({
 *     sessionId: 's1',
 *     fetchSession: async (id, token) => res.json(),
 *     sendChoice: async (id, choice, token) => res.json(),
 *     endGame: async (id, token) => res.json(),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     onEnd: (result) => location.hash = '#ludomiia',
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createKidsModePanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var CHARACTERS = ['🦁', '🐸', '🐼', '🐧', '🦊', '🐨'];
  var COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#6C5CE7'];

  function el(tag, attrs) {
    var args = Array.prototype.slice.call(arguments, 2);
    var e = document.createElement(tag);
    /* c8 ignore next */
    if (attrs) {
      var keys = Object.keys(attrs);
      for (var ki = 0; ki < keys.length; ki++) {
        var k = keys[ki];
        if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
        else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === 'className') e.className = attrs[k];
        /* c8 ignore next */
        else e.setAttribute(k, attrs[k]);
      }
    }
    /* c8 ignore start */
    for (var ci = 0; ci < args.length; ci++) {
      var c = args[ci];
      if (c == null) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    /* c8 ignore stop */
    return e;
  }

  function getCharacter(index) {
    return CHARACTERS[index % CHARACTERS.length];
  }

  function getColor(index) {
    return COLORS[index % COLORS.length];
  }

  function renderChoiceBtn(choice, idx, onChoose) {
    var btn = el('button', {
      className: 'kids-choice',
      style: {
        background: getColor(idx),
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        padding: '16px 24px',
        fontSize: '18px',
        fontWeight: '700',
        cursor: 'pointer',
        margin: '8px',
        minWidth: '140px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'transform 0.1s',
      },
    });
    /* c8 ignore next */
    btn.textContent = getCharacter(idx) + ' ' + (choice.label || choice.id || String(idx + 1));
    btn.addEventListener('click', function () { onChoose(choice); });
    return btn;
  }

  function renderStep(step, choices, onChoose) {
    var wrap = el('div', { style: { textAlign: 'center', padding: '24px 16px' } });
    var prompt = el('p', {
      style: {
        fontSize: '22px',
        fontWeight: '700',
        color: 'var(--text-1)',
        marginBottom: '24px',
        lineHeight: '1.4',
      },
    });
    /* c8 ignore next */
    prompt.textContent = step.prompt || '¿Que hacemos ahora?';
    wrap.appendChild(prompt);
    var row = el('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center' } });
    choices.forEach(function (c, i) {
      row.appendChild(renderChoiceBtn(c, i, onChoose));
    });
    wrap.appendChild(row);
    return wrap;
  }

  function renderComplete(result) {
    var wrap = el('div', { style: { textAlign: 'center', padding: '40px 16px' } });
    var star = el('div', { style: { fontSize: '80px', marginBottom: '16px' } });
    star.textContent = '🌟';
    var msg = el('p', { style: { fontSize: '24px', fontWeight: '700', color: 'var(--text-1)', marginBottom: '8px' } });
    /* c8 ignore next */
    msg.textContent = (result && result.message) ? result.message : '¡Muy bien! Terminaste la partida.';
    var score = el('p', { style: { fontSize: '18px', color: 'var(--text-3)' } });
    /* c8 ignore next */
    score.textContent = (result && result.score != null) ? '⭐ ' + String(result.score) + ' puntos' : '';
    wrap.appendChild(star);
    wrap.appendChild(msg);
    wrap.appendChild(score);
    return wrap;
  }

  function createKidsModePanel(opts) {
    opts = opts || {};
    var sessionId = opts.sessionId || null;
    var fetchSession = opts.fetchSession || (async () => null);
    /* c8 ignore next */
    var sendChoiceFn = opts.sendChoice || (async () => null);
    /* c8 ignore next */
    var endGameFn = opts.endGame || (async () => null);
    var getToken = opts.getToken || (async () => '');
    var onEnd = opts.onEnd || function () {};

    var state = {
      session: null,
      loading: true,
      error: null,
      choosing: false,
      ending: false,
    };

    var root = el('div', {
      style: {
        maxWidth: '700px',
        margin: '0 auto',
        background: 'var(--bg-surface)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      },
    });

    // Header bar
    var headerEl = el('div', {
      style: {
        background: 'linear-gradient(135deg, var(--miia-cyan), var(--miia-violet))',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
    });
    var titleEl = el('h2', { style: { fontWeight: '800', fontSize: '22px', margin: '0', color: 'white' } });
    titleEl.textContent = 'Modo Ninos';
    var stepBadge = el('span', { style: { background: 'rgba(255,255,255,0.25)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '13px' } });
    stepBadge.textContent = '';
    headerEl.appendChild(titleEl);
    headerEl.appendChild(stepBadge);
    root.appendChild(headerEl);

    // Body
    var bodyEl = el('div', { style: { padding: '24px', minHeight: '300px' } });
    root.appendChild(bodyEl);

    // Footer
    var footerEl = el('div', { style: { padding: '0 24px 24px', display: 'flex', justifyContent: 'flex-end' } });
    var endBtn = el('button', { className: 'btn-ghost btn-sm', onClick: handleEnd });
    endBtn.textContent = 'Salir del juego';
    footerEl.appendChild(endBtn);
    root.appendChild(footerEl);

    function render() {
      bodyEl.innerHTML = '';
      if (state.loading) {
        var sk = el('div', { style: { textAlign: 'center', padding: '60px' } });
        sk.textContent = '⏳';
        bodyEl.appendChild(sk);
        stepBadge.textContent = '';
        endBtn.setAttribute('disabled', 'true');
        return;
      }
      if (state.error) {
        var errP = el('p', { style: { color: 'var(--error, #f44)', textAlign: 'center', padding: '40px' } });
        errP.textContent = state.error;
        bodyEl.appendChild(errP);
        endBtn.setAttribute('disabled', 'true');
        return;
      }
      var s = state.session || {};
      var active = s.status !== 'ended';
      endBtn.removeAttribute('disabled');
      if (!active) {
        stepBadge.textContent = 'Terminado';
        bodyEl.appendChild(renderComplete(s.result || null));
        endBtn.setAttribute('disabled', 'true');
        return;
      }
      var step = s.currentStep || {};
      var stepNum = s.stepNumber || 0;
      var totalSteps = s.totalSteps || 0;
      stepBadge.textContent = totalSteps > 0 ? 'Paso ' + stepNum + ' / ' + totalSteps : 'Jugando';
      var canChoose = !state.choosing && !state.ending;
      bodyEl.appendChild(renderStep(step, step.choices || [], function (choice) {
        if (!canChoose) return;
        handleChoose(choice);
      }));
    }

    async function handleChoose(choice) {
      if (state.choosing || state.ending) return;
      state.choosing = true;
      render();
      try {
        var token = await getToken();
        var updated = await sendChoiceFn(sessionId, choice, token);
        if (updated && typeof updated === 'object') state.session = updated;
        state.choosing = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al enviar eleccion';
        state.choosing = false;
        render();
      }
    }

    async function handleEnd() {
      if (state.ending || state.choosing) return;
      state.ending = true;
      render();
      try {
        var token = await getToken();
        var result = await endGameFn(sessionId, token);
        state.ending = false;
        if (state.session) state.session = Object.assign({}, state.session, { status: 'ended' });
        render();
        onEnd(result);
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al terminar partida';
        state.ending = false;
        render();
      }
    }

    async function refresh() {
      state.loading = true;
      state.error = null;
      render();
      try {
        var token = await getToken();
        var session = await fetchSession(sessionId, token);
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
      _setState: function (s) { Object.assign(state, s); render(); },
      _handleChoose: handleChoose,
      _handleEnd: handleEnd,
    };
  }

  return createKidsModePanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
