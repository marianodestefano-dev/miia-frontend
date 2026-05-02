/* c8 ignore start */
/**
 * friends-panel.js - TEC-LUDOMIIA-MIGRAR-13.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/friends/* (Next.js, deprecado).
 *
 * Lista de amigos, estado online/offline, invitar a partida.
 *
 * Uso:
 *   const panel = createFriendsPanel({
 *     fetchFriends: async (token) => res.json(),
 *     inviteFriend: async (friendId, token) => res.json(),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createFriendsPanel = factory();
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

  function renderFriendRow(friend, onInvite, inviting) {
    var row = el('div', {
      className: 'friend-row',
      style: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 0', borderBottom: '1px solid var(--border, #333)',
      },
    });

    // Online dot
    var dot = el('span', {
      className: friend.online ? 'online-dot' : 'offline-dot',
      style: {
        width: '10px', height: '10px', borderRadius: '50%',
        background: friend.online ? '#4ade80' : 'var(--text-3)',
        flexShrink: '0',
      },
    });

    // Info
    var info = el('div', { style: { flex: '1' } });
    var nameEl = el('div', { style: { fontWeight: '600', fontSize: '14px' } });
    /* c8 ignore next */
    nameEl.textContent = friend.displayName || friend.uid || 'Amigo';
    var statusEl = el('div', { style: { fontSize: '12px', color: 'var(--text-3)' } });
    statusEl.textContent = friend.online ? 'En línea' : 'Desconectado';
    info.appendChild(nameEl);
    info.appendChild(statusEl);

    // Invite button (only if online)
    var inviteBtn = null;
    if (friend.online) {
      inviteBtn = el('button', {
        className: 'btn-primary btn-sm invite-btn',
        style: { fontSize: '12px' },
        onClick: function () { onInvite(friend.uid); },
      });
      inviteBtn.textContent = inviting ? 'Invitando...' : 'Invitar';
      if (inviting) inviteBtn.setAttribute('disabled', 'true');
    }

    row.appendChild(dot);
    row.appendChild(info);
    if (inviteBtn) row.appendChild(inviteBtn);
    return row;
  }

  function createFriendsPanel(opts) {
    opts = opts || {};
    var fetchFriends = opts.fetchFriends || (async () => []);
    /* c8 ignore next */
    var inviteFriendFn = opts.inviteFriend || (async () => null);
    var getToken = opts.getToken || (async () => '');

    var state = {
      friends: [],
      invitingId: null,
      loading: true,
      error: null,
      inviteError: null,
    };

    var root = el('div', { style: { maxWidth: '600px', margin: '0 auto' } });

    // Header
    var header = el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' } });
    var titleEl = el('h2', { style: { fontWeight: '700', fontSize: '20px', margin: '0' } }, 'Amigos');
    var onlineCountEl = el('span', { style: { fontSize: '13px', color: '#4ade80' } });
    onlineCountEl.textContent = '';
    header.appendChild(titleEl);
    header.appendChild(onlineCountEl);
    root.appendChild(header);

    // Invite error
    var inviteErrEl = el('p', { style: { color: 'var(--error, #f44)', fontSize: '13px', margin: '0 0 12px', display: 'none' } });
    inviteErrEl.textContent = '';
    root.appendChild(inviteErrEl);

    // List
    var listEl = el('div', { style: { background: 'var(--bg-elevated)', borderRadius: '12px', padding: '0 16px' } });
    root.appendChild(listEl);

    function render() {
      listEl.innerHTML = '';
      var onlineCount = state.friends.filter(function (f) { return f.online; }).length;
      onlineCountEl.textContent = onlineCount > 0 ? onlineCount + ' en línea' : '';
      if (state.loading) {
        var sk = el('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--text-3)' } });
        sk.textContent = 'Cargando amigos...';
        listEl.appendChild(sk);
        inviteErrEl.style.display = 'none';
        return;
      }
      if (state.error) {
        var errDiv = el('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--error, #f44)' } });
        errDiv.textContent = state.error;
        listEl.appendChild(errDiv);
        inviteErrEl.style.display = 'none';
        return;
      }
      if (state.inviteError) {
        inviteErrEl.textContent = state.inviteError;
        inviteErrEl.style.display = 'block';
      } else {
        inviteErrEl.style.display = 'none';
      }
      var friends = state.friends || [];
      if (friends.length === 0) {
        var emptyDiv = el('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--text-3)' } });
        emptyDiv.textContent = 'No tienes amigos agregados aun.';
        listEl.appendChild(emptyDiv);
        return;
      }
      friends.forEach(function (f) {
        var isInviting = state.invitingId === f.uid;
        listEl.appendChild(renderFriendRow(f, handleInvite, isInviting));
      });
    }

    async function handleInvite(friendId) {
      if (state.invitingId) return;
      state.invitingId = friendId;
      state.inviteError = null;
      render();
      try {
        var token = await getToken();
        await inviteFriendFn(friendId, token);
        state.invitingId = null;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.inviteError = err.message || 'Error al invitar';
        state.invitingId = null;
        render();
      }
    }

    async function refresh() {
      state.loading = true;
      state.error = null;
      render();
      try {
        var token = await getToken();
        var data = await fetchFriends(token);
        state.friends = data || [];
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar amigos';
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
      _handleInvite: handleInvite,
    };
  }

  return createFriendsPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
