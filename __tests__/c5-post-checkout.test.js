import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createPostCheckoutHandler = require('../assets/c5_post_checkout.js');

function makeWin(search) {
  const replaceState = vi.fn();
  return {
    location: { search, pathname: '/owner-dashboard.html' },
    history: { replaceState },
    _replaceState: replaceState,
  };
}

function makeDoc() {
  document.body.innerHTML = '';
  return document;
}

describe('c5_post_checkout', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  test('handle: no status param -> handled=false', async () => {
    const h = createPostCheckoutHandler({
      window: makeWin(''),
      document: makeDoc(),
      fetchProductPermissions: vi.fn(),
      sleep: () => Promise.resolve(),
    });
    const r = await h.handle();
    expect(r.handled).toBe(false);
  });

  test('handle: status=fail -> handled=false', async () => {
    const h = createPostCheckoutHandler({
      window: makeWin('?status=fail'),
      document: makeDoc(),
      fetchProductPermissions: vi.fn(),
      sleep: () => Promise.resolve(),
    });
    const r = await h.handle();
    expect(r.handled).toBe(false);
  });

  test('handle: status=success producto activo en primer try -> active=true, toast mostrado', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ miia: { active: true } });
    const win = makeWin('?status=success&product=miia');
    const doc = makeDoc();
    const h = createPostCheckoutHandler({
      window: win,
      document: doc,
      fetchProductPermissions: fetchFn,
      sleep: () => Promise.resolve(),
    });
    const r = await h.handle();
    expect(r.handled).toBe(true);
    expect(r.product).toBe('miia');
    expect(r.active).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(doc.querySelector('.c5-post-checkout-toast')).toBeTruthy();
    expect(win._replaceState).toHaveBeenCalled();
  });

  test('handle: producto inactivo en todos los attempts -> active=false', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ miiadt: { active: false } });
    const h = createPostCheckoutHandler({
      window: makeWin('?status=success&product=miiadt'),
      document: makeDoc(),
      fetchProductPermissions: fetchFn,
      sleep: () => Promise.resolve(),
      maxAttempts: 3,
    });
    const r = await h.handle();
    expect(r.handled).toBe(true);
    expect(r.active).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  test('handle: fetch retorna null en attempt 1, success en attempt 2', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ludomiia: { active: true } });
    const h = createPostCheckoutHandler({
      window: makeWin('?status=success&product=ludomiia'),
      document: makeDoc(),
      fetchProductPermissions: fetchFn,
      sleep: () => Promise.resolve(),
      maxAttempts: 4,
    });
    const r = await h.handle();
    expect(r.handled).toBe(true);
    expect(r.active).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  test('handle: applyMenus throws -> swallowed, sigue funcionando', async () => {
    const errMenus = vi.fn(() => { throw new Error('menu-broken'); });
    const errOtros = vi.fn(() => { throw new Error('otros-broken'); });
    const h = createPostCheckoutHandler({
      window: makeWin('?status=success&product=f1'),
      document: makeDoc(),
      fetchProductPermissions: vi.fn().mockResolvedValue({ f1: { active: true } }),
      applyProductMenusVisibility: errMenus,
      renderOtrosProductos: errOtros,
      sleep: () => Promise.resolve(),
    });
    const r = await h.handle();
    expect(r.handled).toBe(true);
    expect(errMenus).toHaveBeenCalled();
    expect(errOtros).toHaveBeenCalled();
  });

  test('handle: product no en labels -> usa product key como label', async () => {
    const h = createPostCheckoutHandler({
      window: makeWin('?status=success&product=unknownprod'),
      document: makeDoc(),
      fetchProductPermissions: vi.fn().mockResolvedValue({ unknownprod: { active: true } }),
      sleep: () => Promise.resolve(),
    });
    const r = await h.handle();
    expect(r.handled).toBe(true);
    const toast = document.querySelector('.c5-post-checkout-toast');
    expect(toast.textContent).toContain('unknownprod');
  });

  test('handle: status=success sin product -> product="unknown"', async () => {
    const h = createPostCheckoutHandler({
      window: makeWin('?status=success'),
      document: makeDoc(),
      fetchProductPermissions: vi.fn().mockResolvedValue({}),
      sleep: () => Promise.resolve(),
      maxAttempts: 1,
    });
    const r = await h.handle();
    expect(r.handled).toBe(true);
    expect(r.product).toBe('unknown');
  });

  test('getStatusFromUrl: sin window/location -> {status:null}', () => {
    const h = createPostCheckoutHandler({ window: null, document: makeDoc() });
    expect(h.getStatusFromUrl()).toEqual({ status: null, product: null });
  });

  test('getStatusFromUrl: win definido pero sin location -> {status:null}', () => {
    const h = createPostCheckoutHandler({ window: {}, document: makeDoc() });
    expect(h.getStatusFromUrl()).toEqual({ status: null, product: null });
  });

  test('getStatusFromUrl: search vacio -> {status:null}', () => {
    const h = createPostCheckoutHandler({ window: makeWin(''), document: makeDoc() });
    expect(h.getStatusFromUrl()).toEqual({ status: null, product: null });
  });

  test('getStatusFromUrl: status sin product -> product:null', () => {
    const h = createPostCheckoutHandler({ window: makeWin('?status=success'), document: makeDoc() });
    expect(h.getStatusFromUrl()).toEqual({ status: 'success', product: null });
  });

  test('handle: history.replaceState throws -> swallowed', async () => {
    const win = makeWin('?status=success&product=miia');
    win.history.replaceState = vi.fn(() => { throw new Error('history-broken'); });
    const h = createPostCheckoutHandler({
      window: win,
      document: makeDoc(),
      fetchProductPermissions: vi.fn().mockResolvedValue({ miia: { active: true } }),
      sleep: () => Promise.resolve(),
    });
    const r = await h.handle();
    expect(r.handled).toBe(true);
  });

  test('handle: doc null -> no toast, no error', async () => {
    const h = createPostCheckoutHandler({
      window: makeWin('?status=success&product=miia'),
      document: null,
      fetchProductPermissions: vi.fn().mockResolvedValue({ miia: { active: true } }),
      sleep: () => Promise.resolve(),
    });
    const r = await h.handle();
    expect(r.handled).toBe(true);
  });

  test('handle: win sin history -> no replaceState, sin error', async () => {
    const h = createPostCheckoutHandler({
      window: { location: { search: '?status=success&product=miia', pathname: '/x' } },
      document: makeDoc(),
      fetchProductPermissions: vi.fn().mockResolvedValue({ miia: { active: true } }),
      sleep: () => Promise.resolve(),
    });
    const r = await h.handle();
    expect(r.handled).toBe(true);
  });

  test('getStatusFromUrl: win.location.search undefined -> usa fallback empty', () => {
    const h = createPostCheckoutHandler({ window: { location: { pathname: '/x' } }, document: makeDoc() });
    expect(h.getStatusFromUrl()).toEqual({ status: null, product: null });
  });

  test('getStatusFromUrl: search sin "?" prefix -> parsea igual', () => {
    const h = createPostCheckoutHandler({ window: { location: { search: 'status=success&product=miia', pathname: '/x' } }, document: makeDoc() });
    expect(h.getStatusFromUrl()).toEqual({ status: 'success', product: 'miia' });
  });

  test('getStatusFromUrl: param sin = (key solo) -> ignorado', () => {
    const h = createPostCheckoutHandler({ window: makeWin('?solo&status=success'), document: makeDoc() });
    const r = h.getStatusFromUrl();
    expect(r.status).toBe('success');
  });

  test('handle: doc sin body -> no toast', async () => {
    const fakeDoc = { createElement: vi.fn(), body: null, title: 't' };
    const h = createPostCheckoutHandler({
      window: makeWin('?status=success&product=miia'),
      document: fakeDoc,
      fetchProductPermissions: vi.fn().mockResolvedValue({ miia: { active: true } }),
      sleep: () => Promise.resolve(),
    });
    const r = await h.handle();
    expect(r.handled).toBe(true);
    expect(fakeDoc.createElement).not.toHaveBeenCalled();
  });

  test('getStatusFromUrl: malformed query throws -> catches y retorna null', () => {
    // Forzar throw mockeando decodeURIComponent
    const orig = global.decodeURIComponent;
    global.decodeURIComponent = () => { throw new Error('bad'); };
    const h = createPostCheckoutHandler({ window: makeWin('?status=success&product=miia'), document: makeDoc() });
    expect(h.getStatusFromUrl()).toEqual({ status: null, product: null });
    global.decodeURIComponent = orig;
  });
});
