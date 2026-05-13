/**
 * landing-checkout.js — JS handler compartido para landings públicas
 * /ludomiia + /miiaf1.
 *
 * Firma Mariano 2026-05-02 ~16:00 COT (project_signup_flow_definitivo):
 *   "B - Modelo B + Google Login (los 2 botones en cada landing). con Mi
 *    recomendacion firme - combinacion de B + C"
 *
 * Asignacion: "TEC: landings /ludomiia + /miiaf1" (firma viva)
 * Autorizado Wi 2026-05-12 ~21:35 COT: "Landing /ludomiia (item 3 firmado,
 * autorizado a ejecutar). 2 botones + V2 design + checkout MP/PayPal +
 * redirect dashboard."
 *
 * 2 botones por landing:
 *   1. Contratar <Producto> — $3 USD/mes  → checkout MP/PayPal
 *   2. Continuar con Google                → OAuth Google Sign-In
 *
 * Modulo puro export factory para tests. Caller llama setupLanding(opts)
 * y handlers se conectan a los botones #btn-checkout y #btn-google.
 */

'use strict';

/**
 * Inicializa los handlers de una landing.
 *
 * @param {Object} opts
 *   - product: 'ludomiia' | 'miiaf1'
 *   - checkoutEndpoint: string — URL absoluta o relativa del POST /checkout
 *   - googleClientId: string — Google OAuth Client ID
 *   - dashboardUrl: string — URL post-checkout success
 *   - doc?: Document — inyectable para tests (default: window.document)
 *   - win?: Window — inyectable (default: window)
 *   - fetchFn?: Function — inyectable
 *   - alertFn?: Function — inyectable (default: window.alert)
 * @returns {{ teardown: Function }}
 */
function setupLanding(opts) {
  const o = opts || {};
  if (!o.product || (o.product !== 'ludomiia' && o.product !== 'miiaf1')) {
    throw new Error('product must be "ludomiia" or "miiaf1"');
  }
  /* v8 ignore start — runtime browser defaults; tests inject opts explícitamente */
  const doc = o.doc || (typeof document !== 'undefined' ? document : null);
  const win = o.win || (typeof window !== 'undefined' ? window : null);
  const fetchFn = o.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
  const alertFn = o.alertFn || ((m) => (win && win.alert ? win.alert(m) : null));
  /* v8 ignore stop */

  if (!doc) throw new Error('document not available');

  const btnCheckout = doc.querySelector('#btn-checkout');
  const btnGoogle = doc.querySelector('#btn-google');

  async function handleCheckout(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    if (!o.checkoutEndpoint) {
      alertFn('Checkout no configurado. Contactá soporte.');
      return;
    }
    try {
      btnCheckout.disabled = true;
      btnCheckout.dataset.loading = '1';
      const country = _detectCountry(win);
      const resp = await fetchFn(o.checkoutEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, product: o.product, source: 'landing' }),
      });
      if (!resp.ok) {
        const body = await _safeJson(resp);
        throw new Error((body && body.error) || ('HTTP ' + resp.status));
      }
      const data = await _safeJson(resp);
      const url = data && (data.checkoutUrl || data.init_point);
      if (!url) throw new Error('checkout_url missing in response');
      win.location.href = url;
    } catch (err) {
      alertFn('No se pudo iniciar el checkout: ' + (err && err.message ? err.message : 'error'));
      btnCheckout.disabled = false;
      delete btnCheckout.dataset.loading;
    }
  }

  function handleGoogle(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    if (!o.googleClientId) {
      alertFn('Google login no configurado. Contactá soporte.');
      return;
    }
    const redirectUri = o.dashboardUrl || (win.location.origin + '/owner-dashboard.html');
    // URLSearchParams encodea automaticamente, no double-encode.
    const state = o.product + ':landing:' + Date.now();
    const params = new URLSearchParams({
      client_id: o.googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    win.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
  }

  if (btnCheckout) btnCheckout.addEventListener('click', handleCheckout);
  if (btnGoogle) btnGoogle.addEventListener('click', handleGoogle);

  return {
    teardown() {
      if (btnCheckout) btnCheckout.removeEventListener('click', handleCheckout);
      if (btnGoogle) btnGoogle.removeEventListener('click', handleGoogle);
    },
    _handleCheckout: handleCheckout,
    _handleGoogle: handleGoogle,
  };
}

/**
 * Detecta país del cliente desde Intl/navigator. Default 'US'.
 *
 * @param {Window} win
 * @returns {string} ISO 2-letter
 */
function _detectCountry(win) {
  /* c8 ignore next — defensive */
  if (!win) return 'US';
  try {
    const loc = (win.navigator && win.navigator.language) || 'en-US';
    const parts = loc.split('-');
    if (parts.length >= 2 && parts[1].length === 2) return parts[1].toUpperCase();
  } catch (_e) {
    /* fallthrough */
  }
  return 'US';
}

async function _safeJson(resp) {
  try {
    return await resp.json();
  } catch (_e) {
    return null;
  }
}

/* v8 ignore start — module/window export bootstrap (no testable inline) */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupLanding, _detectCountry, _safeJson };
}
if (typeof window !== 'undefined') {
  window.MIIA_landing = { setupLanding, _detectCountry, _safeJson };
}
/* v8 ignore stop */
