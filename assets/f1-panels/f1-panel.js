/* c8 ignore start */
/**
 * f1-panel.js — T-MIIAF1-PANEL-1
 *
 * Panel UMD integrable: tab standings pilotos, tab calendario GPs, adoptar piloto.
 *
 * Uso:
 *   const panel = createF1Panel({
 *     fetchStandings: async (token) => fetch('/api/f1/standings/drivers/2026', {...}).then(r => r.json()),
 *     fetchCalendar:  async (token) => fetch('/api/f1/calendar/2026', {...}).then(r => r.json()),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     onAdopt: (driverId, token) => fetch('/api/f1/adopt', { method:'POST', ... }),
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createF1Panel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function el(tag, attrs) {
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
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      /* c8 ignore next */
      if (c == null) continue;
      /* c8 ignore next */
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  const F1_RED = '#E10600';

  function renderSkeleton(parent, rows) {
    parent.innerHTML = '';
    const n = rows || 5;
    for (let i = 0; i < n; i += 1) {
      parent.appendChild(el('div', {
        className: 'f1-skeleton',
        style: {
          height: '44px', background: 'var(--bg-elevated)', borderRadius: '6px',
          marginBottom: '6px', opacity: String(1 - i * 0.15),
        },
      }));
    }
  }

  function renderDriverRow(driver, onAdoptDriver) {
    const adopted = !!driver.adoptedByOwner;
    const row = el('div', {
      className: 'f1-driver-row',
      style: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', marginBottom: '6px',
        background: adopted ? 'rgba(225,6,0,0.08)' : 'var(--bg-elevated)',
        borderRadius: '8px',
        borderLeft: adopted ? ('3px solid ' + F1_RED) : '3px solid transparent',
      },
    });
    const pos = el('span', { style: { fontSize: '13px', fontWeight: '700', minWidth: '24px', color: adopted ? F1_RED : 'var(--text-3)' } });
    pos.textContent = String(driver.position || '—');
    const nameWrap = el('span', { style: { flex: '1' } });
    const nameEl = el('span', { style: { fontWeight: '600', fontSize: '14px', color: adopted ? F1_RED : 'var(--text-1)' } });
    nameEl.textContent = driver.name || driver.id || 'Piloto';
    const teamEl = el('span', { style: { fontSize: '11px', color: 'var(--text-3)', marginLeft: '6px' } });
    teamEl.textContent = driver.team || '';
    nameWrap.appendChild(nameEl);
    nameWrap.appendChild(teamEl);
    const pts = el('span', { style: { fontWeight: '700', fontSize: '16px', color: 'var(--text-1)', minWidth: '40px', textAlign: 'right' } });
    pts.textContent = String(driver.points != null ? driver.points : 0);
    const dot = el('span', { style: { width: '10px', height: '10px', borderRadius: '50%', background: driver.team_color || '#888', flexShrink: '0' } });
    row.appendChild(pos);
    row.appendChild(dot);
    row.appendChild(nameWrap);
    row.appendChild(pts);
    if (!adopted) {
      const adoptBtn = el('button', {
        className: 'btn-ghost btn-sm f1-adopt-btn',
        style: { fontSize: '11px', padding: '2px 8px' },
        onClick: () => onAdoptDriver(driver.id || driver.name || ''),
      });
      adoptBtn.textContent = 'Adoptar';
      row.appendChild(adoptBtn);
    }
    return row;
  }

  function renderGpItem(gp) {
    const isNext = !!gp.isNext;
    const isPast = !!gp.isPast;
    const item = el('div', {
      className: 'f1-gp-item',
      style: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '12px 14px', marginBottom: '8px',
        background: 'var(--bg-elevated)', borderRadius: '8px',
        borderLeft: isNext ? ('3px solid ' + F1_RED) : '3px solid transparent',
        opacity: isPast ? '0.55' : '1',
      },
    });
    const left = el('div', {});
    const nameEl = el('p', { style: { fontWeight: '600', fontSize: '14px', margin: '0 0 2px 0', color: isNext ? F1_RED : 'var(--text-1)' } });
    nameEl.textContent = gp.name || gp.id || 'GP';
    const circuitEl = el('p', { style: { fontSize: '12px', color: 'var(--text-3)', margin: '0' } });
    circuitEl.textContent = (gp.circuit || '') + (gp.country ? (' — ' + gp.country) : '');
    left.appendChild(nameEl);
    left.appendChild(circuitEl);
    const right = el('div', { style: { textAlign: 'right' } });
    const dateEl = el('p', { style: { fontSize: '13px', fontWeight: '600', margin: '0 0 2px 0', color: 'var(--text-1)' } });
    dateEl.textContent = gp.date || '—';
    const badge = el('span', {
      style: {
        fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
        background: isNext ? F1_RED : (isPast ? 'var(--bg-elevated)' : 'transparent'),
        color: isNext ? 'white' : 'var(--text-3)',
        border: isPast ? '1px solid var(--border)' : 'none',
      },
    });
    badge.textContent = isNext ? 'ACTIVO' : (isPast ? 'PASADO' : 'PRÓXIMO');
    right.appendChild(dateEl);
    right.appendChild(badge);
    item.appendChild(left);
    item.appendChild(right);
    return item;
  }

  function createF1Panel(opts) {
    opts = opts || {};
    const fetchStandings = opts.fetchStandings || (async () => null);
    const fetchCalendar = opts.fetchCalendar || (async () => null);
    const getToken = opts.getToken || (async () => '');
    const onAdopt = opts.onAdopt || (() => {});

    let state = {
      activeTab: 'standings',
      standingsLoading: false,
      standingsError: null,
      standings: null,
      calendarLoading: false,
      calendarError: null,
      calendar: null,
    };

    const root = el('div', { className: 'f1-panel', style: { maxWidth: '720px', margin: '0 auto' } });

    // Header
    const header = el('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
    });
    const titleEl = el('h2', { style: { fontWeight: '700', fontSize: '20px', margin: '0', color: F1_RED } }, 'MiiaF1');
    header.appendChild(titleEl);
    root.appendChild(header);

    // Tab bar
    const tabBar = el('div', {
      style: { display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid var(--border)', paddingBottom: '0' },
    });
    const tabStandings = el('button', {
      className: 'f1-tab active',
      style: { padding: '8px 16px', fontWeight: '600', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' },
      onClick: () => switchTab('standings'),
    });
    tabStandings.textContent = 'Pilotos';
    const tabCalendar = el('button', {
      className: 'f1-tab',
      style: { padding: '8px 16px', fontWeight: '600', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' },
      onClick: () => switchTab('calendar'),
    });
    tabCalendar.textContent = 'Calendario';
    tabBar.appendChild(tabStandings);
    tabBar.appendChild(tabCalendar);
    root.appendChild(tabBar);

    // Content areas
    const standingsPanel = el('div', { className: 'f1-standings-panel' });
    const calendarPanel = el('div', { className: 'f1-calendar-panel', style: { display: 'none' } });
    root.appendChild(standingsPanel);
    root.appendChild(calendarPanel);

    function switchTab(tab) {
      state.activeTab = tab;
      if (tab === 'standings') {
        tabStandings.style.color = F1_RED;
        tabStandings.style.borderBottom = '2px solid ' + F1_RED;
        tabCalendar.style.color = '';
        tabCalendar.style.borderBottom = '';
        standingsPanel.style.display = '';
        calendarPanel.style.display = 'none';
      } else {
        tabCalendar.style.color = F1_RED;
        tabCalendar.style.borderBottom = '2px solid ' + F1_RED;
        tabStandings.style.color = '';
        tabStandings.style.borderBottom = '';
        calendarPanel.style.display = '';
        standingsPanel.style.display = 'none';
      }
    }

    function renderStandings() {
      standingsPanel.innerHTML = '';
      if (state.standingsLoading) {
        renderSkeleton(standingsPanel, 5);
        return;
      }
      if (state.standingsError) {
        const errP = el('p', { style: { color: 'var(--error, #f44)', textAlign: 'center', padding: '24px' } });
        errP.textContent = state.standingsError;
        standingsPanel.appendChild(errP);
        return;
      }
      const data = state.standings || {};
      const drivers = data.drivers || [];
      if (drivers.length === 0) {
        const emptyP = el('p', { style: { color: 'var(--text-3)', textAlign: 'center', padding: '24px' } });
        emptyP.textContent = 'Sin pilotos disponibles.';
        standingsPanel.appendChild(emptyP);
      } else {
        drivers.forEach((d) => standingsPanel.appendChild(renderDriverRow(d, adoptDriver)));
      }
    }

    function renderCalendar() {
      calendarPanel.innerHTML = '';
      if (state.calendarLoading) {
        renderSkeleton(calendarPanel, 5);
        return;
      }
      if (state.calendarError) {
        const errP = el('p', { style: { color: 'var(--error, #f44)', textAlign: 'center', padding: '24px' } });
        errP.textContent = state.calendarError;
        calendarPanel.appendChild(errP);
        return;
      }
      const data = state.calendar || {};
      const gps = data.gps || [];
      if (gps.length === 0) {
        const emptyP = el('p', { style: { color: 'var(--text-3)', textAlign: 'center', padding: '24px' } });
        emptyP.textContent = 'Sin GPs disponibles.';
        calendarPanel.appendChild(emptyP);
      } else {
        gps.forEach((gp) => calendarPanel.appendChild(renderGpItem(gp)));
      }
    }

    function render() {
      renderStandings();
      renderCalendar();
    }

    async function adoptDriver(driverId) {
      /* c8 ignore next */
      try {
        const token = await getToken();
        await onAdopt(driverId, token);
      } catch (_) { /* noop */ }
    }

    async function loadStandings() {
      state.standingsLoading = true;
      state.standingsError = null;
      renderStandings();
      try {
        const token = await getToken();
        const data = await fetchStandings(token);
        state.standings = data;
        state.standingsLoading = false;
        renderStandings();
      } catch (err) {
        /* c8 ignore next */
        state.standingsError = err.message || 'Error al cargar standings';
        state.standingsLoading = false;
        renderStandings();
      }
    }

    async function loadCalendar() {
      state.calendarLoading = true;
      state.calendarError = null;
      renderCalendar();
      try {
        const token = await getToken();
        const data = await fetchCalendar(token);
        state.calendar = data;
        state.calendarLoading = false;
        renderCalendar();
      } catch (err) {
        /* c8 ignore next */
        state.calendarError = err.message || 'Error al cargar calendario';
        state.calendarLoading = false;
        renderCalendar();
      }
    }

    async function refresh() {
      await Promise.all([loadStandings(), loadCalendar()]);
    }

    render();

    return {
      element: root,
      refresh,
      loadStandings,
      loadCalendar,
      switchTab,
      _state: state,
      _setState: (s) => { Object.assign(state, s); render(); },
    };
  }

  return createF1Panel;
/* c8 ignore start */
}));
/* c8 ignore stop */
