/* c8 ignore start */
'use strict';
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = factory(); }
  else { root.createF1GapPanel = factory(); }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function fmtGap(v) {
    if (v == null || v === '') return '—';
    if (typeof v === 'number') return '+' + v.toFixed(3);
    return String(v);
  }

  function createF1GapPanel(opts) {
    opts = opts || {};
    var fetchIntervals = opts.fetchIntervals || function () { return Promise.resolve(null); };
    var getToken       = opts.getToken       || function () { return Promise.resolve(''); };

    var state = { loading: false, error: null, data: null };

    var rootEl = document.createElement('div');
    rootEl.className = 'f1-gap-panel';

    var contentEl = document.createElement('div');
    contentEl.className = 'f1-gap-content';
    rootEl.appendChild(contentEl);

    function render() {
      contentEl.innerHTML = '';

      if (state.loading) {
        var loadEl = document.createElement('div');
        loadEl.className = 'f1g-loading';
        loadEl.textContent = 'Cargando gaps...';
        contentEl.appendChild(loadEl);
        return;
      }

      if (state.error) {
        var errEl = document.createElement('div');
        errEl.className = 'f1g-error';
        errEl.textContent = state.error;
        contentEl.appendChild(errEl);
        return;
      }

      if (!state.data || state.data.length === 0) {
        var emptyEl = document.createElement('div');
        emptyEl.className = 'f1g-empty';
        emptyEl.textContent = state.data === null ? 'Sin datos de gaps' : 'Sin intervalos disponibles';
        contentEl.appendChild(emptyEl);
        return;
      }

      var table = document.createElement('table');
      table.className = 'f1g-table';

      var header = document.createElement('tr');
      ['#', 'Al lider', 'Al de delante'].forEach(function (h) {
        var th = document.createElement('th');
        th.textContent = h;
        header.appendChild(th);
      });
      table.appendChild(header);

      state.data.forEach(function (row) {
        var tr = document.createElement('tr');
        tr.className = 'f1g-row';

        var tdNum = document.createElement('td');
        tdNum.className = 'f1g-driver';
        tdNum.textContent = row.driver_number;
        tr.appendChild(tdNum);

        var tdLeader = document.createElement('td');
        tdLeader.className = 'f1g-gap-leader';
        tdLeader.textContent = fmtGap(row.gap_to_leader);
        tr.appendChild(tdLeader);

        var tdInterval = document.createElement('td');
        tdInterval.className = 'f1g-interval';
        tdInterval.textContent = fmtGap(row.interval);
        tr.appendChild(tdInterval);

        table.appendChild(tr);
      });

      contentEl.appendChild(table);
    }

    function loadIntervals() {
      state.loading = true;
      state.error = null;
      render();
      return Promise.resolve(getToken()).then(function (token) {
        return fetchIntervals(token);
      }).then(function (data) {
        state.data = data;
        state.loading = false;
        render();
      }).catch(function (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar intervals';
        state.loading = false;
        render();
      });
    }

    render();

    return {
      element: rootEl,
      loadIntervals: loadIntervals,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
    };
  }

  return createF1GapPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
