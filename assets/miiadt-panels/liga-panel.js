/* c8 ignore start */
/**
 * liga-panel.js - ARQ-PANEL-1
 *
 * Panel UMD: standings de liga, proximo fixture, unirse/crear equipo.
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createLigaPanel = factory();
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

  function renderStandingRow(row) {
    var tr = el('div', { className: 'liga-standing-row' });
    var nameEl = el('span', { className: 'liga-standing-name' });
    nameEl.textContent = row.teamName || 'Equipo';
    var ptsEl = el('span', { className: 'liga-standing-pts' });
    ptsEl.textContent = String(row.points || 0);
    var gpEl = el('span', { className: 'liga-standing-gp' });
    gpEl.textContent = String(row.gamesPlayed || 0);
    var wEl = el('span', { className: 'liga-standing-w' });
    wEl.textContent = String(row.won || 0);
    var dEl = el('span', { className: 'liga-standing-d' });
    dEl.textContent = String(row.drawn || 0);
    var lEl = el('span', { className: 'liga-standing-l' });
    lEl.textContent = String(row.lost || 0);
    tr.appendChild(nameEl);
    tr.appendChild(ptsEl);
    tr.appendChild(gpEl);
    tr.appendChild(wEl);
    tr.appendChild(dEl);
    tr.appendChild(lEl);
    return tr;
  }

  function renderFixture(fixture, contentEl) {
    var section = el('div', { className: 'liga-next-fixture' });
    var title = el('span', { className: 'liga-fixture-title' }, 'Proximo partido');
    var homeEl = el('span', { className: 'liga-fixture-home' });
    homeEl.textContent = fixture.homeTeam || 'Local';
    var awayEl = el('span', { className: 'liga-fixture-away' });
    awayEl.textContent = fixture.awayTeam || 'Visitante';
    var dateEl = el('span', { className: 'liga-fixture-date' });
    dateEl.textContent = fixture.date || 'Fecha TBD';
    section.appendChild(title);
    section.appendChild(homeEl);
    section.appendChild(awayEl);
    section.appendChild(dateEl);
    contentEl.appendChild(section);
  }

  function createLigaPanel(opts) {
    opts = opts || {};
    var fetchLeague  = opts.fetchLeague  || function() { return Promise.resolve(null); };
    var getToken     = opts.getToken     || function() { return Promise.resolve(''); };
    var isOwner      = !!opts.isOwner;
    var onJoin       = opts.onJoin       || function() {};
    var onCreateTeam = opts.onCreateTeam || function() {};

    var state = {
      loading: false,
      error: null,
      league: null,
    };

    var rootEl = el('div', { className: 'liga-panel' });
    var contentEl = el('div', { className: 'liga-content' });
    rootEl.appendChild(contentEl);

    function render() {
      contentEl.innerHTML = '';

      if (state.loading) {
        var loadEl = el('div', { className: 'liga-loading' }, 'Cargando...');
        contentEl.appendChild(loadEl);
        return;
      }

      if (state.error) {
        var errEl = el('div', { className: 'liga-error' });
        errEl.textContent = state.error;
        contentEl.appendChild(errEl);
        return;
      }

      if (state.league === null) {
        var emptyEl = el('div', { className: 'liga-empty' });
        emptyEl.textContent = 'Sin liga disponible';
        contentEl.appendChild(emptyEl);
        return;
      }

      var nameEl = el('div', { className: 'liga-league-name' });
      nameEl.textContent = state.league.leagueName || 'Liga';
      contentEl.appendChild(nameEl);

      var standings = state.league.standings || [];
      if (standings.length === 0) {
        var emptyMsg = el('p', { className: 'liga-empty-standings' });
        emptyMsg.textContent = 'Sin equipos en la liga';
        contentEl.appendChild(emptyMsg);
      } else {
        var tableEl = el('div', { className: 'liga-standings' });
        standings.forEach(function(row) {
          tableEl.appendChild(renderStandingRow(row));
        });
        contentEl.appendChild(tableEl);
      }

      if (state.league.nextFixture) {
        renderFixture(state.league.nextFixture, contentEl);
      }

      if (isOwner) {
        var createBtn = el('button', { className: 'liga-create-team-btn', onClick: onCreateTeam });
        createBtn.textContent = 'Crear equipo';
        contentEl.appendChild(createBtn);
      } else {
        var joinBtn = el('button', {
          className: 'liga-join-btn',
          onClick: function() { onJoin(state.league.leagueName || 'Liga'); },
        });
        joinBtn.textContent = 'Unirse';
        contentEl.appendChild(joinBtn);
      }
    }

    function load() {
      state.loading = true;
      state.error = null;
      render();
      return Promise.resolve(getToken()).then(function(token) {
        return fetchLeague(token);
      }).then(function(data) {
        state.league = data;
        state.loading = false;
        render();
      }).catch(function(err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar liga';
        state.loading = false;
        render();
      });
    }

    render();

    return {
      element: rootEl,
      load: load,
      _state: state,
      _setState: function(s) { Object.assign(state, s); render(); },
    };
  }

  return createLigaPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
