/* c8 ignore start */
/**
 * f1-panel.js - T-MIIAF1-PANEL-1
 *
 * Panel UMD: tab standings pilotos, tab calendario GPs, adoptar piloto.
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
    var e = document.createElement(tag);
    /* c8 ignore next */
    if (attrs) {
      var keys = Object.keys(attrs);
      for (var ki = 0; ki < keys.length; ki++) {
        var k = keys[ki];
        if (k === 'style' && typeof attrs[k] === 'object') { Object.assign(e.style, attrs[k]); }
        else if (k.startsWith('on') && typeof attrs[k] === 'function') { e.addEventListener(k.slice(2).toLowerCase(), attrs[k]); }
        else if (k === 'className') { e.className = attrs[k]; }
        /* c8 ignore next */
        else { e.setAttribute(k, attrs[k]); }
      }
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      /* c8 ignore next */
      if (c == null) { continue; }
      /* c8 ignore next */
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  var TODAY = new Date().toISOString().slice(0, 10);

  function renderDriverRow(driver, adoptedId, onAdoptClick) {
    var adopted = driver.id === adoptedId;
    var row = el('div', { className: 'f1-driver-row' + (adopted ? ' f1-adopted' : '') });
    var nameEl = el('span', { className: 'f1-driver-name' });
    nameEl.textContent = driver.name || 'Unknown';
    var ptsEl = el('span', { className: 'f1-driver-points' });
    ptsEl.textContent = String(driver.points || 0);
    var dId = driver.id;
    var dName = driver.name || 'Unknown';
    var btn = el('button', {
      className: 'f1-adopt-btn',
      onClick: function() { onAdoptClick(dId, dName); },
    });
    btn.textContent = adopted ? 'Adoptado' : 'Adoptar';
    row.appendChild(nameEl);
    row.appendChild(ptsEl);
    row.appendChild(btn);
    return row;
  }

  function renderRaceCard(race, foundNext) {
    var dateStr = race.date || '';
    var isNext = !foundNext && dateStr >= TODAY;
    var card = el('div', { className: 'f1-race-card' + (isNext ? ' f1-race-next' : '') });
    var nameEl = el('span', { className: 'f1-race-name' });
    nameEl.textContent = race.raceName || 'GP';
    var dateEl = el('span', { className: 'f1-race-date' });
    dateEl.textContent = dateStr;
    card.appendChild(nameEl);
    card.appendChild(dateEl);
    if (isNext) {
      var badge = el('span', { className: 'f1-next-badge' }, 'PROXIMO');
      card.appendChild(badge);
    }
    return { card: card, isNext: isNext };
  }

  function createF1Panel(opts) {
    opts = opts || {};
    var fetchStandings = opts.fetchStandings || function() { return Promise.resolve(null); };
    var fetchCalendar  = opts.fetchCalendar  || function() { return Promise.resolve(null); };
    var getToken       = opts.getToken       || function() { return Promise.resolve(''); };
    var onAdopt        = opts.onAdopt        || function() {};

    var state = {
      tab: 'standings',
      loading: false,
      error: null,
      standings: null,
      calendar: null,
      adoptedDriver: null,
    };

    var rootEl = el('div', { className: 'f1-panel' });

    var tabBar = el('div', { className: 'f1-tab-bar' });
    var tabStandingsBtn = el('button', {
      className: 'f1-tab-standings active',
      onClick: function() { switchTab('standings'); },
    });
    tabStandingsBtn.textContent = 'Pilotos';
    var tabCalendarBtn = el('button', {
      className: 'f1-tab-calendar',
      onClick: function() { switchTab('calendar'); },
    });
    tabCalendarBtn.textContent = 'Calendario';
    tabBar.appendChild(tabStandingsBtn);
    tabBar.appendChild(tabCalendarBtn);
    rootEl.appendChild(tabBar);

    var contentEl = el('div', { className: 'f1-content' });
    rootEl.appendChild(contentEl);

    function renderStandings() {
      if (state.standings === null) {
        var emptyEl = el('div', { className: 'f1-empty' });
        emptyEl.textContent = 'Sin standings disponibles';
        contentEl.appendChild(emptyEl);
        return;
      }
      var drivers = state.standings.drivers || [];
      if (drivers.length === 0) {
        var emptyMsg = el('p', { className: 'f1-empty-msg' });
        emptyMsg.textContent = 'Sin pilotos';
        contentEl.appendChild(emptyMsg);
        return;
      }
      drivers.forEach(function(d) {
        contentEl.appendChild(renderDriverRow(d, state.adoptedDriver, adoptDriver));
      });
    }

    function renderCalendar() {
      if (state.calendar === null) {
        var emptyEl = el('div', { className: 'f1-empty' });
        emptyEl.textContent = 'Sin calendario disponible';
        contentEl.appendChild(emptyEl);
        return;
      }
      var races = state.calendar.races || [];
      if (races.length === 0) {
        var emptyMsg = el('p', { className: 'f1-empty-msg' });
        emptyMsg.textContent = 'Sin carreras programadas';
        contentEl.appendChild(emptyMsg);
        return;
      }
      var foundNext = false;
      races.forEach(function(race) {
        var result = renderRaceCard(race, foundNext);
        if (result.isNext) foundNext = true;
        contentEl.appendChild(result.card);
      });
    }

    function render() {
      tabStandingsBtn.classList.toggle('active', state.tab === 'standings');
      tabCalendarBtn.classList.toggle('active', state.tab === 'calendar');
      contentEl.innerHTML = '';

      if (state.loading) {
        var loadEl = el('div', { className: 'f1-loading' }, 'Cargando...');
        contentEl.appendChild(loadEl);
        return;
      }

      if (state.error) {
        var errEl = el('div', { className: 'f1-error' });
        errEl.textContent = state.error;
        contentEl.appendChild(errEl);
        return;
      }

      if (state.tab === 'standings') {
        renderStandings();
      } else {
        renderCalendar();
      }
    }

    function loadStandings() {
      state.loading = true;
      state.error = null;
      render();
      return Promise.resolve(getToken()).then(function(token) {
        return fetchStandings(token);
      }).then(function(data) {
        state.standings = data;
        state.loading = false;
        render();
      }).catch(function(err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar standings';
        state.loading = false;
        render();
      });
    }

    function loadCalendar() {
      state.loading = true;
      state.error = null;
      render();
      return Promise.resolve(getToken()).then(function(token) {
        return fetchCalendar(token);
      }).then(function(data) {
        state.calendar = data;
        state.loading = false;
        render();
      }).catch(function(err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar calendario';
        state.loading = false;
        render();
      });
    }

    function switchTab(tab) {
      if (tab === state.tab) return;
      state.tab = tab;
      render();
      if (tab === 'calendar' && state.calendar === null) {
        loadCalendar();
      } else if (tab === 'standings' && state.standings === null) {
        loadStandings();
      }
    }

    function adoptDriver(id, name) {
      state.adoptedDriver = id;
      onAdopt(id, name);
      render();
    }

    render();

    return {
      element: rootEl,
      switchTab: switchTab,
      loadStandings: loadStandings,
      loadCalendar: loadCalendar,
      adoptDriver: adoptDriver,
      _state: state,
      _setState: function(s) { Object.assign(state, s); render(); },
    };
  }

  return createF1Panel;
/* c8 ignore start */
}));
/* c8 ignore stop */
