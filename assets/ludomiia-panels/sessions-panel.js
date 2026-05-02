/* c8 ignore start */
/**
 * sessions-panel.js - TEC-LUDOMIIA-MIGRAR-22.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/sessions/page.tsx (Next.js, deprecado).
 *
 * Lista de sesiones con tabs: En progreso / Completadas.
 *
 * Uso:
 *   const panel = createSessionsPanel({
 *     fetchSessions:     async (token) => Session[],
 *     getToken:          async () => 'jwt',
 *     onContinueSession: (sessionId) => {},
 *     onViewReplay:      (sessionId) => {},
 *     onGoToLibrary:     () => {},
 *   });
 *   panel.load();
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createSessionsPanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function el(tag, attrs) {
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
    return e;
  }

  function createSessionsPanel(opts) {
    opts = opts || {};
    var fetchSessionsFn    = opts.fetchSessions     || (async () => []);
    var getToken           = opts.getToken           || (async () => '');
    var onContinueSession  = opts.onContinueSession  || function () {};
    var onViewReplay       = opts.onViewReplay        || function () {};
    var onGoToLibrary      = opts.onGoToLibrary       || function () {};

    var state = {
      sessions: [],
      loading:  true,
      tab:      'active',
    };

    var root = el('div', { className: 'sessions-panel', style: { maxWidth: '800px', margin: '0 auto' } });

    var tabBarEl = el('div', { className: 'sessions-tab-bar', style: { display: 'flex', gap: '10px', marginBottom: '24px' } });

    var tabActiveBtn = el('button', { className: 'btn-primary tab-active-btn', onClick: function () {
      if (state.tab !== 'active') { state.tab = 'active'; render(); }
    }});

    var tabCompletedBtn = el('button', { className: 'btn-ghost tab-completed-btn', onClick: function () {
      if (state.tab !== 'completed') { state.tab = 'completed'; render(); }
    }});

    tabBarEl.appendChild(tabActiveBtn);
    tabBarEl.appendChild(tabCompletedBtn);
    root.appendChild(tabBarEl);

    var bodyEl = el('div', { className: 'sessions-body' });
    root.appendChild(bodyEl);

    function filterSessions() {
      var active    = state.sessions.filter(function (s) { return s.status === 'active'; });
      var completed = state.sessions.filter(function (s) { return s.status === 'completed'; });
      return { active: active, completed: completed };
    }

    function renderEmptyState(tab) {
      var emptyEl = el('div', { className: 'sessions-empty card', style: { textAlign: 'center', padding: '40px 20px' } });
      var emojiEl = document.createElement('p');
      emojiEl.className = 'sessions-empty-emoji';
      emojiEl.textContent = tab === 'active' ? '🎲' : '🏆';
      var msgEl = document.createElement('p');
      msgEl.className = 'sessions-empty-msg';
      msgEl.textContent = tab === 'active'
        ? 'No tienes partidas en progreso.'
        : 'No tienes partidas completadas.';
      var libBtn = el('button', { className: 'btn-primary sessions-go-library', onClick: function () { onGoToLibrary(); } });
      libBtn.textContent = 'Ir a Biblioteca';
      emptyEl.appendChild(emojiEl);
      emptyEl.appendChild(msgEl);
      emptyEl.appendChild(libBtn);
      return emptyEl;
    }

    function renderSessionCard(s) {
      var card = el('div', { className: 'session-card card', style: { display: 'flex', alignItems: 'center', gap: '16px' } });
      var infoEl = el('div', { style: { flex: '1' } });
      var gameName = document.createElement('p');
      gameName.className = 'session-card-game';
      gameName.style.fontWeight = '700';
      gameName.textContent = s.gameId || '';
      var dateEl = document.createElement('p');
      dateEl.className = 'session-card-date';
      try {
        dateEl.textContent = new Date(s.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch {
        /* c8 ignore next */
        dateEl.textContent = s.createdAt || '';
      }
      infoEl.appendChild(gameName);
      infoEl.appendChild(dateEl);
      var badgeEl = document.createElement('span');
      badgeEl.className = s.status === 'active' ? 'badge badge-cyan session-badge' : 'badge badge-violet session-badge';
      badgeEl.textContent = s.status === 'active' ? 'En progreso' : 'Completada';
      card.appendChild(infoEl);
      card.appendChild(badgeEl);
      if (s.status === 'active') {
        var continueBtn = el('button', { className: 'btn-primary btn-sm session-continue-btn', onClick: function () { onContinueSession(s.id); } });
        continueBtn.textContent = 'Continuar';
        card.appendChild(continueBtn);
      } else {
        var replayBtn = el('button', { className: 'btn-ghost btn-sm session-replay-btn', onClick: function () { onViewReplay(s.id); } });
        replayBtn.textContent = 'Replay';
        card.appendChild(replayBtn);
      }
      return card;
    }

    function render() {
      var filtered = filterSessions();
      var active    = filtered.active;
      var completed = filtered.completed;

      tabActiveBtn.className = state.tab === 'active' ? 'btn-primary tab-active-btn' : 'btn-ghost tab-active-btn';
      tabActiveBtn.textContent = active.length > 0 ? 'En progreso (' + active.length + ')' : 'En progreso';
      tabCompletedBtn.className = state.tab === 'completed' ? 'btn-primary tab-completed-btn' : 'btn-ghost tab-completed-btn';
      tabCompletedBtn.textContent = completed.length > 0 ? 'Completadas (' + completed.length + ')' : 'Completadas';

      bodyEl.innerHTML = '';
      if (state.loading) {
        var loadingEl = document.createElement('p');
        loadingEl.className = 'sessions-loading';
        loadingEl.textContent = 'Cargando partidas...';
        bodyEl.appendChild(loadingEl);
        return;
      }
      var visible = state.tab === 'active' ? active : completed;
      if (visible.length === 0) {
        bodyEl.appendChild(renderEmptyState(state.tab));
        return;
      }
      var listEl = el('div', { className: 'sessions-list', style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
      visible.forEach(function (s) { listEl.appendChild(renderSessionCard(s)); });
      bodyEl.appendChild(listEl);
    }

    async function load() {
      state.loading  = true;
      state.sessions = [];
      render();
      try {
        var token    = await getToken();
        var sessions = await fetchSessionsFn(token);
        state.sessions = Array.isArray(sessions) ? sessions : [];
      } catch {
        /* c8 ignore next */
        state.sessions = [];
      }
      state.loading = false;
      render();
    }

    render();

    return {
      element:      root,
      load,
      _state:       state,
      _setState:    function (s) { Object.assign(state, s); render(); },
      _filterSessions: filterSessions,
    };
  }

  return createSessionsPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
