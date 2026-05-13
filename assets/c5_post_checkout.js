// C.5 Post-checkout dashboard refresh (firma Mariano 2026-05-02)
// Detecta return URL ?status=success&product=X (PayPal/MercadoPago redirect)
// Re-fetcha permisos + muestra toast confirmacion

(function(global) {
  'use strict';

  function createPostCheckoutHandler(opts) {
    /* v8 ignore next 1 */
    var o = opts || {};
    /* v8 ignore next 1 */
    var fetchProductPermissions = o.fetchProductPermissions || function() { return Promise.resolve(null); };
    /* v8 ignore next 1 */
    var applyMenus = o.applyProductMenusVisibility || function() {};
    /* v8 ignore next 1 */
    var renderOtros = o.renderOtrosProductos || function() {};
    /* v8 ignore next 1 */
    var doc = o.document || (typeof document !== 'undefined' ? document : null);
    /* v8 ignore next 1 */
    var win = o.window || (typeof window !== 'undefined' ? window : null);
    /* v8 ignore next 1 */
    var maxAttempts = o.maxAttempts != null ? o.maxAttempts : 6;
    /* v8 ignore next 1 */
    var pollMs = o.pollMs != null ? o.pollMs : 1500;
    /* v8 ignore next 1 */
    var sleep = o.sleep || function(ms) { return new Promise(function(r){ setTimeout(r, ms); }); };

    var PRODUCT_LABELS = { miia: 'MIIA', miiadt: 'MIIADT', ludomiia: 'LudoMIIA', f1: 'MiiaF1' };

    function getStatusFromUrl() {
      if (!win || !win.location) return { status: null, product: null };
      try {
        var url = win.location.search || '';
        var qs = url.indexOf('?') === 0 ? url.slice(1) : url;
        var pairs = qs.split('&');
        var params = {};
        for (var i = 0; i < pairs.length; i++) {
          var p = pairs[i].split('=');
          if (p[0]) params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
        }
        return { status: params.status || null, product: params.product || null };
      } catch (e) {
        return { status: null, product: null };
      }
    }

    async function handle() {
      var parsed = getStatusFromUrl();
      if (parsed.status !== 'success') return { handled: false };
      var product = parsed.product || 'unknown';
      var active = false;
      for (var i = 0; i < maxAttempts; i++) {
        var perms = await fetchProductPermissions();
        if (perms && perms[product] && perms[product].active) { active = true; break; }
        if (i < maxAttempts - 1) await sleep(pollMs);
      }
      try { applyMenus(o.userData || {}); } catch (e) { /* swallow */ }
      try { renderOtros(); } catch (e) { /* swallow */ }
      if (doc && doc.body) showToast(doc, product);
      if (win && win.history && win.history.replaceState) {
        try { win.history.replaceState({}, doc ? doc.title : '', win.location.pathname); } catch (e) { /* swallow */ }
      }
      return { handled: true, product: product, active: active };
    }

    function showToast(d, product) {
      var label = PRODUCT_LABELS[product] || product;
      var toast = d.createElement('div');
      toast.className = 'c5-post-checkout-toast';
      toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;background:linear-gradient(135deg,#00E5FF,#7C3AED);color:#fff;padding:14px 22px;border-radius:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.3);';
      toast.textContent = '¡Listo! ' + label + ' activado en tu cuenta.';
      d.body.appendChild(toast);
    }

    return { handle: handle, getStatusFromUrl: getStatusFromUrl, showToast: showToast };
  }

  /* v8 ignore start */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = createPostCheckoutHandler;
  } else if (global) {
    global.createPostCheckoutHandler = createPostCheckoutHandler;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
/* v8 ignore stop */
