/* c8 ignore start */
/**
 * audio-narrator.js - TEC-LUDOMIIA-MIGRAR-25.
 *
 * Componente reutilizable que reemplaza
 * apps/web-ludomiia/components/AudioNarrator.tsx (Next.js, deprecado).
 *
 * Reproductor de audio narrado con play/pause, replay y velocidad 0.75/1/1.25x.
 * Soporta fallbackText cuando no hay audio.
 *
 * Uso:
 *   const an = createAudioNarrator({ audioUrl: '...', fallbackText: '...' });
 *   container.appendChild(an.element);
 *   // actualizar despues:
 *   an.update({ audioUrl: '...nueva', fallbackText: null });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createAudioNarrator = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var SPEEDS = [0.75, 1, 1.25];

  function createAudioNarrator(opts) {
    opts = opts || {};
    var state = {
      audioUrl:     opts.audioUrl     || null,
      fallbackText: opts.fallbackText || null,
      playing:      false,
      speed:        1,
    };

    var audioEl = null;
    var root = document.createElement('div');

    function render() {
      root.innerHTML = '';
      if (!state.audioUrl) {
        root.className = 'audio-narrator audio-narrator--fallback';
        var inner = document.createElement('div');
        inner.className = 'audio-narrator-fallback';
        var p = document.createElement('p');
        if (state.fallbackText) {
          p.className   = 'audio-fallback-text';
          p.textContent = state.fallbackText;
        } else {
          p.className   = 'audio-fallback-empty';
          p.textContent = 'Audio no disponible';
        }
        inner.appendChild(p);
        root.appendChild(inner);
        return;
      }

      root.className = 'audio-narrator';
      audioEl = document.createElement('audio');
      audioEl.className = 'narrator-audio';
      audioEl.src       = state.audioUrl;
      audioEl.preload   = 'auto';
      audioEl.addEventListener('ended', function () {
        state.playing = false;
        renderControls();
      });
      root.appendChild(audioEl);

      var controlsEl = document.createElement('div');
      controlsEl.className = 'audio-controls';

      var playBtn = document.createElement('button');
      playBtn.className = 'audio-btn audio-btn-play';
      /* c8 ignore next */
      playBtn.setAttribute('aria-label', state.playing ? 'Pausar narracion' : 'Reproducir narracion');
      /* c8 ignore next */
      playBtn.textContent = state.playing ? '⏸' : '▶';
      playBtn.addEventListener('click', function () {
        /* c8 ignore next */
        if (!audioEl) return;
        if (state.playing) {
          audioEl.pause();
          state.playing = false;
          renderControls();
        } else {
          var p = audioEl.play();
          if (p && typeof p.then === 'function') {
            p.then(function () {
              state.playing = true;
              renderControls();
            }).catch(function () {
              state.playing = false;
              renderControls();
            });
          } else {
            state.playing = true;
            renderControls();
          }
        }
      });
      controlsEl.appendChild(playBtn);

      var replayBtn = document.createElement('button');
      replayBtn.className = 'audio-btn audio-btn-replay';
      replayBtn.setAttribute('aria-label', 'Repetir desde el inicio');
      replayBtn.textContent = '↺';
      replayBtn.addEventListener('click', function () {
        /* c8 ignore next */
        if (!audioEl) return;
        audioEl.currentTime = 0;
        var p = audioEl.play();
        if (p && typeof p.then === 'function') {
          p.then(function () {
            state.playing = true;
            renderControls();
          }).catch(function () {
            state.playing = false;
            renderControls();
          });
        } else {
          state.playing = true;
          renderControls();
        }
      });
      controlsEl.appendChild(replayBtn);

      var speedsEl = document.createElement('div');
      speedsEl.className = 'audio-speeds';
      SPEEDS.forEach(function (s) {
        var sb = document.createElement('button');
        sb.className = 'speed-btn' + (state.speed === s ? ' active' : '');
        sb.setAttribute('data-speed', String(s));
        sb.textContent = s + 'x';
        sb.setAttribute('aria-pressed', String(state.speed === s));
        sb.addEventListener('click', function () {
          state.speed = s;
          /* c8 ignore next */
          if (audioEl) audioEl.playbackRate = s;
          renderControls();
        });
        speedsEl.appendChild(sb);
      });
      controlsEl.appendChild(speedsEl);

      root.appendChild(controlsEl);
    }

    function renderControls() {
      /* c8 ignore next */
      if (!state.audioUrl) return;
      var playBtn = root.querySelector('.audio-btn-play');
      /* c8 ignore next */
      if (playBtn) {
        playBtn.textContent = state.playing ? '⏸' : '▶';
        playBtn.setAttribute('aria-label', state.playing ? 'Pausar narracion' : 'Reproducir narracion');
      }
      root.querySelectorAll('.speed-btn').forEach(function (sb) {
        var s = parseFloat(sb.getAttribute('data-speed'));
        sb.className = 'speed-btn' + (state.speed === s ? ' active' : '');
        sb.setAttribute('aria-pressed', String(state.speed === s));
      });
    }

    function update(newOpts) {
      newOpts = newOpts || {};
      state.audioUrl     = newOpts.audioUrl     !== undefined ? newOpts.audioUrl     : state.audioUrl;
      state.fallbackText = newOpts.fallbackText  !== undefined ? newOpts.fallbackText : state.fallbackText;
      state.playing = false;
      render();
    }

    render();

    return {
      element: root,
      update,
      _state: state,
    };
  }

  return createAudioNarrator;
/* c8 ignore start */
}));
/* c8 ignore stop */
