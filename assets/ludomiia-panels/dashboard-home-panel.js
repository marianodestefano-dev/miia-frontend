/* c8 ignore start */
/**
 * dashboard-home-panel.js - TEC-LUDOMIIA-MIGRAR-15.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/dashboard/page.tsx (Next.js, deprecado).
 *
 * Muestra: hero saludo, 4 stats, banner sesion activa, juegos destacados.
 *
 * Uso:
 *   const panel = createDashboardHomePanel({
 *     fetchGames: async (token) => [],
 *     fetchSessions: async (token) => [],
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     displayName: 'Mariano',
 *     onContinueSession: (sessionId) => {},
 *     onPlayGame: (gameId) => {},
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createDashboardHomePanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function el(tag, attrs, ...children) {
    var e = document.createElement(tag);
    /* c8 ignore next */
    if (attrs) {
      for (var k of Object.keys(attrs)) {
        if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
        else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === 'className') e.className = attrs[k];
        /* c8 ignore next */
        else e.setAttribute(k, attrs[k]);
      }
    }
    for (var c of children) {
      /* c8 ignore next */
      if (c == null) continue;
      /* c8 ignore next */
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  var STATS_CONFIG = [
    { key: 'games',      label: 'Juegos',      icon: '🎲', colorVar: '--miia-cyan' },
    { key: 'thisMonth',  label: 'Este mes',    icon: '🕹️', colorVar: '--miia-violet' },
    { key: 'inProgress', label: 'En progreso', icon: '▶️', colorVar: '--orange' },
    { key: 'completed',  label: 'Completadas', icon: '✅', colorVar: '--miia-rose' },
  ];

  function renderStatCard(stat, value) {
    var card = el('div', { className: 'stat-card', style: { textAlign: 'center', padding: '20px 16px' } });
    var iconEl = el('div', { style: { fontSize: '28px', marginBottom: '8px' } }, stat.icon);
    var valEl = el('div', { className: 'stat-value', style: { fontSize: '26px', fontWeight: '800' } }, String(value));
    var lblEl = el('div', { style: { fontSize: '12px', marginTop: '4px' } }, stat.label);
    card.appendChild(iconEl);
    card.appendChild(valEl);
    card.appendChild(lblEl);
    return card;
  }

  function renderGameCard(game, onPlay) {
    var card = el('div', { className: 'featured-game-card', style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
    var bar = el('div', { className: 'game-color-bar', style: { height: '6px', borderRadius: '3px', marginBottom: '4px' } });
    var title = el('h4', { style: { fontWeight: '700', fontSize: '15px' } }, game.name || '');
    var desc = el('p', { style: { fontSize: '13px', flex: '1' } });
    desc.textContent = game.description ? game.description.slice(0, 80) : '';
    var btn = el('button', { className: 'btn-ghost game-play-btn', onClick: function () { onPlay(game.id); } });
    btn.textContent = 'Jugar';
    card.appendChild(bar);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(btn);
    return card;
  }

  function createDashboardHomePanel(opts) {
    opts = opts || {};
    var fetchGames = opts.fetchGames || (async () => []);
    var fetchSessions = opts.fetchSessions || (async () => []);
    var getToken = opts.getToken || (async () => '');
    var displayName = opts.displayName || 'Jugador';
    var onContinueSession = opts.onContinueSession || function () {};
    var onPlayGame = opts.onPlayGame || function () {};

    var state = {
      games: [],
      sessions: [],
      loading: true,
      error: null,
    };

    var root = el('div', { style: { maxWidth: '1000px', margin: '0 auto' } });

    var heroEl = el('div', { className: 'dashboard-hero', style: { marginBottom: '24px', padding: '32px' } });
    var heroTitle = el('h2', { style: { fontSize: '28px', fontWeight: '900', marginBottom: '8px' } });
    heroTitle.textContent = 'Hola ' + displayName + ' 👋';
    var heroSub = el('p', { style: { fontSize: '15px' } });
    heroSub.textContent = 'Bienvenido a LudoMIIA — tu companion de IA para juegos de mesa';
    heroEl.appendChild(heroTitle);
    heroEl.appendChild(heroSub);
    root.appendChild(heroEl);

    var statsEl = el('div', { className: 'stats-grid', style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' } });
    root.appendChild(statsEl);

    var bannerEl = el('div', { className: 'active-session-banner', style: { display: 'none', marginBottom: '24px' } });
    root.appendChild(bannerEl);

    var featuredEl = el('div', { className: 'featured-games' });
    root.appendChild(featuredEl);

    function computeStats() {
      var now = new Date();
      var thisMonth = now.getMonth();
      var completed = state.sessions.filter(function (s) { return s.status === 'completed'; });
      var inProg = state.sessions.filter(function (s) { return s.status === 'active'; });
      var thisMonthCompleted = completed.filter(function (s) {
        return new Date(s.updatedAt || s.createdAt || 0).getMonth() === thisMonth;
      });
      return {
        games: state.games.length,
        thisMonth: thisMonthCompleted.length,
        inProgress: inProg.length,
        completed: completed.length,
        inProgressSessions: inProg,
        featured: state.games.slice(0, 3),
      };
    }

    function render() {
      statsEl.innerHTML = '';
      bannerEl.innerHTML = '';
      bannerEl.style.display = 'none';
      featuredEl.innerHTML = '';

      if (state.loading) {
        var loadEl = el('div', { className: 'loading-state', style: { padding: '40px', textAlign: 'center' } });
        loadEl.textContent = 'Cargando dashboard...';
        featuredEl.appendChild(loadEl);
        STATS_CONFIG.forEach(function (stat) {
          statsEl.appendChild(renderStatCard(stat, '...'));
        });
        return;
      }

      if (state.error) {
        var errEl = el('div', { className: 'error-state', style: { padding: '40px', textAlign: 'center' } });
        errEl.textContent = state.error;
        featuredEl.appendChild(errEl);
        return;
      }

      var stats = computeStats();

      STATS_CONFIG.forEach(function (stat) {
        statsEl.appendChild(renderStatCard(stat, stats[stat.key]));
      });

      if (stats.inProgressSessions.length > 0) {
        var ses = stats.inProgressSessions[0];
        bannerEl.style.display = 'flex';
        var infoEl = el('div', { className: 'banner-info', style: { flex: '1' } });
        var lbl = el('p', { style: { fontSize: '11px', marginBottom: '4px', fontWeight: '600' } }, 'ULTIMA PARTIDA');
        var gid = el('p', { style: { fontSize: '16px', fontWeight: '700' } }, ses.gameId || '');
        var status = el('p', { style: { fontSize: '13px' } }, 'En progreso');
        infoEl.appendChild(lbl);
        infoEl.appendChild(gid);
        infoEl.appendChild(status);
        var continueBtn = el('button', { className: 'btn-primary continue-btn', onClick: function () { onContinueSession(ses.id); } });
        continueBtn.textContent = 'Continuar';
        bannerEl.appendChild(infoEl);
        bannerEl.appendChild(continueBtn);
      }

      var hdr = el('h3', { style: { fontSize: '16px', fontWeight: '700', marginBottom: '16px' } }, 'JUEGOS DESTACADOS');
      featuredEl.appendChild(hdr);

      if (stats.featured.length === 0) {
        var emptyEl = el('p', { className: 'no-games', style: { textAlign: 'center', padding: '24px' } }, 'No hay juegos disponibles.');
        featuredEl.appendChild(emptyEl);
        return;
      }

      var grid = el('div', { className: 'featured-grid', style: { display: 'grid', gap: '16px' } });
      stats.featured.forEach(function (game) {
        grid.appendChild(renderGameCard(game, onPlayGame));
      });
      featuredEl.appendChild(grid);
    }

    async function refresh() {
      state.loading = true;
      state.error = null;
      render();
      try {
        var token = await getToken();
        var results = await Promise.allSettled([fetchGames(token), fetchSessions(token)]);
        state.games = results[0].status === 'fulfilled' ? (results[0].value || []) : [];
        state.sessions = results[1].status === 'fulfilled' ? (results[1].value || []) : [];
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore start */
        state.error = err.message || 'Error al cargar dashboard';
        state.loading = false;
        render();
        /* c8 ignore stop */
      }
    }

    render();

    return {
      element: root,
      refresh,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
      _computeStats: computeStats,
    };
  }

  return createDashboardHomePanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
