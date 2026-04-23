'use strict';

/**
 * FORTALEZA PRIVACY VAULT — PASSWORD RESET FLOW (C-392 B.2.b)
 *
 * Flujo de recuperación de passphrase para el owner-view cliente-side.
 *
 * Dos modos:
 *
 *   MODO A — Owner PRE-sellado (pre-ceremonia)
 *   ═══════════════════════════════════════════
 *   El owner puede resetear su passphrase porque el equipo MIIA todavía
 *   tiene escrow access a su KMS key (whitelist C-390):
 *     1. Owner pide reset vía self-chat
 *     2. Equipo MIIA valida identidad (WhatsApp OTP + master-key check)
 *     3. Backend desencripta todos los blobs existentes con la KMS key
 *     4. Backend re-encripta los blobs con una nueva passphrase que el
 *        owner elige (hash verifier regenerado)
 *     5. Nuevo salt queda persistido; el viejo se descarta.
 *
 *   MODO B — Owner POST-sellado (post-ceremonia)
 *   ═══════════════════════════════════════════
 *   NO hay recuperación. La passphrase es la única vía. Si el owner la
 *   olvida, sus datos cifrados quedan inaccesibles. La UI DEBE mostrar
 *   este disclaimer claramente antes de sellar.
 *
 * Este módulo implementa el handler UI + llamadas al backend. Las
 * operaciones criptográficas server-side (re-encrypt masivo) viven en
 * `core/privacy_vault/ceremony.js` (cuando se cablea C-394) y en un
 * script de migración aparte — este módulo solo orquesta la UI.
 *
 * Referencia: C-392 SEC-B.2.b
 * NO USAR en producción hasta firma C-394 deploy.
 */

const decryptClient = require('./decrypt_client');

function createResetFlow({ uid, fetchFn, rootEl, onDone }) {
  if (!uid) throw new Error('[PASSWORD_RESET_FLOW] uid requerido');
  if (typeof fetchFn !== 'function') throw new Error('[PASSWORD_RESET_FLOW] fetchFn requerida');

  const api = { uid, _mode: null };

  api.start = async function start() {
    // Chequear si el owner está sellado
    const res = await fetchFn(`/api/privacy_vault/${uid}/sealed_status`);
    if (res.ok) {
      const { sealed } = await res.json();
      api._mode = sealed ? 'post_sealed' : 'pre_sealed';
    } else {
      api._mode = 'pre_sealed'; // fallback conservador
    }
    api._render();
  };

  api._render = function render() {
    if (!rootEl) return;
    if (api._mode === 'post_sealed') {
      rootEl.innerHTML = `
        <div class="fortaleza-reset fortaleza-reset-sealed">
          <h3>⚠️ Passphrase no recuperable</h3>
          <p>Tu Fortaleza ya fue sellada. La passphrase es la única vía de lectura — no la tenemos nosotros, no podemos recuperarla.</p>
          <p>Si la olvidaste, tus datos cifrados quedan inaccesibles. Podés seguir operando MIIA normalmente con conversaciones nuevas, pero las anteriores al sellado se pierden desde tu vista.</p>
          <button id="fortaleza-reset-ack">Entiendo</button>
        </div>
      `;
      const btn = rootEl.querySelector('#fortaleza-reset-ack');
      if (btn && typeof onDone === 'function') {
        btn.addEventListener('click', () => onDone({ recovered: false, reason: 'sealed' }));
      }
    } else {
      rootEl.innerHTML = `
        <div class="fortaleza-reset fortaleza-reset-presealed">
          <h3>🔓 Recuperar passphrase</h3>
          <p>Tu Fortaleza NO está sellada — el equipo MIIA puede regenerarla con autorización directa tuya.</p>
          <ol>
            <li>Vas a recibir un código OTP por WhatsApp al número registrado.</li>
            <li>Ingresá el código + tu nueva passphrase (mínimo 8 caracteres).</li>
            <li>Vamos a re-encriptar tus datos con la nueva passphrase. Esto puede demorar unos minutos.</li>
          </ol>
          <button id="fortaleza-reset-request-otp">Enviar código OTP</button>
          <div id="fortaleza-reset-otp-step" hidden>
            <input type="text" id="fortaleza-reset-otp" placeholder="Código OTP" autocomplete="off" />
            <input type="password" id="fortaleza-reset-new-passphrase" placeholder="Nueva passphrase (mín 8 chars)" autocomplete="off" />
            <button id="fortaleza-reset-submit">Reencriptar y actualizar</button>
          </div>
          <p class="fortaleza-hint">Si ya estás sellado este flujo no está disponible. Ver FAQ /security.</p>
        </div>
      `;
      const reqBtn = rootEl.querySelector('#fortaleza-reset-request-otp');
      const otpStep = rootEl.querySelector('#fortaleza-reset-otp-step');
      const submitBtn = rootEl.querySelector('#fortaleza-reset-submit');

      if (reqBtn) {
        reqBtn.addEventListener('click', async () => {
          try {
            const resp = await fetchFn(`/api/privacy_vault/${uid}/reset_request_otp`, { method: 'POST' });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            if (otpStep) otpStep.hidden = false;
          } catch (err) {
            alert(`Error enviando OTP: ${err.message}`);
          }
        });
      }

      if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
          const otp = rootEl.querySelector('#fortaleza-reset-otp')?.value || '';
          const newPassphrase = rootEl.querySelector('#fortaleza-reset-new-passphrase')?.value || '';
          if (otp.length < 4) return alert('OTP inválido');
          if (newPassphrase.length < 8) return alert('Passphrase muy corta (mínimo 8 chars)');
          try {
            const resp = await fetchFn(`/api/privacy_vault/${uid}/reset_execute`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ otp, new_passphrase: newPassphrase }),
            });
            if (!resp.ok) {
              const body = await resp.json().catch(() => ({}));
              throw new Error(body.error || `HTTP ${resp.status}`);
            }
            // Evictar cualquier llave anterior en memoria (si el owner venía de una sesión previa)
            decryptClient.evictKey();
            if (typeof onDone === 'function') onDone({ recovered: true });
          } catch (err) {
            alert(`Error al re-encriptar: ${err.message}`);
          }
        });
      }
    }
  };

  return api;
}

module.exports = {
  createResetFlow,
};
