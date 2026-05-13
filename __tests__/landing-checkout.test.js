/**
 * Tests landing-checkout.js — handler botones landings /ludomiia + /miiaf1.
 * 100% branches.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const landing = require('../assets/landing-checkout.js');

function makeDoc(opts) {
  const o = opts || {};
  const listeners = new Map();
  function makeBtn(id) {
    const handlers = [];
    const btn = {
      id,
      disabled: false,
      dataset: {},
      addEventListener: (ev, fn) => handlers.push(fn),
      removeEventListener: (ev, fn) => {
        const i = handlers.indexOf(fn);
        if (i >= 0) handlers.splice(i, 1);
      },
      _click: async (event) => {
        for (const h of handlers) await h(event || {});
      },
      _hasListeners: () => handlers.length > 0,
    };
    listeners.set(id, btn);
    return btn;
  }
  const btns = {
    '#btn-checkout': o.noCheckout ? null : makeBtn('btn-checkout'),
    '#btn-google': o.noGoogle ? null : makeBtn('btn-google'),
  };
  return {
    querySelector: (sel) => btns[sel] || null,
    _btns: btns,
  };
}

function makeWin(opts) {
  const o = opts || {};
  return {
    location: { href: o.href || '', origin: o.origin || 'https://miia-app.com' },
    navigator: { language: o.language || 'es-AR' },
    alert: vi.fn(),
  };
}

describe('setupLanding — input validation', () => {
  test('throws si product invalido', () => {
    const doc = makeDoc();
    expect(() => landing.setupLanding({ product: 'invalid', doc })).toThrow(/product/);
  });

  test('throws si product falta', () => {
    const doc = makeDoc();
    expect(() => landing.setupLanding({ doc })).toThrow(/product/);
  });

  test('throws si opts undefined (sin args)', () => {
    // happy-dom tiene document global, así que pasa el guard de doc
    // y falla en el guard de product faltante.
    expect(() => landing.setupLanding()).toThrow(/product/);
  });

  test('throws si document not available (forzando opcion doc=null + no global)', () => {
    // happy-dom siempre tiene document global. Para forzar el guard, salvamos
    // la global temporalmente y la borramos.
    const origDoc = globalThis.document;
    delete globalThis.document;
    try {
      expect(() => landing.setupLanding({ product: 'ludomiia', doc: null })).toThrow(/document/);
    } finally {
      globalThis.document = origDoc;
    }
  });

  test('product=ludomiia OK', () => {
    const doc = makeDoc();
    const win = makeWin();
    const h = landing.setupLanding({ product: 'ludomiia', doc, win });
    expect(typeof h.teardown).toBe('function');
  });

  test('product=miiaf1 OK', () => {
    const doc = makeDoc();
    const win = makeWin();
    const h = landing.setupLanding({ product: 'miiaf1', doc, win });
    expect(typeof h.teardown).toBe('function');
  });
});

describe('setupLanding — handleCheckout', () => {
  test('happy path: POST + redirect a checkoutUrl', async () => {
    const doc = makeDoc();
    const win = makeWin();
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ checkoutUrl: 'https://mp.test/checkout/xyz' }),
    });
    landing.setupLanding({
      product: 'ludomiia',
      checkoutEndpoint: '/api/ludomiia/checkout',
      doc,
      win,
      fetchFn,
    });
    await doc._btns['#btn-checkout']._click({ preventDefault: () => {} });
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/ludomiia/checkout',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(fetchFn.mock.calls[0][1].body);
    expect(body.country).toBe('AR'); // language es-AR → AR
    expect(body.product).toBe('ludomiia');
    expect(body.source).toBe('landing');
    expect(win.location.href).toBe('https://mp.test/checkout/xyz');
  });

  test('event sin preventDefault no rompe', async () => {
    const doc = makeDoc();
    const win = makeWin();
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ checkoutUrl: 'https://mp/x' }),
    });
    landing.setupLanding({
      product: 'ludomiia',
      checkoutEndpoint: '/x',
      doc,
      win,
      fetchFn,
    });
    await doc._btns['#btn-checkout']._click(undefined);
    expect(fetchFn).toHaveBeenCalled();
  });

  test('checkoutEndpoint vacio → alert + no fetch', async () => {
    const doc = makeDoc();
    const win = makeWin();
    const alertFn = vi.fn();
    const fetchFn = vi.fn();
    landing.setupLanding({
      product: 'ludomiia',
      checkoutEndpoint: '',
      doc,
      win,
      fetchFn,
      alertFn,
    });
    await doc._btns['#btn-checkout']._click({ preventDefault: () => {} });
    expect(alertFn).toHaveBeenCalledWith(expect.stringMatching(/Checkout no configurado/));
    expect(fetchFn).not.toHaveBeenCalled();
  });

  test('fallback init_point si checkoutUrl falta en response', async () => {
    const doc = makeDoc();
    const win = makeWin();
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ init_point: 'https://paypal/pay' }),
    });
    landing.setupLanding({
      product: 'miiaf1',
      checkoutEndpoint: '/api/f1/billing/checkout',
      doc,
      win,
      fetchFn,
    });
    await doc._btns['#btn-checkout']._click({ preventDefault: () => {} });
    expect(win.location.href).toBe('https://paypal/pay');
  });

  test('checkoutUrl ni init_point → alert + reset button', async () => {
    const doc = makeDoc();
    const win = makeWin();
    const alertFn = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ random: 'response' }),
    });
    landing.setupLanding({
      product: 'ludomiia',
      checkoutEndpoint: '/x',
      doc,
      win,
      fetchFn,
      alertFn,
    });
    await doc._btns['#btn-checkout']._click({ preventDefault: () => {} });
    expect(alertFn).toHaveBeenCalledWith(expect.stringMatching(/checkout_url missing/));
    expect(doc._btns['#btn-checkout'].disabled).toBe(false);
  });

  test('response !ok con error message → alert + reset', async () => {
    const doc = makeDoc();
    const win = makeWin();
    const alertFn = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'server_error' }),
    });
    landing.setupLanding({
      product: 'ludomiia',
      checkoutEndpoint: '/x',
      doc,
      win,
      fetchFn,
      alertFn,
    });
    await doc._btns['#btn-checkout']._click({ preventDefault: () => {} });
    expect(alertFn).toHaveBeenCalledWith(expect.stringMatching(/server_error/));
  });

  test('response !ok sin body.error → fallback HTTP <status>', async () => {
    const doc = makeDoc();
    const win = makeWin();
    const alertFn = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => null,
    });
    landing.setupLanding({
      product: 'ludomiia',
      checkoutEndpoint: '/x',
      doc,
      win,
      fetchFn,
      alertFn,
    });
    await doc._btns['#btn-checkout']._click({ preventDefault: () => {} });
    expect(alertFn).toHaveBeenCalledWith(expect.stringMatching(/HTTP 503/));
  });

  test('fetch throws → alert generico + reset', async () => {
    const doc = makeDoc();
    const win = makeWin();
    const alertFn = vi.fn();
    const fetchFn = vi.fn().mockRejectedValue(new Error('network fail'));
    landing.setupLanding({
      product: 'ludomiia',
      checkoutEndpoint: '/x',
      doc,
      win,
      fetchFn,
      alertFn,
    });
    await doc._btns['#btn-checkout']._click({ preventDefault: () => {} });
    expect(alertFn).toHaveBeenCalledWith(expect.stringMatching(/network fail/));
  });

  test('fetch throws sin message → fallback "error"', async () => {
    const doc = makeDoc();
    const win = makeWin();
    const alertFn = vi.fn();
    const fetchFn = vi.fn().mockRejectedValue({});
    landing.setupLanding({
      product: 'ludomiia',
      checkoutEndpoint: '/x',
      doc,
      win,
      fetchFn,
      alertFn,
    });
    await doc._btns['#btn-checkout']._click({ preventDefault: () => {} });
    expect(alertFn).toHaveBeenCalledWith(expect.stringMatching(/error/));
  });

  test('resp.json() throws → fallback null body', async () => {
    const doc = makeDoc();
    const win = makeWin();
    const alertFn = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => { throw new Error('json parse fail'); },
    });
    landing.setupLanding({
      product: 'ludomiia',
      checkoutEndpoint: '/x',
      doc,
      win,
      fetchFn,
      alertFn,
    });
    await doc._btns['#btn-checkout']._click({ preventDefault: () => {} });
    expect(alertFn).toHaveBeenCalledWith(expect.stringMatching(/HTTP 502/));
  });
});

describe('setupLanding — handleGoogle', () => {
  test('happy path: redirect a Google OAuth con state', () => {
    const doc = makeDoc();
    const win = makeWin();
    landing.setupLanding({
      product: 'ludomiia',
      googleClientId: 'CLIENT-123',
      dashboardUrl: '/owner-dashboard.html?addon=ludomiia',
      doc,
      win,
    });
    doc._btns['#btn-google']._click({ preventDefault: () => {} });
    expect(win.location.href).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(win.location.href).toContain('client_id=CLIENT-123');
    expect(win.location.href).toContain('redirect_uri=%2Fowner-dashboard');
    expect(win.location.href).toContain('state=');
    expect(win.location.href).toContain('scope=openid+email+profile');
  });

  test('sin googleClientId → alert + no redirect', () => {
    const doc = makeDoc();
    const win = makeWin();
    const alertFn = vi.fn();
    const initialHref = win.location.href;
    landing.setupLanding({
      product: 'ludomiia',
      googleClientId: '',
      doc,
      win,
      alertFn,
    });
    doc._btns['#btn-google']._click({ preventDefault: () => {} });
    expect(alertFn).toHaveBeenCalledWith(expect.stringMatching(/Google login no configurado/));
    expect(win.location.href).toBe(initialHref);
  });

  test('sin dashboardUrl → fallback origin + /owner-dashboard.html', () => {
    const doc = makeDoc();
    const win = makeWin({ origin: 'https://app.miia-app.com' });
    landing.setupLanding({
      product: 'miiaf1',
      googleClientId: 'C',
      doc,
      win,
    });
    doc._btns['#btn-google']._click({ preventDefault: () => {} });
    expect(win.location.href).toContain('redirect_uri=https%3A%2F%2Fapp.miia-app.com%2Fowner-dashboard.html');
  });

  test('event sin preventDefault no rompe', () => {
    const doc = makeDoc();
    const win = makeWin();
    landing.setupLanding({
      product: 'ludomiia',
      googleClientId: 'C',
      doc,
      win,
    });
    doc._btns['#btn-google']._click(undefined);
    expect(win.location.href).toContain('accounts.google.com');
  });

  test('state contiene product:landing:timestamp', () => {
    const doc = makeDoc();
    const win = makeWin();
    landing.setupLanding({
      product: 'miiaf1',
      googleClientId: 'C',
      doc,
      win,
    });
    doc._btns['#btn-google']._click({ preventDefault: () => {} });
    const decoded = decodeURIComponent(win.location.href.split('state=')[1].split('&')[0]);
    expect(decoded).toMatch(/^miiaf1:landing:\d+$/);
  });
});

describe('setupLanding — teardown', () => {
  test('teardown remueve event listeners', async () => {
    const doc = makeDoc();
    const win = makeWin();
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ checkoutUrl: 'https://x' }),
    });
    const handle = landing.setupLanding({
      product: 'ludomiia',
      checkoutEndpoint: '/x',
      doc,
      win,
      fetchFn,
    });
    expect(doc._btns['#btn-checkout']._hasListeners()).toBe(true);
    handle.teardown();
    expect(doc._btns['#btn-checkout']._hasListeners()).toBe(false);
    expect(doc._btns['#btn-google']._hasListeners()).toBe(false);
  });

  test('teardown sin botones presentes no rompe', () => {
    const doc = makeDoc({ noCheckout: true, noGoogle: true });
    const win = makeWin();
    const handle = landing.setupLanding({
      product: 'ludomiia',
      doc,
      win,
    });
    expect(() => handle.teardown()).not.toThrow();
  });
});

describe('_detectCountry', () => {
  test('language es-AR → AR', () => {
    expect(landing._detectCountry({ navigator: { language: 'es-AR' } })).toBe('AR');
  });

  test('language en-US → US', () => {
    expect(landing._detectCountry({ navigator: { language: 'en-US' } })).toBe('US');
  });

  test('language uppercase 2-letter', () => {
    expect(landing._detectCountry({ navigator: { language: 'pt-br' } })).toBe('BR');
  });

  test('language sin dash → US default', () => {
    expect(landing._detectCountry({ navigator: { language: 'es' } })).toBe('US');
  });

  test('language sin country code valido (length != 2) → US', () => {
    expect(landing._detectCountry({ navigator: { language: 'es-MEX' } })).toBe('US');
  });

  test('navigator ausente → US default', () => {
    expect(landing._detectCountry({})).toBe('US');
  });

  test('navigator throw → US fallback', () => {
    const win = {
      get navigator() {
        throw new Error('blocked');
      },
    };
    expect(landing._detectCountry(win)).toBe('US');
  });
});

describe('_safeJson', () => {
  test('json ok → data', async () => {
    const result = await landing._safeJson({ json: async () => ({ x: 1 }) });
    expect(result).toEqual({ x: 1 });
  });

  test('json throws → null', async () => {
    const result = await landing._safeJson({
      json: async () => { throw new Error('bad'); },
    });
    expect(result).toBeNull();
  });
});
