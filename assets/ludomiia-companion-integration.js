'use strict';

/**
 * ludomiia-companion-integration.js -- VI-INTG-LUDOMIIA-COMPLETE
 *
 * Wrapper que integra los panels companion de LudoMIIA en owner-dashboard.html:
 *   - ai-coach-panel.js  (MIIA Coach: analisis + tips estrategicos por sesion)
 *   - puntuacion-panel.js (Tabla de puntuaciones + historial)
 *
 * Flujo:
 *   1. init(opts) en initLudoMiiaSection() — registra hosts + factories + deps
 *   2. mountCompanions(sessionId) cuando se crea la sesion de juego
 *   3. clearCompanions() cuando la sesion termina (endGame)
 *
 * Expone window.LudoMiiaCompanionIntegration con:
 *   init(opts)                 -> registra config, muestra placeholder
 *   mountCompanions(sessionId) -> monta ambos panels para la sesion
 *   clearCompanions()          -> limpia y muestra placeholder
 */

(function (root, factory) {
  /* istanbul ignore else */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.LudoMiiaCompanionIntegration = factory();
  }
}((function () {
  /* istanbul ignore next */
  if (typeof window !== 'undefined') return window;
  return globalThis;
}()), function () {

  // Estado interno del modulo
  let _config = null;

  // ── helpers ───────────────────────────────────────────────────────────────

  function _clearHost(host) {
    if (!host) return;
    while (host.firstChild) host.removeChild(host.firstChild);
  }

  function _placeholder(host, text, doc) {
    if (!host) return;
    _clearHost(host);
    const d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d) return;
    const p = d.createElement('p');
    p.setAttribute('data-testid', 'companion-placeholder');
    p.style.cssText = 'color:var(--text-3,#888);font-size:13px;padding:12px 0;margin:0;';
    p.textContent = text;
    host.appendChild(p);
  }

  // ── API publica ───────────────────────────────────────────────────────────

  /**
   * init(opts)
   *
   * opts:
   *   aiCoachHost      {Element}   mount point para ai-coach
   *   puntuacionHost   {Element}   mount point para puntuacion
   *   getToken         {Function}  () => Promise<string>
   *   apiBase          {string}    base URL del backend LudoMIIA
   *   createAiCoachPanel   {Function}  factory de ai-coach-panel.js
   *   createPuntuacionPanel {Function} factory de puntuacion-panel.js
   *   document         {Document}  inyectable para tests
   */
  function init(opts) {
    opts = opts || {};
    const aiCoachHost = opts.aiCoachHost || null;
    const puntuacionHost = opts.puntuacionHost || null;

    _config = {
      aiCoachHost,
      puntuacionHost,
      getToken: opts.getToken || (async () => ''),
      apiBase: opts.apiBase || '',
      createAiCoachPanel: opts.createAiCoachPanel || null,
      createPuntuacionPanel: opts.createPuntuacionPanel || null,
      document: opts.document || (typeof document !== 'undefined' ? document : null),
    };

    // Mostrar placeholder inicial en ambos hosts
    _placeholder(aiCoachHost, 'Inicia una partida para ver el coach de MIIA.', _config.document);
    _placeholder(puntuacionHost, 'Las puntuaciones aparecen cuando hay una sesion activa.', _config.document);

    return { initialized: true };
  }

  /**
   * mountCompanions(sessionId)
   *
   * Monta ai-coach y puntuacion para la sesion activa.
   * Retorna { aiCoach: panel|null, puntuacion: panel|null }
   */
  function mountCompanions(sessionId) {
    if (!_config) return { aiCoach: null, puntuacion: null };
    if (!sessionId) {
      clearCompanions();
      return { aiCoach: null, puntuacion: null };
    }

    const { aiCoachHost, puntuacionHost, getToken, apiBase, createAiCoachPanel, createPuntuacionPanel } = _config;
    const doc = _config.document;

    let aiCoachPanel = null;
    let puntuacionPanel = null;

    // Montar ai-coach
    if (aiCoachHost && typeof createAiCoachPanel === 'function') {
      _clearHost(aiCoachHost);
      try {
        aiCoachPanel = createAiCoachPanel({
          sessionId,
          fetchAnalysis: async (id, token) => {
            const r = await fetch(apiBase + '/api/ludo/sessions/' + id + '/coach', {
              headers: { Authorization: 'Bearer ' + token },
            });
            if (!r.ok) throw new Error('coach_fetch_failed');
            return r.json();
          },
          requestTip: async (id, context, token) => {
            const r = await fetch(apiBase + '/api/ludo/sessions/' + id + '/coach/tip', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
              body: JSON.stringify({ context }),
            });
            if (!r.ok) throw new Error('tip_request_failed');
            return r.json();
          },
          getToken,
          onClose: () => clearCompanions(),
        });
        aiCoachHost.appendChild(aiCoachPanel.element);
        if (typeof aiCoachPanel.refresh === 'function') {
          aiCoachPanel.refresh().catch(function (e) {
            console.warn('[LUDO-COMPANION] ai-coach refresh fail:', e.message);
          });
        }
      } catch (e) {
        console.warn('[LUDO-COMPANION] ai-coach mount fail:', e.message);
        _placeholder(aiCoachHost, 'Error cargando MIIA Coach: ' + e.message, doc);
      }
    } else if (aiCoachHost) {
      _placeholder(aiCoachHost, 'Panel AI Coach no disponible.', doc);
    }

    // Montar puntuacion
    if (puntuacionHost && typeof createPuntuacionPanel === 'function') {
      _clearHost(puntuacionHost);
      try {
        puntuacionPanel = createPuntuacionPanel({
          sessionId,
          getScores: async (id, token) => {
            const r = await fetch(apiBase + '/api/ludo/sessions/' + id + '/scores', {
              headers: { Authorization: 'Bearer ' + token },
            });
            if (!r.ok) throw new Error('scores_fetch_failed');
            return r.json();
          },
          getToken,
          onClose: () => clearCompanions(),
        });
        puntuacionHost.appendChild(puntuacionPanel.element);
        if (typeof puntuacionPanel.refresh === 'function') {
          puntuacionPanel.refresh().catch(function (e) {
            console.warn('[LUDO-COMPANION] puntuacion refresh fail:', e.message);
          });
        }
      } catch (e) {
        console.warn('[LUDO-COMPANION] puntuacion mount fail:', e.message);
        _placeholder(puntuacionHost, 'Error cargando Puntuacion: ' + e.message, doc);
      }
    } else if (puntuacionHost) {
      _placeholder(puntuacionHost, 'Panel Puntuacion no disponible.', doc);
    }

    return { aiCoach: aiCoachPanel, puntuacion: puntuacionPanel };
  }

  /**
   * clearCompanions()
   *
   * Limpia ambos hosts y muestra placeholders de "sin sesion".
   */
  function clearCompanions() {
    if (!_config) return;
    _placeholder(_config.aiCoachHost, 'Inicia una partida para ver el coach de MIIA.', _config.document);
    _placeholder(_config.puntuacionHost, 'Las puntuaciones aparecen cuando hay una sesion activa.', _config.document);
  }

  // Exponer _resetForTest solo en entorno Node (tests)
  /* istanbul ignore next */
  function _resetForTest() { _config = null; }

  return { init, mountCompanions, clearCompanions, _resetForTest, _placeholder };
}));
