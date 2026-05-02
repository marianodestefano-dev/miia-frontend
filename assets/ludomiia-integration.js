'use strict';

/**
 * ludomiia-integration.js -- VI-INTG-1 + VI-INTG-2
 *
 * Wire-in entre owner-dashboard.html sec-ludomiia y los panels TEC:
 *   - selector-juego.js (lista juegos + click Jugar)
 *   - jugar-con-miia-panel.js (sesion activa con MIIA coach)
 *
 * Expone window.LudoMiiaIntegration con:
 *   init(opts)        -> mount selector-juego en host element
 *   showUpgradeCard() -> reemplaza host con CTA Contratar
 *   mountSelector()   -> monta selector y wirea callbacks
 *   mountJugar(...)   -> monta sesion activa
 */

(function (root, factory) {
  /* istanbul ignore else: jest siempre cae en module.exports; rama else solo aplica al cargar via <script> */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.LudoMiiaIntegration = factory();
  }
}((function () {
  /* istanbul ignore next: jest no tiene window, siempre toma globalThis */
  if (typeof window !== 'undefined') return window;
  return globalThis;
}()), function () {

  function clearHost(host) {
    if (!host) return;
    while (host.firstChild) host.removeChild(host.firstChild);
  }

  function showUpgradeCard(host, opts) {
    if (!host) return;
    clearHost(host);
    const card = (opts && opts.document || document).createElement('div');
    card.className = 'card';
    card.dataset.testid = 'ludomiia-upgrade-card';
    card.innerHTML =
      '<div class="card-title">LudoMIIA</div>' +
      '<p style="color:var(--text-2);font-size:13px;margin-bottom:12px;">' +
      'Tu MIIA principal incluye LudoMIIA gratis. O contratalo standalone por $5 USD/mes.</p>' +
      '<div style="display:flex;gap:8px;"><a href="/precios.html#ludomiia" class="btn btn-primary btn-sm">Contratar</a></div>';
    host.appendChild(card);
  }

  async function mountSelector(host, deps) {
    if (!host) throw new Error('host requerido');
    const factory = deps && deps.createSelectorJuegoPanel;
    if (typeof factory !== 'function') throw new Error('selector-juego.js no cargado');
    clearHost(host);
    const panel = factory({
      fetchGames: deps.fetchGames,
      getToken: deps.getToken,
      isOwner: !!deps.isOwner,
      onSelect: deps.onSelect || (() => {}),
      onStart: (game) => mountJugar(host, deps, game),
      onAddGame: deps.onAddGame || (() => { if (deps && deps.locationHash) deps.locationHash('#ludomiia/add-game'); }),
    });
    host.appendChild(panel.element);
    if (typeof panel.refresh === 'function') {
      try { await panel.refresh(); } catch (e) { console.warn('[LUDO-INTG] refresh fail:', e.message); }
    }
    return panel;
  }

  async function mountJugar(host, deps, game) {
    if (!host) throw new Error('host requerido');
    const factory = deps && deps.createJugarConMiiaPanel;
    if (typeof factory !== 'function') throw new Error('jugar-con-miia-panel.js no cargado');
    if (!game) throw new Error('game requerido');
    let session;
    try {
      session = await deps.createSession(game, await deps.getToken());
    } catch (e) {
      console.warn('[LUDO-INTG] createSession fail, mostrando selector:', e.message);
      return mountSelector(host, deps);
    }
    clearHost(host);
    const panel = factory({
      sessionId: session.id || session.sessionId,
      fetchSession: deps.fetchSession,
      sendMessage: deps.sendMessage,
      endGame: deps.endGame,
      getToken: deps.getToken,
      onEnd: () => mountSelector(host, deps),
    });
    host.appendChild(panel.element);
    if (typeof panel.refresh === 'function') {
      try { await panel.refresh(); } catch (e) { console.warn('[LUDO-INTG] refresh fail:', e.message); }
    }
    return panel;
  }

  async function init(opts) {
    const o = opts || {};
    const host = o.host;
    if (!host) throw new Error('host requerido');
    const isActive = typeof o.isProductActive === 'function' ? !!(await o.isProductActive('ludomiia')) : false;
    if (!isActive) {
      showUpgradeCard(host, o);
      return { mounted: false, reason: 'product_inactive' };
    }
    await mountSelector(host, o);
    return { mounted: true };
  }

  return { init, mountSelector, mountJugar, showUpgradeCard, _clearHost: clearHost };
}));
