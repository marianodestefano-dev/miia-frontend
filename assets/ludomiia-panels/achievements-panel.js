/* c8 ignore start */
/**
 * achievements-panel.js - TEC-LUDOMIIA-MIGRAR-12.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/achievements/* (Next.js, deprecado).
 *
 * Muestra logros desbloqueados y bloqueados con progreso.
 *
 * Uso:
 *   const panel = createAchievementsPanel({
 *     fetchAchievements: async (token) => res.json(),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createAchievementsPanel = factory();
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

  function renderAchievement(ach) {
    var unlocked = ach.unlockedAt != null;
    var card = el('div', {
      className: 'achievement-card',
      style: {
        background: 'var(--bg-elevated)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        opacity: unlocked ? '1' : '0.5',
        border: unlocked ? '1px solid var(--miia-cyan)' : '1px solid var(--border, #333)',
        marginBottom: '10px',
      },
    });
    var icon = el('div', { style: { fontSize: '32px', minWidth: '40px', textAlign: 'center' } });
    /* c8 ignore next */
    icon.textContent = ach.icon || '🏅';
    var body = el('div', { style: { flex: '1' } });
    var title = el('div', { style: { fontWeight: '700', fontSize: '15px', marginBottom: '4px' } });
    /* c8 ignore next */
    title.textContent = ach.title || 'Logro';
    var desc = el('div', { style: { fontSize: '13px', color: 'var(--text-3)', marginBottom: '8px' } });
    /* c8 ignore next */
    desc.textContent = ach.description || '';
    body.appendChild(title);
    body.appendChild(desc);

    if (ach.progress != null && ach.total != null && !unlocked) {
      var pct = Math.min(100, Math.round((ach.progress / ach.total) * 100));
      var barWrap = el('div', { style: { height: '6px', background: 'var(--border, #333)', borderRadius: '3px', overflow: 'hidden' } });
      var bar = el('div', { style: { height: '100%', width: pct + '%', background: 'var(--miia-cyan)', borderRadius: '3px' } });
      barWrap.appendChild(bar);
      body.appendChild(barWrap);
      var progressText = el('div', { style: { fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' } });
      progressText.textContent = ach.progress + ' / ' + ach.total;
      body.appendChild(progressText);
    }

    if (unlocked) {
      var badge = el('div', { style: { fontSize: '12px', color: 'var(--miia-cyan)', fontWeight: '600', marginTop: '4px' } });
      badge.textContent = '✓ Desbloqueado';
      body.appendChild(badge);
    }

    card.appendChild(icon);
    card.appendChild(body);
    return card;
  }

  function createAchievementsPanel(opts) {
    opts = opts || {};
    var fetchAchievements = opts.fetchAchievements || (async () => []);
    var getToken = opts.getToken || (async () => '');

    var state = {
      achievements: [],
      filter: 'all',
      loading: true,
      error: null,
    };

    var root = el('div', { style: { maxWidth: '700px', margin: '0 auto' } });

    // Header
    var header = el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' } });
    var titleEl = el('h2', { style: { fontWeight: '700', fontSize: '20px', margin: '0' } }, 'Logros');
    var countEl = el('span', { style: { fontSize: '13px', color: 'var(--text-3)' } });
    countEl.textContent = '';
    header.appendChild(titleEl);
    header.appendChild(countEl);
    root.appendChild(header);

    // Filter tabs
    var tabsEl = el('div', { style: { display: 'flex', gap: '8px', marginBottom: '20px' } });
    var tabAll = el('button', { className: 'tab-btn tab-active', onClick: function () { handleFilter('all'); } });
    tabAll.textContent = 'Todos';
    var tabUnlocked = el('button', { className: 'tab-btn', onClick: function () { handleFilter('unlocked'); } });
    tabUnlocked.textContent = 'Desbloqueados';
    var tabLocked = el('button', { className: 'tab-btn', onClick: function () { handleFilter('locked'); } });
    tabLocked.textContent = 'Bloqueados';
    tabsEl.appendChild(tabAll);
    tabsEl.appendChild(tabUnlocked);
    tabsEl.appendChild(tabLocked);
    root.appendChild(tabsEl);

    // List
    var listEl = el('div', {});
    root.appendChild(listEl);

    function render() {
      listEl.innerHTML = '';
      var unlockedCount = state.achievements.filter(function (a) { return a.unlockedAt != null; }).length;
      countEl.textContent = unlockedCount + ' / ' + state.achievements.length + ' desbloqueados';
      if (state.loading) {
        var sk = el('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--text-3)' } });
        sk.textContent = 'Cargando logros...';
        listEl.appendChild(sk);
        return;
      }
      if (state.error) {
        var errDiv = el('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--error, #f44)' } });
        errDiv.textContent = state.error;
        listEl.appendChild(errDiv);
        return;
      }
      var visible = state.achievements.filter(function (a) {
        if (state.filter === 'unlocked') return a.unlockedAt != null;
        if (state.filter === 'locked') return a.unlockedAt == null;
        return true;
      });
      if (visible.length === 0) {
        var emptyDiv = el('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--text-3)' } });
        emptyDiv.textContent = 'Sin logros en este filtro.';
        listEl.appendChild(emptyDiv);
        return;
      }
      visible.forEach(function (a) { listEl.appendChild(renderAchievement(a)); });
    }

    function handleFilter(f) {
      state.filter = f;
      tabAll.className = f === 'all' ? 'tab-btn tab-active' : 'tab-btn';
      tabUnlocked.className = f === 'unlocked' ? 'tab-btn tab-active' : 'tab-btn';
      tabLocked.className = f === 'locked' ? 'tab-btn tab-active' : 'tab-btn';
      render();
    }

    async function refresh() {
      state.loading = true;
      state.error = null;
      render();
      try {
        var token = await getToken();
        var data = await fetchAchievements(token);
        state.achievements = data || [];
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar logros';
        state.loading = false;
        render();
      }
    }

    render();

    return {
      element: root,
      refresh,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
      _handleFilter: handleFilter,
    };
  }

  return createAchievementsPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
