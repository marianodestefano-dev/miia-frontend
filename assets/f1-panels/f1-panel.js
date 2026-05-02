/* c8 ignore start */
/**
 * f1-panel.js - T-MIIAF1-PANEL-1
 *
 * Panel UMD integrable para el dashboard MiiaF1.
 * Tabs: standings (pilotos) | calendario. Botón adoptar piloto.
 *
 * Uso:
 *   const p = createF1Panel({
 *     fetchStandings: async (token) => fetch('/api/f1/standings?token='+token).then(r=>r.json()),
 *     fetchCalendar:  async (token) => fetch('/api/f1/calendar').then(r=>r.json()),
 *     getToken:       () => firebase.auth().currentUser.getIdToken(),
 *     onAdopt:        (driverId, name) => console.log('Adopted', name),
 *   });
 *   container.appendChild(p.element);
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

  function createF1Panel(opts) {
    opts = opts || {};
    var fetchStandings = opts.fetchStandings || (async function () { return null; });
    var fetchCalendar  = opts.fetchCalendar  || (async function () { return null; });
    var getToken       = opts.getToken       || (async function () { return ''; });
    var onAdopt        = opts.onAdopt        || (function () {});

    var state = {
      tab:           'standings',
      standings:     null,
      calendar:      null,
      loading:       false,
      error:         null,
      adoptedDriver: null,
    };

    var root = document.createElement('div');
    root.className = 'f1-panel';

    var tabBar = document.createElement('div');
    tabBar.className = 'f1-tab-bar';

    var tabStandingsBtn = document.createElement('button');
    tabStandingsBtn.className = 'f1-tab f1-tab-standings active';
    tabStandingsBtn.textContent = 'Standings';
    tabStandingsBtn.addEventListener('click', function () { switchTab('standings'); });

    var tabCalendarBtn = document.createElement('button');
    tabCalendarBtn.className = 'f1-tab f1-tab-calendar';
    tabCalendarBtn.textContent = 'Calendario';
    tabCalendarBtn.addEventListener('click', function () { switchTab('calendar'); });

    tabBar.appendChild(tabStandingsBtn);
    tabBar.appendChild(tabCalendarBtn);
    root.appendChild(tabBar);

    var body = document.createElement('div');
    body.className = 'f1-body';
    root.appendChild(body);

    function render() {
      tabStandingsBtn.className = 'f1-tab f1-tab-standings' + (state.tab === 'standings' ? ' active' : '');
      tabCalendarBtn.className  = 'f1-tab f1-tab-calendar'  + (state.tab === 'calendar'  ? ' active' : '');

      body.innerHTML = '';

      if (state.loading) {
        var loadEl = document.createElement('div');
        loadEl.className = 'f1-loading';
        loadEl.textContent = 'Cargando...';
        body.appendChild(loadEl);
        return;
      }

      if (state.error) {
        var errEl = document.createElement('div');
        errEl.className = 'f1-error';
        errEl.textContent = state.error;
        body.appendChild(errEl);
        return;
      }

      if (state.tab === 'standings') {
        renderStandings();
      } else {
        renderCalendar();
      }
    }

    function renderStandings() {
      if (!state.standings) {
        var emptyEl = document.createElement('div');
        emptyEl.className = 'f1-empty';
        emptyEl.textContent = 'Sin standings disponibles';
        body.appendChild(emptyEl);
        return;
      }
      var drivers = state.standings.drivers || [];
      var section = document.createElement('div');
      section.className = 'f1-standings-section';
      var title = document.createElement('h3');
      title.className = 'f1-section-title';
      title.textContent = 'Pilotos';
      section.appendChild(title);
      if (drivers.length === 0) {
        var emptyP = document.createElement('p');
        emptyP.className = 'f1-empty-msg';
        emptyP.textContent = 'Sin pilotos';
        section.appendChild(emptyP);
      } else {
        var table = document.createElement('table');
        table.className = 'f1-table';
        drivers.forEach(function (d, i) {
          var tr = document.createElement('tr');
          tr.className = 'f1-driver-row' + (d.id === state.adoptedDriver ? ' f1-adopted' : '');
          var tdPos = document.createElement('td');
          tdPos.textContent = String(i + 1);
          var tdName = document.createElement('td');
          tdName.textContent = d.name || 'Unknown';
          var tdPts = document.createElement('td');
          tdPts.textContent = String(d.points || 0);
          var tdBtn = document.createElement('td');
          var adoptBtn = document.createElement('button');
          adoptBtn.className = 'f1-adopt-btn';
          adoptBtn.textContent = d.id === state.adoptedDriver ? 'Adoptado' : 'Adoptar';
          adoptBtn.addEventListener('click', function () { adoptDriver(d.id, d.name || 'Unknown'); });
          tdBtn.appendChild(adoptBtn);
          tr.appendChild(tdPos);
          tr.appendChild(tdName);
          tr.appendChild(tdPts);
          tr.appendChild(tdBtn);
          table.appendChild(tr);
        });
        section.appendChild(table);
      }
      body.appendChild(section);
    }

    function renderCalendar() {
      if (!state.calendar) {
        var emptyEl = document.createElement('div');
        emptyEl.className = 'f1-empty';
        emptyEl.textContent = 'Sin calendario disponible';
        body.appendChild(emptyEl);
        return;
      }
      var races = state.calendar.races || [];
      var section = document.createElement('div');
      section.className = 'f1-calendar-section';
      if (races.length === 0) {
        var emptyP = document.createElement('p');
        emptyP.className = 'f1-empty-msg';
        emptyP.textContent = 'Sin carreras programadas';
        section.appendChild(emptyP);
      } else {
        var today = new Date().toISOString().slice(0, 10);
        var foundNext = false;
        races.forEach(function (r) {
          var isNext = !foundNext && (r.date || '') >= today;
          if (isNext) { foundNext = true; }
          var card = document.createElement('div');
          card.className = 'f1-race-card' + (isNext ? ' f1-race-next' : '');
          var nextBadge = isNext ? '<span class="f1-next-badge">PROXIMO</span>' : '';
          card.innerHTML =
            '<strong class="f1-race-name">' + (r.raceName || 'GP') + '</strong>' + nextBadge +
            '<div class="f1-race-date">' + (r.date || '') + '</div>';
          section.appendChild(card);
        });
      }
      body.appendChild(section);
    }

    function switchTab(tab) {
      if (state.tab === tab) { return; }
      state.tab   = tab;
      state.error = null;
      render();
      if (tab === 'standings' && !state.standings) {
        loadStandings();
      } else if (tab === 'calendar' && !state.calendar) {
        loadCalendar();
      }
    }

    async function loadStandings() {
      state.loading = true;
      state.error   = null;
      render();
      try {
        var token = await getToken();
        var data  = await fetchStandings(token);
        state.standings = data;
        state.loading   = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error   = err.message || 'Error al cargar standings';
        state.loading = false;
        render();
      }
    }

    async function loadCalendar() {
      state.loading = true;
      state.error   = null;
      render();
      try {
        var token = await getToken();
        var data  = await fetchCalendar(token);
        state.calendar = data;
        state.loading  = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error   = err.message || 'Error al cargar calendario';
        state.loading = false;
        render();
      }
    }

    function adoptDriver(driverId, name) {
      state.adoptedDriver = driverId;
      onAdopt(driverId, name);
      render();
    }

    render();

    return {
      element:       root,
      switchTab:     switchTab,
      loadStandings: loadStandings,
      loadCalendar:  loadCalendar,
      adoptDriver:   adoptDriver,
      _state:        state,
      _setState:     function (s) { Object.assign(state, s); render(); },
    };
  }

  return createF1Panel;
/* c8 ignore start */
}));
/* c8 ignore stop */
