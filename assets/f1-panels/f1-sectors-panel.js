/* c8 ignore start */
'use strict';
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = factory(); }
  else { root.createF1SectorsPanel = factory(); }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function computeSectorColors(rows) {
    var minS1 = Infinity, minS2 = Infinity, minS3 = Infinity;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.s1 != null && r.s1 < minS1) minS1 = r.s1;
      if (r.s2 != null && r.s2 < minS2) minS2 = r.s2;
      if (r.s3 != null && r.s3 < minS3) minS3 = r.s3;
    }
    return rows.map(function (r) {
      return {
        driver_number: r.driver_number,
        acronym: r.driver_acronym || String(r.driver_number || '?'),
        s1: r.s1, s2: r.s2, s3: r.s3,
        s1Color: r.s1 != null ? (r.s1 === minS1 ? 'f1s-green' : 'f1s-yellow') : 'f1s-none',
        s2Color: r.s2 != null ? (r.s2 === minS2 ? 'f1s-green' : 'f1s-yellow') : 'f1s-none',
        s3Color: r.s3 != null ? (r.s3 === minS3 ? 'f1s-green' : 'f1s-yellow') : 'f1s-none',
      };
    });
  }

  function fmtSec(v) {
    if (v == null) return '—';
    var s = v.toFixed(3);
    return s;
  }

  function createF1SectorsPanel(opts) {
    opts = opts || {};
    var fetchLaps = opts.fetchLaps || function () { return Promise.resolve(null); };
    var getToken  = opts.getToken  || function () { return Promise.resolve(''); };

    var state = { loading: false, error: null, data: null };

    var rootEl = document.createElement('div');
    rootEl.className = 'f1-sectors-panel';

    var contentEl = document.createElement('div');
    contentEl.className = 'f1-sectors-content';
    rootEl.appendChild(contentEl);

    function render() {
      contentEl.innerHTML = '';

      if (state.loading) {
        var loadEl = document.createElement('div');
        loadEl.className = 'f1s-loading';
        loadEl.textContent = 'Cargando sectores...';
        contentEl.appendChild(loadEl);
        return;
      }

      if (state.error) {
        var errEl = document.createElement('div');
        errEl.className = 'f1s-error';
        errEl.textContent = state.error;
        contentEl.appendChild(errEl);
        return;
      }

      if (!state.data || state.data.length === 0) {
        var emptyEl = document.createElement('div');
        emptyEl.className = 'f1s-empty';
        emptyEl.textContent = state.data === null ? 'Sin datos de sectores' : 'Sin vueltas disponibles';
        contentEl.appendChild(emptyEl);
        return;
      }

      var colored = computeSectorColors(state.data);
      var table = document.createElement('table');
      table.className = 'f1s-table';

      var header = document.createElement('tr');
      ['Piloto', 'S1', 'S2', 'S3'].forEach(function (h) {
        var th = document.createElement('th');
        th.textContent = h;
        header.appendChild(th);
      });
      table.appendChild(header);

      colored.forEach(function (row) {
        var tr = document.createElement('tr');
        tr.className = 'f1s-row';

        var tdName = document.createElement('td');
        tdName.className = 'f1s-driver';
        tdName.textContent = row.acronym;
        tr.appendChild(tdName);

        ['s1', 's2', 's3'].forEach(function (sKey, idx) {
          var td = document.createElement('td');
          td.className = 'f1s-sector ' + row[sKey + 'Color'];
          td.textContent = fmtSec(row[sKey]);
          tr.appendChild(td);
        });

        table.appendChild(tr);
      });

      contentEl.appendChild(table);
    }

    function loadSectors() {
      state.loading = true;
      state.error = null;
      render();
      return Promise.resolve(getToken()).then(function (token) {
        return fetchLaps(token);
      }).then(function (data) {
        state.data = data;
        state.loading = false;
        render();
      }).catch(function (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar sectores';
        state.loading = false;
        render();
      });
    }

    render();

    return {
      element: rootEl,
      loadSectors: loadSectors,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
    };
  }

  return createF1SectorsPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
