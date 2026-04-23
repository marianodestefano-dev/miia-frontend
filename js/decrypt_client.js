'use strict';

/**
 * FORTALEZA PRIVACY VAULT — DECRYPT CLIENT (C-392 B.2.b)
 *
 * Módulo ES que vive ÚNICAMENTE en la memoria JS de la pestaña. Deriva la
 * llave AES-256 con Argon2id WASM a partir de la passphrase del owner, y
 * desencripta los ciphertexts que entrega el backend.
 *
 * NUNCA persiste la llave derivada:
 *   - NO localStorage
 *   - NO sessionStorage
 *   - NO IndexedDB
 *   - NO cookies
 *
 * La llave vive en una variable de módulo interna (`_derivedKeyRaw`) y
 * desaparece al cerrar la pestaña o al invocar `evictKey()`.
 *
 * Dependencia runtime: `argon2-browser` (WASM). Se resuelve perezosamente.
 * Si falla al cargar → `deriveKey()` throwea con mensaje explícito.
 *
 * La desencripción usa WebCrypto (nativo del navegador).
 *
 * Referencia: C-392 SEC-B.2.b
 * NO USAR en producción hasta firma C-394 deploy.
 */

const ARGON2_PARAMS = Object.freeze({
  type: 2, // argon2id (magic number de argon2-browser)
  mem: 64 * 1024, // 64 MB
  time: 3,
  parallelism: 1,
  hashLen: 32, // AES-256
});

let _derivedKeyRaw = null; // Uint8Array(32) — llave AES raw
let _derivedKeyCrypto = null; // CryptoKey importada para WebCrypto
let _derivedForUid = null; // Guard: llave derivada para este UID
let _argon2Module = null;

/**
 * Carga el módulo argon2-browser WASM perezosamente.
 * En tests se puede inyectar un mock por `__setArgon2ModuleForTests`.
 */
async function _loadArgon2() {
  if (_argon2Module) return _argon2Module;
  try {
    // eslint-disable-next-line import/no-unresolved
    const mod = await import('argon2-browser');
    _argon2Module = mod.default || mod;
    return _argon2Module;
  } catch (err) {
    throw new Error(
      '[DECRYPT_CLIENT] argon2-browser no disponible. ' +
      'Agregar al bundle antes del deploy C-394: npm install argon2-browser. ' +
      `Causa: ${err.message}`
    );
  }
}

function _assertBrowserCrypto() {
  if (typeof globalThis === 'undefined' || !globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('[DECRYPT_CLIENT] WebCrypto no disponible (crypto.subtle). Requiere HTTPS + browser moderno.');
  }
}

function _base64ToBytes(b64) {
  if (typeof b64 !== 'string') throw new Error('[DECRYPT_CLIENT] base64 string requerido');
  const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function _bytesToUtf8(bytes) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(bytes);
  }
  return Buffer.from(bytes).toString('utf8');
}

/**
 * Deriva la llave a partir de la passphrase + salt. Idempotente por
 * (uid, passphrase, salt) — si se re-llama con los mismos args, mantiene
 * la misma llave en memoria. Si cambian, re-deriva y reemplaza.
 *
 * @param {object} p
 * @param {string} p.uid        - UID del owner (para guard)
 * @param {string} p.passphrase - Frase secreta del owner
 * @param {string} p.saltB64    - Salt base64 (recibido desde GET /salt)
 * @returns {Promise<void>} — al resolverse, la llave está cargada en memoria
 */
async function deriveKey({ uid, passphrase, saltB64 }) {
  if (!uid || typeof uid !== 'string') throw new Error('[DECRYPT_CLIENT] uid requerido');
  if (!passphrase || typeof passphrase !== 'string') throw new Error('[DECRYPT_CLIENT] passphrase requerido');
  if (!saltB64 || typeof saltB64 !== 'string') throw new Error('[DECRYPT_CLIENT] saltB64 requerido');

  _assertBrowserCrypto();
  const argon2 = await _loadArgon2();
  const salt = _base64ToBytes(saltB64);
  if (salt.length < 16) throw new Error('[DECRYPT_CLIENT] salt < 16 bytes');

  const result = await argon2.hash({
    pass: passphrase,
    salt,
    type: ARGON2_PARAMS.type,
    mem: ARGON2_PARAMS.mem,
    time: ARGON2_PARAMS.time,
    parallelism: ARGON2_PARAMS.parallelism,
    hashLen: ARGON2_PARAMS.hashLen,
  });

  const rawBytes = result?.hash;
  if (!(rawBytes instanceof Uint8Array) || rawBytes.length !== ARGON2_PARAMS.hashLen) {
    throw new Error('[DECRYPT_CLIENT] argon2 devolvió longitud inesperada');
  }

  // Limpieza previa
  if (_derivedKeyRaw) _derivedKeyRaw.fill(0);

  _derivedKeyRaw = rawBytes;
  _derivedForUid = uid;
  _derivedKeyCrypto = await globalThis.crypto.subtle.importKey(
    'raw',
    rawBytes,
    { name: 'AES-GCM' },
    false, // NO extractable — la llave no se puede volver a exportar
    ['decrypt']
  );
}

function hasKey(uid) {
  return _derivedKeyCrypto !== null && _derivedForUid === uid;
}

/**
 * Descifra un payload encriptado del formato:
 *   { ciphertext: base64, key_version, algorithm }
 *   ciphertext = iv(12 bytes) || ciphertext_gcm
 *
 * @param {object} encryptedBlob
 * @param {string} uid
 * @returns {Promise<string>} — plaintext UTF-8
 */
async function decryptChat(encryptedBlob, uid) {
  if (!hasKey(uid)) {
    throw new Error('[DECRYPT_CLIENT] llave no derivada para este UID — llamá deriveKey primero');
  }
  if (!encryptedBlob || typeof encryptedBlob !== 'object' || !encryptedBlob.ciphertext) {
    throw new Error('[DECRYPT_CLIENT] encryptedBlob inválido');
  }
  const all = _base64ToBytes(encryptedBlob.ciphertext);
  if (all.length < 13) {
    throw new Error('[DECRYPT_CLIENT] ciphertext demasiado corto para contener IV+GCM');
  }
  const iv = all.slice(0, 12);
  const ct = all.slice(12);
  const plaintextBuf = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    _derivedKeyCrypto,
    ct
  );
  return _bytesToUtf8(new Uint8Array(plaintextBuf));
}

/**
 * Borra la llave de memoria. Llamar al cerrar el viewer, cambiar de UID,
 * detectar `beforeunload` o timeout de inactividad.
 */
function evictKey() {
  if (_derivedKeyRaw) _derivedKeyRaw.fill(0);
  _derivedKeyRaw = null;
  _derivedKeyCrypto = null;
  _derivedForUid = null;
}

/**
 * Verifica que NO haya nada persistido en storage del navegador.
 * Se usa en tests y puede invocarse al arrancar la página como smoke.
 */
function assertNoPersistentStorage() {
  const offenders = [];
  const check = (storage, label) => {
    try {
      if (storage && typeof storage.length === 'number') {
        for (let i = 0; i < storage.length; i += 1) {
          const key = storage.key(i);
          if (key && /fortaleza|privacy_vault|derived_key/i.test(key)) {
            offenders.push(`${label}:${key}`);
          }
        }
      }
    } catch (_) { /* cross-origin */ }
  };
  check(globalThis.localStorage, 'localStorage');
  check(globalThis.sessionStorage, 'sessionStorage');
  if (offenders.length > 0) {
    throw new Error('[DECRYPT_CLIENT] material clave filtrado en storage: ' + offenders.join(','));
  }
  return { ok: true };
}

// API para tests — NO usar en runtime
function __setArgon2ModuleForTests(mod) {
  _argon2Module = mod;
}
function __getStateForTests() {
  return {
    hasRaw: _derivedKeyRaw !== null,
    hasCrypto: _derivedKeyCrypto !== null,
    forUid: _derivedForUid,
  };
}

module.exports = {
  ARGON2_PARAMS,
  deriveKey,
  decryptChat,
  evictKey,
  hasKey,
  assertNoPersistentStorage,
  __setArgon2ModuleForTests,
  __getStateForTests,
};
