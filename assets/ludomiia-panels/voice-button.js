/* c8 ignore start */
/**
 * voice-button.js - TEC-LUDOMIIA-MIGRAR-24.
 *
 * Componente reutilizable que reemplaza
 * apps/web-ludomiia/app/components/VoiceButton.tsx (Next.js, deprecado).
 *
 * Boton de voz con estados idle/listening/processing usando SpeechRecognition.
 *
 * Uso:
 *   const vb = createVoiceButton({ onTranscript: (text) => {}, lang: 'es-ES' });
 *   container.appendChild(vb.element);
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createVoiceButton = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var LABELS = { idle: '🎤', listening: '⏹', processing: '⏳' };

  function createVoiceButton(opts) {
    opts = opts || {};
    var onTranscript = opts.onTranscript || function () {};
    var lang         = opts.lang         || 'es-ES';

    var state = { status: 'idle', supported: false };
    var rec   = null;

    /* c8 ignore next */
    var SR = (typeof window !== 'undefined')
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    var btn = document.createElement('button');

    if (!SR) {
      btn.className   = 'btn-ghost btn-sm voice-btn voice-btn--unsupported';
      btn.textContent = LABELS.idle;
      btn.disabled    = true;
      btn.title       = 'Voz no soportada en este navegador';
      return { element: btn, _state: state };
    }

    state.supported = true;
    rec = new SR();
    rec.lang           = lang;
    rec.continuous     = false;
    rec.interimResults = false;

    rec.onresult = function (e) {
      var text = e.results[0][0].transcript;
      onTranscript(text);
      state.status = 'idle';
      render();
    };

    rec.onerror = function () {
      state.status = 'idle';
      render();
    };

    rec.onend = function () {
      if (state.status === 'listening') {
        state.status = 'idle';
        render();
      }
    };

    function render() {
      /* c8 ignore next */
      btn.textContent = LABELS[state.status] || LABELS.idle;
      btn.title = state.status === 'listening' ? 'Detener grabacion' : 'Hablar';
      btn.className = 'voice-btn voice-btn--' + state.status;
    }

    btn.addEventListener('click', function () {
      if (state.status === 'listening') {
        rec.stop();
        state.status = 'processing';
      } else {
        rec.start();
        state.status = 'listening';
      }
      render();
    });

    render();

    return {
      element: btn,
      _state:  state,
      _rec:    rec,
    };
  }

  return createVoiceButton;
/* c8 ignore start */
}));
/* c8 ignore stop */
