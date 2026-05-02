/* c8 ignore start */
/**
 * session-detail-panel.js - TEC-LUDOMIIA-MIGRAR-21.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/sessions/[id]/page.tsx (Next.js, deprecado).
 *
 * Detalle de sesion completada con opcion de narrar y finalizar.
 *
 * Uso:
 *   const panel = createSessionDetailPanel({
 *     fetchSession:   async (sessionId, token) => session | null,
 *     narrateSession: async (sessionId, token) => { audioBase64, contentType, text },
 *     finishSession:  async (sessionId, token) => {},
 *     getToken:       async () => 'jwt',
 *     onFinish:       () => {},
 *   });
 *   panel.load('session-id');
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createSessionDetailPanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function el(tag, attrs) {
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
    return e;
  }

  function createSessionDetailPanel(opts) {
    opts = opts || {};
    var fetchSessionFn   = opts.fetchSession   || (async () => null);
    var narrateSessionFn = opts.narrateSession  || (async () => ({}));
    var finishSessionFn  = opts.finishSession   || (async () => null);
    var getToken         = opts.getToken        || (async () => '');
    var onFinish         = opts.onFinish        || function () {};

    var state = {
      sessionId: null,
      session:   null,
      loading:   false,
      narrateLoading: false,
      narrateText:    null,
      narrateAudio:   null,
      finishing:      false,
      error:          null,
    };

    var root = el('div', { className: 'session-detail-panel' });

    var loadingEl = el('div', { className: 'loading-state', style: { padding: '40px', textAlign: 'center' } });
    loadingEl.textContent = 'Cargando sesion...';

    var notFoundEl = el('div', { className: 'not-found-state', style: { padding: '40px', textAlign: 'center' } });
    notFoundEl.textContent = 'Sesion no encontrada.';

    var contentEl = el('div', { className: 'session-detail-content' });

    var titleEl      = el('h1', { className: 'session-detail-title' });
    var modeEl       = el('span', { className: 'session-detail-mode' });
    var statusEl     = el('span', { className: 'session-detail-status' });
    var dateEl       = el('span', { className: 'session-detail-date' });

    var metaEl = el('dl', { className: 'session-detail-meta' });
    var dtMode   = el('dt'); dtMode.textContent = 'Modo';
    var ddMode   = el('dd', { className: 'session-detail-mode-dd' });
    ddMode.appendChild(modeEl);
    var dtStatus = el('dt'); dtStatus.textContent = 'Estado';
    var ddStatus = el('dd', { className: 'session-detail-status-dd' });
    ddStatus.appendChild(statusEl);
    var dtDate   = el('dt'); dtDate.textContent = 'Iniciada';
    var ddDate   = el('dd', { className: 'session-detail-date-dd' });
    ddDate.appendChild(dateEl);
    metaEl.appendChild(dtMode); metaEl.appendChild(ddMode);
    metaEl.appendChild(dtStatus); metaEl.appendChild(ddStatus);
    metaEl.appendChild(dtDate); metaEl.appendChild(ddDate);

    var narrateBtn = el('button', { className: 'btn-primary narrate-btn', onClick: handleNarrate });
    narrateBtn.textContent = 'Narrar turno';

    var narrateResultEl = el('div', { className: 'narrate-result', style: { marginTop: '12px' } });

    var narrateSection = el('section', { className: 'narrate-section' });
    var narrateHeading = el('h2', { className: 'section-title' });
    narrateHeading.textContent = 'Narracion';
    narrateSection.appendChild(narrateHeading);
    narrateSection.appendChild(narrateBtn);
    narrateSection.appendChild(narrateResultEl);

    var finishBtn = el('button', { className: 'btn-danger finish-btn', onClick: handleFinish });
    finishBtn.textContent = 'Terminar sesion';

    var actionsEl = el('div', { className: 'session-detail-actions', style: { marginTop: '24px' } });
    actionsEl.appendChild(finishBtn);

    contentEl.appendChild(titleEl);
    contentEl.appendChild(metaEl);
    contentEl.appendChild(narrateSection);
    contentEl.appendChild(actionsEl);

    function render() {
      root.innerHTML = '';
      if (state.loading) {
        root.appendChild(loadingEl);
        return;
      }
      if (!state.session) {
        root.appendChild(notFoundEl);
        return;
      }
      var s = state.session;
      titleEl.textContent = 'Sesion: ' + (s.gameId || '');
      modeEl.textContent   = s.mode   || '';
      statusEl.textContent = s.status || '';
      try {
        dateEl.textContent = new Date(s.startedAt).toLocaleString('es-AR');
      } catch {
        /* c8 ignore next */
        dateEl.textContent = s.startedAt || '';
      }
      narrateBtn.textContent     = state.narrateLoading ? 'Narrando...' : 'Narrar turno';
      narrateBtn.disabled        = state.narrateLoading;
      finishBtn.textContent      = state.finishing ? 'Terminando...' : 'Terminar sesion';
      finishBtn.disabled         = state.finishing;
      narrateResultEl.innerHTML  = '';
      if (state.narrateAudio) {
        var audio = document.createElement('audio');
        audio.className  = 'narrate-audio';
        audio.controls   = true;
        audio.src        = state.narrateAudio;
        narrateResultEl.appendChild(audio);
      } else if (state.narrateText) {
        var p = document.createElement('p');
        p.className   = 'narrate-text';
        p.textContent = state.narrateText;
        narrateResultEl.appendChild(p);
      }
      root.appendChild(contentEl);
    }

    async function load(sessionId) {
      state.sessionId = sessionId;
      state.session   = null;
      state.loading   = true;
      state.narrateLoading = false;
      state.narrateText    = null;
      state.narrateAudio   = null;
      state.finishing      = false;
      state.error          = null;
      render();
      try {
        var token   = await getToken();
        var session = await fetchSessionFn(sessionId, token);
        state.session = session;
      } catch {
        /* c8 ignore next */
        state.session = null;
      }
      state.loading = false;
      render();
    }

    async function handleNarrate() {
      if (state.narrateLoading || !state.sessionId) return;
      state.narrateLoading = true;
      state.narrateText    = null;
      state.narrateAudio   = null;
      render();
      try {
        var token = await getToken();
        var data  = await narrateSessionFn(state.sessionId, token);
        if (data && data.audioBase64 && data.contentType) {
          try {
            var bytes = Uint8Array.from(atob(data.audioBase64), function (c) { return c.charCodeAt(0); });
            var blob  = new Blob([bytes], { type: data.contentType });
            state.narrateAudio = URL.createObjectURL(blob);
          } catch {
            /* c8 ignore next */
            state.narrateText = data.text || 'Error al procesar audio';
          }
        } else {
          state.narrateText = (data && data.text) ? data.text : '';
        }
      } catch (err) {
        state.narrateText = 'Error al obtener narracion';
      }
      state.narrateLoading = false;
      render();
    }

    async function handleFinish() {
      if (state.finishing || !state.sessionId) return;
      state.finishing = true;
      render();
      try {
        var token = await getToken();
        await finishSessionFn(state.sessionId, token);
        state.finishing = false;
        onFinish();
      } catch {
        state.finishing = false;
        render();
      }
    }

    render();

    return {
      element:          root,
      load,
      _state:           state,
      _setState:        function (s) { Object.assign(state, s); render(); },
      _handleNarrate:   handleNarrate,
      _handleFinish:    handleFinish,
    };
  }

  return createSessionDetailPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
