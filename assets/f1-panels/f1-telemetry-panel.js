/* c8 ignore start */
'use strict';
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = factory(); }
  else { root.createF1TelemetryPanel = factory(); }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var TYRE_COLOR = {
    SOFT: '#FF2D2D',
    MEDIUM: '#FFD700',
    HARD: '#FFFFFF',
    INTERMEDIATE: '#00C800',
    WET: '#0080FF',
  };

  function tyreColor(compound) {
    return TYRE_COLOR[(compound || '').toUpperCase()] || '#888888';
  }

  function createF1TelemetryPanel(opts) {
    opts = opts || {};
    var fetchStints = opts.fetchStints || function () { return Promise.resolve(null); };
    var fetchPits   = opts.fetchPits   || function () { return Promise.resolve(null); };
    var getToken    = opts.getToken    || function () { return Promise.resolve(''); };

    var state = { loading: false, error: null, stints: null, pits: null };

    var rootEl = document.createElement('div');
    rootEl.className = 'f1-telemetry-panel';

    var contentEl = document.createElement('div');
    contentEl.className = 'f1t-content';
    rootEl.appendChild(contentEl);

    function buildPitMap(pitsData) {
      var map = {};
      if (!pitsData) return map;
      pitsData.forEach(function (p) {
        var dn = p.driver_number;
        map[dn] = (map[dn] || 0) + 1;
      });
      return map;
    }

    function render() {
      contentEl.innerHTML = '';

      if (state.loading) {
        var loadEl = document.createElement('div');
        loadEl.className = 'f1t-loading';
        loadEl.textContent = 'Cargando telemetria...';
        contentEl.appendChild(loadEl);
        return;
      }

      if (state.error) {
        var errEl = document.createElement('div');
        errEl.className = 'f1t-error';
        errEl.textContent = state.error;
        contentEl.appendChild(errEl);
        return;
      }

      if (!state.stints || state.stints.length === 0) {
        var emptyEl = document.createElement('div');
        emptyEl.className = 'f1t-empty';
        emptyEl.textContent = state.stints === null ? 'Sin datos de telemetria' : 'Sin stints disponibles';
        contentEl.appendChild(emptyEl);
        return;
      }

      var pitMap = buildPitMap(state.pits);

      // Mostrar ultimo stint por piloto
      var lastStintMap = {};
      state.stints.forEach(function (s) {
        lastStintMap[s.driver_number] = s;
      });

      var table = document.createElement('table');
      table.className = 'f1t-table';

      var header = document.createElement('tr');
      ['#', 'Compuesto', 'Vueltas', 'Pits'].forEach(function (h) {
        var th = document.createElement('th');
        th.textContent = h;
        header.appendChild(th);
      });
      table.appendChild(header);

      Object.values(lastStintMap).forEach(function (stint) {
        var tr = document.createElement('tr');
        tr.className = 'f1t-row';

        var tdNum = document.createElement('td');
        tdNum.className = 'f1t-driver';
        tdNum.textContent = stint.driver_number;
        tr.appendChild(tdNum);

        var tdTyre = document.createElement('td');
        tdTyre.className = 'f1t-compound';
        var tyreIcon = document.createElement('span');
        tyreIcon.className = 'f1t-tyre-icon';
        tyreIcon.style.backgroundColor = tyreColor(stint.compound);
        tyreIcon.title = stint.compound || 'Unknown';
        tdTyre.appendChild(tyreIcon);
        var tyreLabel = document.createElement('span');
        tyreLabel.className = 'f1t-tyre-label';
        tyreLabel.textContent = stint.compound || '?';
        tdTyre.appendChild(tyreLabel);
        tr.appendChild(tdTyre);

        var tdLaps = document.createElement('td');
        tdLaps.className = 'f1t-laps';
        tdLaps.textContent = String(stint.lap_count != null ? stint.lap_count : stint.lap_end != null ? stint.lap_end - (stint.lap_start || 1) + 1 : '?');
        tr.appendChild(tdLaps);

        var tdPits = document.createElement('td');
        tdPits.className = 'f1t-pits';
        tdPits.textContent = String(pitMap[stint.driver_number] || 0);
        tr.appendChild(tdPits);

        table.appendChild(tr);
      });

      contentEl.appendChild(table);
    }

    function loadTelemetry() {
      state.loading = true;
      state.error = null;
      render();
      return Promise.resolve(getToken()).then(function (token) {
        return Promise.all([fetchStints(token), fetchPits(token)]);
      }).then(function (results) {
        state.stints = results[0];
        state.pits = results[1];
        state.loading = false;
        render();
      }).catch(function (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar telemetria';
        state.loading = false;
        render();
      });
    }

    render();

    return {
      element: rootEl,
      loadTelemetry: loadTelemetry,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
    };
  }

  return createF1TelemetryPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
