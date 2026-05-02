/* c8 ignore start */
/**
 * profile-panel.js - TEC-LUDOMIIA-MIGRAR-11.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/profile/* (Next.js, deprecado).
 *
 * Perfil de jugador: avatar, stats personales, editar nombre.
 *
 * Uso:
 *   const panel = createProfilePanel({
 *     fetchProfile: async (token) => res.json(),
 *     updateProfile: async (data, token) => res.json(),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createProfilePanel = factory();
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

  function initials(name) {
    /* c8 ignore next */
    if (!name) return '?';
    return name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }

  function renderStatRow(label, value) {
    var row = el('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border, #333)' } });
    var lbl = el('span', { style: { fontSize: '14px', color: 'var(--text-3)' } });
    lbl.textContent = label;
    var val = el('span', { style: { fontSize: '14px', fontWeight: '600' } });
    /* c8 ignore next */
    val.textContent = value != null ? String(value) : '-';
    row.appendChild(lbl);
    row.appendChild(val);
    return row;
  }

  function createProfilePanel(opts) {
    opts = opts || {};
    var fetchProfile = opts.fetchProfile || (async () => null);
    /* c8 ignore next */
    var updateProfile = opts.updateProfile || (async () => null);
    var getToken = opts.getToken || (async () => '');

    var state = {
      profile: null,
      loading: true,
      error: null,
      editing: false,
      saving: false,
      saveError: null,
    };

    var root = el('div', { style: { maxWidth: '600px', margin: '0 auto' } });

    // Avatar + name section
    var avatarSection = el('div', {
      style: { textAlign: 'center', padding: '32px 0 24px', marginBottom: '24px', background: 'var(--bg-elevated)', borderRadius: '16px' },
    });
    var avatarEl = el('div', {
      className: 'profile-avatar',
      style: {
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--miia-cyan), var(--miia-violet))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', fontWeight: '800', color: 'white',
        margin: '0 auto 16px',
      },
    });
    avatarEl.textContent = '?';
    var nameEl = el('div', { className: 'profile-name', style: { fontSize: '20px', fontWeight: '700', marginBottom: '6px' } });
    nameEl.textContent = '';
    var emailEl = el('div', { style: { fontSize: '13px', color: 'var(--text-3)' } });
    emailEl.textContent = '';
    var editBtn = el('button', { className: 'btn-ghost btn-sm', style: { marginTop: '12px' }, onClick: handleEditToggle });
    editBtn.textContent = 'Editar nombre';
    avatarSection.appendChild(avatarEl);
    avatarSection.appendChild(nameEl);
    avatarSection.appendChild(emailEl);
    avatarSection.appendChild(editBtn);
    root.appendChild(avatarSection);

    // Edit form (hidden initially)
    var editForm = el('div', { className: 'edit-form', style: { display: 'none', marginBottom: '20px', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '20px' } });
    var editInput = el('input', { className: 'input', type: 'text', placeholder: 'Tu nombre', style: { width: '100%', marginBottom: '12px', boxSizing: 'border-box' } });
    var saveBtn = el('button', { className: 'btn-primary btn-sm', style: { marginRight: '8px' }, onClick: handleSave });
    saveBtn.textContent = 'Guardar';
    var cancelBtn = el('button', { className: 'btn-ghost btn-sm', onClick: handleEditToggle });
    cancelBtn.textContent = 'Cancelar';
    var saveErrorEl = el('p', { style: { color: 'var(--error, #f44)', fontSize: '13px', margin: '8px 0 0' } });
    saveErrorEl.textContent = '';
    editForm.appendChild(editInput);
    editForm.appendChild(saveBtn);
    editForm.appendChild(cancelBtn);
    editForm.appendChild(saveErrorEl);
    root.appendChild(editForm);

    // Stats section
    var statsSection = el('div', { style: { background: 'var(--bg-elevated)', borderRadius: '12px', padding: '16px 20px' } });
    var statsTitle = el('div', { style: { fontWeight: '600', fontSize: '15px', marginBottom: '4px' } }, 'Estadísticas');
    statsSection.appendChild(statsTitle);
    var statsBody = el('div', {});
    statsSection.appendChild(statsBody);
    root.appendChild(statsSection);

    function render() {
      if (state.loading) {
        avatarEl.textContent = '⏳';
        nameEl.textContent = 'Cargando...';
        emailEl.textContent = '';
        editBtn.setAttribute('disabled', 'true');
        editForm.style.display = 'none';
        statsBody.innerHTML = '';
        return;
      }
      editBtn.removeAttribute('disabled');
      if (state.error) {
        avatarEl.textContent = '!';
        nameEl.textContent = 'Error';
        emailEl.textContent = state.error;
        statsBody.innerHTML = '';
        return;
      }
      var p = state.profile || {};
      /* c8 ignore next */
      avatarEl.textContent = initials(p.displayName || p.name);
      /* c8 ignore next */
      nameEl.textContent = p.displayName || p.name || 'Sin nombre';
      /* c8 ignore next */
      emailEl.textContent = p.email || '';
      editBtn.textContent = state.editing ? 'Cancelar edición' : 'Editar nombre';
      editForm.style.display = state.editing ? 'block' : 'none';
      if (state.editing && !editInput.value) {
        /* c8 ignore next */
        editInput.value = p.displayName || p.name || '';
      }
      if (state.saveError) {
        saveErrorEl.textContent = state.saveError;
      } else {
        saveErrorEl.textContent = '';
      }
      saveBtn.textContent = state.saving ? 'Guardando...' : 'Guardar';

      statsBody.innerHTML = '';
      statsBody.appendChild(renderStatRow('Partidas jugadas', p.totalGames));
      statsBody.appendChild(renderStatRow('Victorias', p.wins));
      statsBody.appendChild(renderStatRow('Derrotas', p.losses));
      statsBody.appendChild(renderStatRow('% de victoria', p.winRate != null ? p.winRate + '%' : null));
      statsBody.appendChild(renderStatRow('Racha actual', p.currentStreak));
    }

    function handleEditToggle() {
      state.editing = !state.editing;
      state.saveError = null;
      if (!state.editing) editInput.value = '';
      render();
    }

    async function handleSave() {
      var newName = editInput.value.trim();
      if (!newName || state.saving) return;
      state.saving = true;
      state.saveError = null;
      render();
      try {
        var token = await getToken();
        var updated = await updateProfile({ displayName: newName }, token);
        if (updated && typeof updated === 'object') state.profile = updated;
        state.saving = false;
        state.editing = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.saveError = err.message || 'Error al guardar';
        state.saving = false;
        render();
      }
    }

    async function refresh() {
      state.loading = true;
      state.error = null;
      render();
      try {
        var token = await getToken();
        var profile = await fetchProfile(token);
        state.profile = profile;
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar perfil';
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
      _handleEditToggle: handleEditToggle,
      _handleSave: handleSave,
    };
  }

  return createProfilePanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
