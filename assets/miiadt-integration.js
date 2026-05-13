'use strict';

/**
 * miiadt-integration.js -- VI-INTG-MIIADT
 *
 * Wire-in entre owner-dashboard.html sec-miiadt y los 3 panels TEC:
 *   - liga-panel.js    => createLigaPanel
 *   - equipo-panel.js  => createEquipoPanel
 *   - mercado-panel.js => createMercadoPanel
 *
 * Expone window.MiiadtIntegration con:
 *   init(opts)        -> mount 3 panels en host
 *   showUpgradeCard() -> reemplaza host con CTA Contratar
 *   mountPanels()     -> monta los 3 panels en orden vertical
 */

(function (root, factory) {
  /* istanbul ignore else: jest siempre cae en module.exports; rama else solo aplica via <script> */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.MiiadtIntegration = factory();
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
    card.dataset.testid = 'miiadt-upgrade-card';
    card.innerHTML =
      '<div class="card-title">MIIADT</div>' +
      '<p style="color:var(--text-2);font-size:13px;margin-bottom:12px;">' +
      'Tu MIIA principal incluye MIIADT (Fantasy Futbol) gratis. O contratalo standalone por $3 USD/mes.</p>' +
      '<div style="display:flex;gap:8px;"><a href="/precios.html#miiadt" class="btn btn-primary btn-sm">Contratar</a></div>';
    host.appendChild(card);
  }

  function mountSection(host, title, doc) {
    const section = (doc || document).createElement('div');
    section.className = 'card';
    section.style.marginBottom = '16px';
    section.dataset.miiadtSection = title;
    const heading = (doc || document).createElement('div');
    heading.className = 'card-title';
    heading.textContent = title;
    section.appendChild(heading);
    const mount = (doc || document).createElement('div');
    mount.className = 'miiadt-panel-mount';
    section.appendChild(mount);
    host.appendChild(section);
    return mount;
  }

  async function mountPanels(host, deps) {
    if (!host) throw new Error('host requerido');
    const ligaFactory    = deps && deps.createLigaPanel;
    const equipoFactory  = deps && deps.createEquipoPanel;
    const mercadoFactory = deps && deps.createMercadoPanel;
    if (typeof ligaFactory !== 'function')    throw new Error('liga-panel.js no cargado');
    if (typeof equipoFactory !== 'function')  throw new Error('equipo-panel.js no cargado');
    if (typeof mercadoFactory !== 'function') throw new Error('mercado-panel.js no cargado');
    clearHost(host);
    /* istanbul ignore next: jest siempre tiene document global */
    const doc = (deps && deps.document) || (typeof document !== 'undefined' ? document : null);

    // Liga
    const ligaMount = mountSection(host, 'Liga', doc);
    const liga = ligaFactory({
      fetchLeague: deps.fetchLeague || (async () => null),
      getToken: deps.getToken || (async () => ''),
      isOwner: !!deps.isOwner,
      onJoin: deps.onJoin || (() => {}),
      onCreateTeam: deps.onCreateTeam || (() => {}),
    });
    ligaMount.appendChild(liga.element);

    // Equipo
    const equipoMount = mountSection(host, 'Mi equipo', doc);
    const equipo = equipoFactory({
      fetchEquipo: deps.fetchEquipo || (async () => null),
      getToken: deps.getToken || (async () => ''),
    });
    equipoMount.appendChild(equipo.element);

    // Mercado
    const mercadoMount = mountSection(host, 'Mercado', doc);
    const mercado = mercadoFactory({
      fetchMercado: deps.fetchMercado || (async () => null),
      getToken: deps.getToken || (async () => ''),
    });
    mercadoMount.appendChild(mercado.element);

    // ═════════ PANELES ARQ firma Mariano 2026-05-12 21:30 COT ═════════
    const panels = { liga, equipo, mercado };

    // Sponsors (firma 02/05 §5)
    const sponsorsFactory = deps && deps.createSponsorsPanel;
    if (typeof sponsorsFactory === 'function') {
      const sponsorsMount = mountSection(host, 'Sponsors', doc);
      const sponsors = sponsorsFactory({
        fetchCurrent: deps.fetchSponsor || (async () => null),
        saveSponsor: deps.saveSponsor || (async () => ({ ok: true })),
        getToken: deps.getToken || (async () => ''),
      });
      sponsorsMount.appendChild(sponsors.element);
      panels.sponsors = sponsors;
    }

    // Infraestructura (firma 02/05 §8 + v2/v3)
    const infraFactory = deps && deps.createInfraestructuraPanel;
    if (typeof infraFactory === 'function') {
      const infraMount = mountSection(host, 'Infraestructura', doc);
      const infra = infraFactory({
        fetchLevels: deps.fetchInfraestructura || (async () => ({})),
        upgrade: deps.upgradeFacility || (async () => ({ ok: true })),
        getToken: deps.getToken || (async () => ''),
      });
      infraMount.appendChild(infra.element);
      panels.infraestructura = infra;
    }

    // Apuestas P2P (firma 02/05 §9 + v3)
    const apuestasFactory = deps && deps.createApuestasPanel;
    if (typeof apuestasFactory === 'function') {
      const apuestasMount = mountSection(host, 'Apuestas Versus', doc);
      const apuestas = apuestasFactory({
        fetchBets: deps.fetchBets || (async () => []),
        propose: deps.proposeBet || (async () => ({ ok: true })),
        respond: deps.respondBet || (async () => ({ ok: true })),
        getToken: deps.getToken || (async () => ''),
      });
      apuestasMount.appendChild(apuestas.element);
      panels.apuestas = apuestas;
    }

    // Staff (IDEA #051 §10 v3)
    const staffFactory = deps && deps.createStaffPanel;
    if (typeof staffFactory === 'function') {
      const staffMount = mountSection(host, 'Staff', doc);
      const staff = staffFactory({
        fetchPayroll: deps.fetchPayroll || (async () => ({ payroll: 0, staffCount: 0 })),
        generateAndHire: deps.hireStaff || (async () => ({ ok: true })),
        getToken: deps.getToken || (async () => ''),
      });
      staffMount.appendChild(staff.element);
      panels.staff = staff;
    }

    // Refresh inicial paralelo (3 viejos + 4 nuevos opcionales)
    const refreshes = [];
    for (const key of Object.keys(panels)) {
      const p = panels[key];
      if (typeof p.load === 'function') {
        refreshes.push(p.load().catch((e) => console.warn('[MIIADT-INTG] ' + key + ' load fail:', e.message)));
      }
    }
    await Promise.all(refreshes);
    return panels;
  }

  async function init(opts) {
    const o = opts || {};
    const host = o.host;
    if (!host) throw new Error('host requerido');
    const isActive = typeof o.isProductActive === 'function' ? !!(await o.isProductActive('miiadt')) : false;
    if (!isActive) {
      showUpgradeCard(host, o);
      return { mounted: false, reason: 'product_inactive' };
    }
    const panels = await mountPanels(host, o);
    return { mounted: true, panels };
  }

  return { init, mountPanels, showUpgradeCard, _clearHost: clearHost, _mountSection: mountSection };
}));
