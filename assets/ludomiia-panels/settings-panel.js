/* c8 ignore start */
/**
 * settings-panel.js - TEC-LUDOMIIA-MIGRAR-14.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/settings/* (Next.js, deprecado).
 *
 * Configuracion de usuario: notificaciones, idioma, privacidad.
 *
 * Uso:
 *   const panel = createSettingsPanel({
 *     fetchSettings: async (token) => res.json(),
 *     saveSettings: async (data, token) => res.json(),
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createSettingsPanel = factory();
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

  function renderToggle(label, key, value, onChange) {
    var row = el('div', {
      className: 'setting-row',
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border, #333)' },
    });
    var lbl = el('span', { style: { fontSize: '14px' } });
    lbl.textContent = label;
    var toggle = el('button', {
      className: value ? 'toggle-on' : 'toggle-off',
      style: {
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        background: value ? 'var(--miia-cyan)' : 'var(--border, #555)',
        position: 'relative', transition: 'background 0.2s',
      },
      onClick: function () { onChange(key, !value); },
    });
    row.appendChild(lbl);
    row.appendChild(toggle);
    return row;
  }

  function renderSelect(label, key, value, options, onChange) {
    var row = el('div', {
      className: 'setting-row',
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border, #333)' },
    });
    var lbl = el('span', { style: { fontSize: '14px' } });
    lbl.textContent = label;
    var select = el('select', {
      className: 'input setting-select',
      style: { fontSize: '14px', padding: '4px 8px' },
      onChange: function (e) { onChange(key, e.target.value); },
    });
    options.forEach(function (opt) {
      var option = el('option', { value: opt.value });
      option.textContent = opt.label;
      if (opt.value === value) option.setAttribute('selected', 'selected');
      select.appendChild(option);
    });
    row.appendChild(lbl);
    row.appendChild(select);
    return row;
  }

  function createSettingsPanel(opts) {
    opts = opts || {};
    var fetchSettings = opts.fetchSettings || (async () => ({}));
    /* c8 ignore next */
    var saveSettingsFn = opts.saveSettings || (async () => null);
    var getToken = opts.getToken || (async () => '');

    var LANG_OPTIONS = [
      { value: 'es', label: 'Español' },
      { value: 'en', label: 'English' },
      { value: 'pt', label: 'Português' },
    ];

    var state = {
      settings: {},
      loading: true,
      error: null,
      saving: false,
      saveMsg: null,
    };

    var root = el('div', { style: { maxWidth: '600px', margin: '0 auto' } });

    var header = el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' } });
    var titleEl = el('h2', { style: { fontWeight: '700', fontSize: '20px', margin: '0' } }, 'Configuración');
    header.appendChild(titleEl);
    root.appendChild(header);

    var bodyEl = el('div', {});
    root.appendChild(bodyEl);

    var footerEl = el('div', { style: { marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' } });
    var saveBtn = el('button', { className: 'btn-primary', onClick: handleSave });
    saveBtn.textContent = 'Guardar cambios';
    var msgEl = el('span', { style: { fontSize: '13px' } });
    msgEl.textContent = '';
    footerEl.appendChild(saveBtn);
    footerEl.appendChild(msgEl);
    root.appendChild(footerEl);

    function handleChange(key, value) {
      state.settings = Object.assign({}, state.settings, { [key]: value });
      render();
    }

    function render() {
      bodyEl.innerHTML = '';
      if (state.loading) {
        var sk = el('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--text-3)' } });
        sk.textContent = 'Cargando configuración...';
        bodyEl.appendChild(sk);
        saveBtn.setAttribute('disabled', 'true');
        msgEl.textContent = '';
        return;
      }
      saveBtn.removeAttribute('disabled');
      if (state.error) {
        var errDiv = el('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--error, #f44)' } });
        errDiv.textContent = state.error;
        bodyEl.appendChild(errDiv);
        return;
      }

      var s = state.settings;
      var section = el('div', { style: { background: 'var(--bg-elevated)', borderRadius: '12px', padding: '0 20px' } });
      section.appendChild(renderToggle('Notificaciones de partida', 'gameNotifications', !!s.gameNotifications, handleChange));
      section.appendChild(renderToggle('Invitaciones de amigos', 'friendInvites', !!s.friendInvites, handleChange));
      section.appendChild(renderToggle('Mostrar en ranking', 'showInLeaderboard', !!s.showInLeaderboard, handleChange));
      section.appendChild(renderSelect('Idioma', 'language', s.language || 'es', LANG_OPTIONS, handleChange));
      bodyEl.appendChild(section);

      if (state.saving) {
        saveBtn.setAttribute('disabled', 'true');
        saveBtn.textContent = 'Guardando...';
      } else {
        saveBtn.removeAttribute('disabled');
        saveBtn.textContent = 'Guardar cambios';
      }

      if (state.saveMsg) {
        msgEl.textContent = state.saveMsg;
      } else {
        msgEl.textContent = '';
      }
    }

    async function handleSave() {
      if (state.saving) return;
      state.saving = true;
      state.saveMsg = null;
      render();
      try {
        var token = await getToken();
        await saveSettingsFn(state.settings, token);
        state.saving = false;
        state.saveMsg = '✓ Guardado';
        render();
      } catch (err) {
        /* c8 ignore next */
        state.saveMsg = err.message || 'Error al guardar';
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
        var settings = await fetchSettings(token);
        state.settings = settings || {};
        state.loading = false;
        render();
      } catch (err) {
        /* c8 ignore next */
        state.error = err.message || 'Error al cargar configuracion';
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
      _handleChange: handleChange,
      _handleSave: handleSave,
    };
  }

  return createSettingsPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
