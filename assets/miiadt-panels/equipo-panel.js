/* c8 ignore start */
/**
 * equipo-panel.js - ARQ-PANEL-2
 *
 * Panel UMD: escudo, nombre equipo, jugadores titulares, stats.
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createEquipoPanel = factory();
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

  function renderPlayerRow(player) {
    var row = el('div', { className: 'equipo-player-row' });
    var nameEl = el('span', { className: 'equipo-player-name' });
    nameEl.textContent = player.name || 'Jugador';
    var posEl = el('span', { className: 'equipo-player-pos' });
    posEl.textContent = player.position || 'POS';
    var ptsEl = el('span', { className: 'equipo-player-pts' });
    ptsEl.textContent = String(player.points || 0);
    row.appendChild(nameEl);
    row.appendChild(posEl);
    row.appendChild(ptsEl);
    return row;
  }

  function createEquipoPanel(opts) {
    opts = opts || {};
    var fetchTeam  = opts.fetchTeam  || function() { return Promise.resolve(null); };
    var getToken   = opts.getToken   || function() { return Promise.resolve(''); };
    var onTransfer = opts.onTransfer || function() {};

    var state = {
      loading: false,
      error: null,
      team: null,
    };

    var rootEl = el('div', { className: 'equipo-panel' });
    var contentEl = el('div', { className: 'equipo-content' });
    rootEl.appendChild(contentEl);

    function render() {
      contentEl.innerHTML = '';

      if (state.loading) {
        var loadEl = el('div', { className: 'equipo-loading' }, 'Cargando...');
        contentEl.appendChild(loadEl);
        return;
      }

      if (state.error) {
        var errEl = el('div', { className: 'equipo-error' });
        errEl.textContent = state.error;
        contentEl.appendChild(errEl);
        return;
      }

      if (state.team === null) {
        var emptyEl = el('div', { className: 'equipo-empty' });
        emptyEl.textContent = 'Sin equipo disponible';
        contentEl.appendChild(emptyEl);
        return;
      }

      // Escudo
      var shieldEl = el('div', { className: 'equipo-shield' });
      if (state.team.shieldUrl) {
        var img = el('img', { className: 'equipo-shield-img', src: state.team.shieldUrl });
        shieldEl.appendChild(img);
      } else {
        shieldEl.textContent = state.team.teamName ? state.team.teamName.slice(0, 2).toUpperCase() : 'EQ';
      }
      contentEl.appendChild(shieldEl);

      // Nombre
      var nameEl = el('div', { className: 'equipo-team-name' });
      nameEl.textContent = state.team.teamName || 'Mi Equipo';
      contentEl.appendChild(nameEl);

      // Stats
      var statsEl = el('div', { className: 'equipo-stats' });
      var ptsEl = el('span', { className: 'equipo-total-pts' });
      ptsEl.textContent = String(state.team.totalPoints || 0);
      var rankEl = el('span', { className: 'equipo-rank' });
      rankEl.textContent = String(state.team.rank || '-');
      statsEl.appendChild(ptsEl);
      statsEl.appendChild(rankEl);
      contentEl.appendChild(statsEl);

      // Jugadores titulares
      var players = state.team.players || [];
      if (players.length === 0) {
        var emptyPlayers = el('p', { className: 'equipo-empty-players' }, 'Sin jugadores titulares');
        contentEl.appendChild(emptyPlayers);
      } else {
        var listEl = el('div', { className: 'equipo-players' });
        players.forEach(function(p) {
          listEl.appendChild(renderPlayerRow(p));
        });
        contentEl.appendChild(listEl);
      }

      // Boton transferencias
      var transferBtn = el('button', { className: 'equipo-transfer-btn', onClick: onTransfer });
      transferBtn.textContent = 'Transferencias';
      contentEl.appendChild(transferBtn);
    }

    function load() {
      state.loading = true;
      state.error = null;
      render();
      return Promise.resolve(getToken()).then(function(token) {
        return fetchTeam(token);
      }).then(function(data) {
        state.team = data;
        state.loading = false;
        render();
      }).catch(function(err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar equipo';
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

  return createEquipoPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
