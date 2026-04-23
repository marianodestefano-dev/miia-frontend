'use strict';

/**
 * FORTALEZA PRIVACY VAULT — OWNER CHAT VIEWER (C-392 B.2.b)
 *
 * Equivalente vanilla de lo que C-392 SEC-B.2 llamó `OwnerChatViewer.jsx`.
 * El frontend MIIA es vanilla HTML/JS (no hay build JSX), entonces expongo
 * una función de attach que opera sobre elementos DOM ya renderizados en
 * `owner-dashboard.html`.
 *
 * Flujo (8 pasos de C-392 SEC-B.2):
 *   1. Usuario abre pestaña "Mis conversaciones (privado)"
 *   2. Se pide passphrase (modal)
 *   3. Backend devuelve salt (`GET /api/privacy_vault/:uid/salt`)
 *   4. Cliente llama `decrypt_client.deriveKey({ uid, passphrase, salt })`
 *   5. Usuario selecciona conversación de la lista
 *   6. Backend devuelve ciphertext (`GET /api/privacy_vault/:uid/ciphertext?conversation_id=X`)
 *   7. Cliente llama `decrypt_client.decryptChat(blob, uid)`
 *   8. Al cerrar pestaña / timeout → `decrypt_client.evictKey()`
 *
 * NO USAR en producción hasta firma C-394 deploy.
 */

const decryptClient = require('./decrypt_client');

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 min sin uso → evict

function createViewer({ uid, fetchFn, rootEl }) {
  if (!uid) throw new Error('[OWNER_CHAT_VIEWER] uid requerido');
  if (typeof fetchFn !== 'function') throw new Error('[OWNER_CHAT_VIEWER] fetchFn requerida');

  const api = {
    uid,
    _inactivityTimer: null,
    _boundBeforeUnload: null,
  };

  function _resetInactivityTimer() {
    if (api._inactivityTimer) clearTimeout(api._inactivityTimer);
    api._inactivityTimer = setTimeout(() => {
      decryptClient.evictKey();
      api._renderPassphrasePrompt('Sesión expirada por inactividad. Re-ingresá tu passphrase.');
    }, INACTIVITY_TIMEOUT_MS);
  }

  api._renderPassphrasePrompt = function renderPassphrasePrompt(hint) {
    if (!rootEl) return;
    rootEl.innerHTML = `
      <div class="fortaleza-unlock">
        <h3>🔐 Fortaleza — Mis conversaciones</h3>
        <p>${hint || 'Ingresá tu passphrase para ver tus chats. No la guardamos — vive solo en esta pestaña.'}</p>
        <input type="password" id="fortaleza-passphrase" autocomplete="off" spellcheck="false" />
        <button id="fortaleza-unlock-btn">Desbloquear</button>
        <p class="fortaleza-hint">Si olvidás la passphrase: recuperación disponible antes del sellado. Después del sellado, no hay recuperación.</p>
      </div>
    `;
    const btn = rootEl.querySelector('#fortaleza-unlock-btn');
    const input = rootEl.querySelector('#fortaleza-passphrase');
    if (btn && input) {
      btn.addEventListener('click', async () => {
        const passphrase = input.value;
        input.value = '';
        try {
          await api.unlock(passphrase);
          await api.renderChatList();
        } catch (err) {
          api._renderPassphrasePrompt(`Error: ${err.message}`);
        }
      });
    }
  };

  api.unlock = async function unlock(passphrase) {
    const saltRes = await fetchFn(`/api/privacy_vault/${uid}/salt`);
    if (!saltRes.ok) throw new Error(`No pude obtener salt (HTTP ${saltRes.status})`);
    const { salt } = await saltRes.json();
    await decryptClient.deriveKey({ uid, passphrase, saltB64: salt });
    _resetInactivityTimer();
    api._boundBeforeUnload = () => decryptClient.evictKey();
    if (typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('beforeunload', api._boundBeforeUnload);
    }
  };

  api.renderChatList = async function renderChatList(conversationIds = []) {
    if (!rootEl) return;
    _resetInactivityTimer();
    rootEl.innerHTML = `
      <div class="fortaleza-chat-list">
        <h3>🔓 Fortaleza — Conversaciones</h3>
        <button id="fortaleza-lock-btn">Bloquear</button>
        <ul id="fortaleza-conv-list"></ul>
        <div id="fortaleza-chat-view"></div>
      </div>
    `;
    const lockBtn = rootEl.querySelector('#fortaleza-lock-btn');
    if (lockBtn) {
      lockBtn.addEventListener('click', () => {
        api.lock();
      });
    }
    const ul = rootEl.querySelector('#fortaleza-conv-list');
    if (ul) {
      ul.innerHTML = conversationIds.map((cid) => (
        `<li><button data-cid="${cid}">${cid}</button></li>`
      )).join('');
      ul.addEventListener('click', async (ev) => {
        const target = ev.target;
        if (target && target.dataset && target.dataset.cid) {
          await api.openConversation(target.dataset.cid);
        }
      });
    }
  };

  api.openConversation = async function openConversation(conversationId) {
    _resetInactivityTimer();
    const url = `/api/privacy_vault/${uid}/ciphertext?conversation_id=${encodeURIComponent(conversationId)}`;
    const res = await fetchFn(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.json();
    const plaintext = await decryptClient.decryptChat(blob, uid);
    const viewer = rootEl?.querySelector('#fortaleza-chat-view');
    if (viewer) {
      viewer.textContent = plaintext;
    }
    return plaintext;
  };

  api.lock = function lock() {
    decryptClient.evictKey();
    if (api._inactivityTimer) clearTimeout(api._inactivityTimer);
    if (api._boundBeforeUnload && typeof globalThis.removeEventListener === 'function') {
      globalThis.removeEventListener('beforeunload', api._boundBeforeUnload);
    }
    api._renderPassphrasePrompt('Bloqueada. Re-ingresá tu passphrase para continuar.');
  };

  // Arranque: mostrar prompt
  api._renderPassphrasePrompt();

  return api;
}

module.exports = {
  createViewer,
  INACTIVITY_TIMEOUT_MS,
};
