/* c8 ignore start */
/**
 * onboarding-panel.js - TEC-LUDOMIIA-MIGRAR-18.
 *
 * Panel JS vanilla para owner-dashboard.html que reemplaza
 * apps/web-ludomiia/app/(app)/onboarding/page.tsx (Next.js, deprecado).
 *
 * Wizard 3 pasos: nickname → tipo de jugador → confirmacion.
 *
 * Uso:
 *   const panel = createOnboardingPanel({
 *     saveProfile: async (data, token) => {},
 *     getToken: () => firebase.auth().currentUser.getIdToken(),
 *     onComplete: () => {},
 *   });
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createOnboardingPanel = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  var GAME_TYPES_OB = [
    { key: 'competitivo', label: 'Competitivo', desc: 'Me gusta ganar.', icon: '⚔️' },
    { key: 'cooperativo', label: 'Cooperativo', desc: 'Juego en equipo.', icon: '🤝' },
    { key: 'solitario',   label: 'Solitario',   desc: 'Me gusta solo.',   icon: '🧩' },
  ];

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

  function createOnboardingPanel(opts) {
    opts = opts || {};
    var saveProfileFn = opts.saveProfile || (async () => null);
    var getToken = opts.getToken || (async () => '');
    var onComplete = opts.onComplete || function () {};

    var state = {
      step: 1,
      nickname: '',
      gameType: '',
      saving: false,
    };

    var root = el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' } });
    var card = el('div', { className: 'onboarding-card', style: { maxWidth: '480px', width: '100%', padding: '40px 32px' } });
    root.appendChild(card);

    var progressEl = el('div', { className: 'onboarding-progress', style: { display: 'flex', gap: '8px', marginBottom: '32px' } });
    [1, 2, 3].forEach(function (s) {
      var bar = el('div', { className: 'ob-progress-step', style: { flex: '1', height: '4px', borderRadius: '2px' } });
      bar.setAttribute('data-s', String(s));
      progressEl.appendChild(bar);
    });
    card.appendChild(progressEl);

    var bodyEl = el('div', { className: 'ob-body' });
    card.appendChild(bodyEl);

    function updateProgress() {
      progressEl.querySelectorAll('.ob-progress-step').forEach(function (bar) {
        var s = parseInt(bar.getAttribute('data-s'), 10);
        bar.style.background = s <= state.step ? 'var(--miia-cyan, #00e5ff)' : 'var(--border, #333)';
      });
    }

    function renderStep1() {
      bodyEl.innerHTML = '';
      updateProgress();

      var titleEl = el('h2', { style: { fontSize: '24px', fontWeight: '800', marginBottom: '8px' } }, 'Bienvenido a LudoMIIA');
      var subEl = el('p', { style: { marginBottom: '24px', lineHeight: '1.6' } }, 'En 2 pasos rapidos vamos a personalizar tu experiencia.');
      var lbl = el('label', { style: { fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' } }, 'Como quieres que te llame MIIA?');
      var nickInput = el('input', { className: 'input ob-nick-input', style: { marginBottom: '24px' } });
      nickInput.setAttribute('placeholder', 'Tu apodo');
      nickInput.value = state.nickname;
      nickInput.addEventListener('input', function (e) { state.nickname = e.target.value; updateNextBtn(); });

      var nextBtn = el('button', { className: 'btn-primary ob-next1-btn', style: { width: '100%' }, onClick: function () { state.step = 2; render(); } });
      nextBtn.textContent = 'Siguiente →';
      if (!state.nickname.trim()) nextBtn.setAttribute('disabled', 'true');

      bodyEl.appendChild(titleEl);
      bodyEl.appendChild(subEl);
      bodyEl.appendChild(lbl);
      bodyEl.appendChild(nickInput);
      bodyEl.appendChild(nextBtn);

      function updateNextBtn() {
        if (state.nickname.trim()) {
          nextBtn.removeAttribute('disabled');
        } else {
          nextBtn.setAttribute('disabled', 'true');
        }
      }
    }

    function renderStep2() {
      bodyEl.innerHTML = '';
      updateProgress();

      var titleEl = el('h2', { style: { fontSize: '22px', fontWeight: '800', marginBottom: '8px' } }, 'Que tipo de jugador sos?');
      var subEl = el('p', { style: { marginBottom: '24px' } }, 'MIIA adaptara sus sugerencias a tu estilo.');
      var listEl = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' } });

      GAME_TYPES_OB.forEach(function (gt) {
        var btn = el('button', {
          className: 'ob-type-btn',
          style: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '8px', border: '1px solid', borderColor: state.gameType === gt.key ? 'var(--miia-cyan)' : 'var(--border)', cursor: 'pointer', textAlign: 'left' },
          onClick: function () { state.gameType = gt.key; renderStep2(); },
        });
        btn.setAttribute('data-gt', gt.key);
        var iconEl = el('span', { style: { fontSize: '28px' } }, gt.icon);
        var infoEl = el('div');
        var lbl2 = el('p', { style: { fontWeight: '700', marginBottom: '2px' } }, gt.label);
        var desc2 = el('p', { style: { fontSize: '12px' } }, gt.desc);
        infoEl.appendChild(lbl2);
        infoEl.appendChild(desc2);
        btn.appendChild(iconEl);
        btn.appendChild(infoEl);
        listEl.appendChild(btn);
      });

      var actEl = el('div', { style: { display: 'flex', gap: '8px' } });
      var backBtn = el('button', { className: 'btn-ghost ob-back2-btn', style: { flex: '1' }, onClick: function () { state.step = 1; render(); } });
      backBtn.textContent = '← Atras';
      var nextBtn2 = el('button', { className: 'btn-primary ob-next2-btn', style: { flex: '2' }, onClick: function () { state.step = 3; render(); } });
      nextBtn2.textContent = 'Siguiente →';
      if (!state.gameType) nextBtn2.setAttribute('disabled', 'true');
      actEl.appendChild(backBtn);
      actEl.appendChild(nextBtn2);

      bodyEl.appendChild(titleEl);
      bodyEl.appendChild(subEl);
      bodyEl.appendChild(listEl);
      bodyEl.appendChild(actEl);
    }

    function renderStep3() {
      bodyEl.innerHTML = '';
      updateProgress();

      var doneDiv = el('div', { style: { textAlign: 'center', marginBottom: '32px' } });
      var iconEl = el('div', { style: { fontSize: '64px', marginBottom: '16px' } }, '🎲');
      var titleEl = el('h2', { style: { fontSize: '24px', fontWeight: '800', marginBottom: '8px' } }, 'Listo, ' + (state.nickname || 'jugador') + '!');
      var subEl = el('p', { style: { lineHeight: '1.6' } }, 'MIIA esta lista para acompanarte en tus partidas. Explora la biblioteca y empieza tu primera sesion.');
      doneDiv.appendChild(iconEl);
      doneDiv.appendChild(titleEl);
      doneDiv.appendChild(subEl);

      var finishBtn = el('button', { className: 'btn-primary ob-finish-btn', style: { width: '100%', fontSize: '16px', padding: '14px' }, onClick: handleFinish });
      if (state.saving) {
        finishBtn.setAttribute('disabled', 'true');
        finishBtn.textContent = 'Guardando...';
      } else {
        finishBtn.textContent = 'Ir a la biblioteca 🎲';
      }

      bodyEl.appendChild(doneDiv);
      bodyEl.appendChild(finishBtn);
    }

    function render() {
      if (state.step === 1) renderStep1();
      else if (state.step === 2) renderStep2();
      else renderStep3();
    }

    async function handleFinish() {
      if (state.saving) return;
      state.saving = true;
      renderStep3();
      try {
        var token = await getToken();
        await saveProfileFn({ nickname: state.nickname, preferredGameType: state.gameType }, token);
      } catch {
        /* c8 ignore next */
      }
      state.saving = false;
      onComplete();
    }

    render();

    return {
      element: root,
      _state: state,
      _setState: function (s) { Object.assign(state, s); render(); },
      _handleFinish: handleFinish,
    };
  }

  return createOnboardingPanel;
/* c8 ignore start */
}));
/* c8 ignore stop */
