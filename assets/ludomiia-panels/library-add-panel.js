/* c8 ignore start */
/**
 * library-add-panel.js - TEC-LUDOMIIA-MIGRAR-17.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/library/add/page.tsx (Next.js, deprecado).
 *
 * Wizard 3 pasos para agregar un juego a la biblioteca del owner.
 * Solo disponible para owners.
 *
 * Uso:
 *   const panel = createLibraryAddPanel({
 *     fetchGames: async (token) => [],
 *     addGame: async (data, token) => {},
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     isOwner: true,
 *     onSuccess: () => {},
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createLibraryAddPanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var STEPS = ['Verificar', 'Datos del juego', 'Preview'];
  var GAME_TYPES_ADD = ['competitivo', 'cooperativo', 'solitario'];

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

  function createLibraryAddPanel(opts) {
    opts = opts || {};
    var fetchGames = opts.fetchGames || (async () => []);
    var addGameFn = opts.addGame || (async () => null);
    var getToken = opts.getToken || (async () => '');
    var isOwner = !!opts.isOwner;
    var onSuccess = opts.onSuccess || function () {};

    var state = {
      step: 0,
      search: '',
      found: null,
      form: { name: '', description: '', type: 'competitivo', minPlayers: 2, maxPlayers: 4, avgDuration: 60 },
      loading: false,
      submitError: null,
    };

    var root = el('div', { style: { maxWidth: '600px', margin: '0 auto' } });

    var titleEl = el('h2', { style: { fontSize: '22px', fontWeight: '800', marginBottom: '24px' } }, 'Agregar juego');
    root.appendChild(titleEl);

    var progressEl = el('div', { className: 'add-progress', style: { display: 'flex', gap: '6px', marginBottom: '32px' } });
    STEPS.forEach(function (_, i) {
      var bar = el('div', { className: 'progress-bar-step', style: { flex: '1', height: '4px', borderRadius: '2px' } });
      bar.setAttribute('data-step', String(i));
      progressEl.appendChild(bar);
    });
    root.appendChild(progressEl);

    var bodyEl = el('div', { className: 'add-body' });
    root.appendChild(bodyEl);

    if (!isOwner) {
      var noAccessEl = el('p', { className: 'no-access', style: { padding: '24px', textAlign: 'center' } }, 'Solo disponible para owners.');
      bodyEl.appendChild(noAccessEl);
      return {
        element: root,
        _state: state,
        _setState: function (s) { Object.assign(state, s); },
      };
    }

    function updateProgress() {
      progressEl.querySelectorAll('.progress-bar-step').forEach(function (bar) {
        var stepIdx = parseInt(bar.getAttribute('data-step'), 10);
        bar.style.background = stepIdx <= state.step ? 'var(--accent, #00e5ff)' : 'var(--border, #333)';
      });
    }

    function renderStep0() {
      bodyEl.innerHTML = '';
      updateProgress();
      var card = el('div', { className: 'add-card', style: { padding: '24px' } });

      var titleEl0 = el('h3', { style: { marginBottom: '16px', fontWeight: '700' } }, 'Paso 1: Verificar que no existe');

      var rowEl = el('div', { style: { display: 'flex', gap: '10px' } });
      var searchInput = el('input', { className: 'input add-search-input', style: { flex: '1' } });
      searchInput.setAttribute('placeholder', 'Nombre del juego');
      searchInput.value = state.search;
      searchInput.addEventListener('input', function (e) { state.search = e.target.value; });

      var searchBtn = el('button', { className: 'btn-primary add-search-btn', onClick: handleCheck });
      searchBtn.textContent = 'Buscar';

      rowEl.appendChild(searchInput);
      rowEl.appendChild(searchBtn);

      card.appendChild(titleEl0);
      card.appendChild(rowEl);

      if (state.found === true) {
        var existsEl = el('p', { className: 'found-exists', style: { marginTop: '12px' } }, '⚠️ Ya existe un juego con ese nombre.');
        card.appendChild(existsEl);
      }
      if (state.found === false) {
        var notFoundEl = el('p', { className: 'found-clear', style: { marginTop: '12px' } }, '✅ No encontrado. Puedes agregar.');
        card.appendChild(notFoundEl);
      }

      bodyEl.appendChild(card);
    }

    function renderStep1() {
      bodyEl.innerHTML = '';
      updateProgress();
      var card = el('div', { className: 'add-card', style: { padding: '24px' } });

      var titleEl1 = el('h3', { style: { marginBottom: '20px', fontWeight: '700' } }, 'Paso 2: Datos del juego');

      var fieldsEl = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } });

      var nameLabel = el('label', { style: { fontSize: '12px', display: 'block', marginBottom: '6px' } }, 'Nombre');
      var nameInput = el('input', { className: 'input add-name-input' });
      nameInput.value = state.form.name;
      nameInput.addEventListener('input', function (e) { state.form.name = e.target.value; });
      var nameField = el('div');
      nameField.appendChild(nameLabel);
      nameField.appendChild(nameInput);
      fieldsEl.appendChild(nameField);

      var descLabel = el('label', { style: { fontSize: '12px', display: 'block', marginBottom: '6px' } }, 'Descripcion');
      var descInput = el('input', { className: 'input add-desc-input' });
      descInput.value = state.form.description;
      descInput.addEventListener('input', function (e) { state.form.description = e.target.value; });
      var descField = el('div');
      descField.appendChild(descLabel);
      descField.appendChild(descInput);
      fieldsEl.appendChild(descField);

      var typeLabel = el('label', { style: { fontSize: '12px', display: 'block', marginBottom: '6px' } }, 'Tipo');
      var typeSelect = el('select', { className: 'input add-type-select' });
      GAME_TYPES_ADD.forEach(function (t) {
        var opt = el('option', { value: t });
        opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
        if (t === state.form.type) opt.setAttribute('selected', 'selected');
        typeSelect.appendChild(opt);
      });
      typeSelect.value = state.form.type;
      typeSelect.addEventListener('change', function (e) { state.form.type = e.target.value; });
      var typeField = el('div');
      typeField.appendChild(typeLabel);
      typeField.appendChild(typeSelect);
      fieldsEl.appendChild(typeField);

      var numRow = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' } });
      [
        { label: 'Min jugadores', key: 'minPlayers', cls: 'add-min-input' },
        { label: 'Max jugadores', key: 'maxPlayers', cls: 'add-max-input' },
        { label: 'Duracion (min)', key: 'avgDuration', cls: 'add-dur-input' },
      ].forEach(function (field) {
        var lbl = el('label', { style: { fontSize: '11px', display: 'block', marginBottom: '6px' } }, field.label);
        var inp = el('input', { className: 'input ' + field.cls });
        inp.setAttribute('type', 'number');
        inp.value = String(state.form[field.key]);
        inp.addEventListener('input', function (e) { state.form[field.key] = Number(e.target.value); });
        var col = el('div');
        col.appendChild(lbl);
        col.appendChild(inp);
        numRow.appendChild(col);
      });
      fieldsEl.appendChild(numRow);

      var actEl = el('div', { style: { display: 'flex', gap: '10px', marginTop: '20px' } });
      var backBtn = el('button', { className: 'btn-ghost add-back-btn', onClick: function () { state.step = 0; renderStep0(); } });
      backBtn.textContent = 'Atras';
      var nextBtn = el('button', { className: 'btn-primary add-next-btn', onClick: function () { state.step = 2; renderStep2(); } });
      nextBtn.textContent = 'Preview →';
      actEl.appendChild(backBtn);
      actEl.appendChild(nextBtn);

      card.appendChild(titleEl1);
      card.appendChild(fieldsEl);
      card.appendChild(actEl);
      bodyEl.appendChild(card);
    }

    function renderStep2() {
      bodyEl.innerHTML = '';
      updateProgress();

      var previewCard = el('div', { className: 'add-card preview-card', style: { marginBottom: '20px', padding: '24px' } });
      var nameEl2 = el('h4', { style: { fontWeight: '700', fontSize: '16px', marginBottom: '8px' } }, state.form.name || 'Sin nombre');
      var descEl2 = el('p', { style: { fontSize: '13px', marginBottom: '12px' } }, state.form.description || '');
      var badgesEl = el('div', { style: { display: 'flex', gap: '8px' } });
      var typeBadge = el('span', { className: 'badge badge-cyan preview-type' }, state.form.type);
      var playersBadge = el('span', { className: 'badge badge-violet preview-players' });
      playersBadge.textContent = state.form.minPlayers + '-' + state.form.maxPlayers + ' jugadores';
      var durBadge = el('span', { className: 'badge preview-dur' }, state.form.avgDuration + ' min');
      badgesEl.appendChild(typeBadge);
      badgesEl.appendChild(playersBadge);
      badgesEl.appendChild(durBadge);
      previewCard.appendChild(nameEl2);
      previewCard.appendChild(descEl2);
      previewCard.appendChild(badgesEl);

      if (state.submitError) {
        var errEl = el('p', { className: 'submit-error', style: { marginBottom: '12px' } }, state.submitError);
        previewCard.appendChild(errEl);
      }

      var actEl2 = el('div', { style: { display: 'flex', gap: '10px' } });
      var backBtn2 = el('button', { className: 'btn-ghost add-back-btn2', onClick: function () { state.step = 1; renderStep1(); } });
      backBtn2.textContent = 'Atras';
      var submitBtn = el('button', { className: 'btn-primary add-submit-btn', onClick: handleSubmit });
      if (state.loading) {
        submitBtn.setAttribute('disabled', 'true');
        submitBtn.textContent = 'Guardando...';
      } else {
        submitBtn.textContent = '✅ Agregar juego';
      }
      actEl2.appendChild(backBtn2);
      actEl2.appendChild(submitBtn);

      bodyEl.appendChild(previewCard);
      bodyEl.appendChild(actEl2);
    }

    function render() {
      if (state.step === 0) renderStep0();
      else if (state.step === 1) renderStep1();
      else renderStep2();
    }

    async function handleCheck() {
      var token = await getToken();
      var games = await fetchGames(token);
      var search = state.search.toLowerCase();
      var exists = games.some(function (g) { return (g.name || '').toLowerCase().includes(search); });
      state.found = exists;
      if (!exists) state.step = 1;
      render();
    }

    async function handleSubmit() {
      if (state.loading) return;
      state.loading = true;
      state.submitError = null;
      renderStep2();
      try {
        var token = await getToken();
        await addGameFn(state.form, token);
        state.loading = false;
        onSuccess();
      } catch (err) {
        state.submitError = err.message || 'Error al guardar';
        state.loading = false;
        renderStep2();
      }
    }

    render();

    return {
      element: root,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
      _handleCheck: handleCheck,
      _handleSubmit: handleSubmit,
    };
  }

  return createLibraryAddPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
