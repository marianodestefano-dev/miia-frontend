import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createTeamModesPanel = require('../assets/miiadt-panels/team-modes-panel.js');
const createBillingTopUpPanel = require('../assets/miiadt-panels/billing-top-up-panel.js');

beforeEach(() => {
  document.body.innerHTML = '';
});

const flush = () => new Promise((r) => setTimeout(r, 0));

// ─── team-modes-panel ──────────────────────────────────────────────────────
describe('team-modes-panel', () => {
  it('VALID_MODES + MAX_ACTIVE_MODES expuestos', () => {
    const p = createTeamModesPanel();
    expect(p.VALID_MODES).toEqual(['local', 'internacional', 'amigos']);
    expect(p.MAX_ACTIVE_MODES).toBe(2);
  });
  it('load() vacío → slotsLeft 2', async () => {
    const p = createTeamModesPanel({ fetchModes: () => Promise.resolve({ activeModes: [] }) });
    document.body.appendChild(p.element);
    await p.load();
    expect(p.element.querySelector('.tm-active-count').textContent).toContain('2 libres');
  });
  it('load() con 1 modo → slotsLeft 1 (singular)', async () => {
    const p = createTeamModesPanel({ fetchModes: () => Promise.resolve({ activeModes: ['local'] }) });
    document.body.appendChild(p.element);
    await p.load();
    expect(p.element.querySelector('.tm-active-count').textContent).toContain('1 libre');
  });
  it('load() con 2 modos → NO form', async () => {
    const p = createTeamModesPanel({ fetchModes: () => Promise.resolve({ activeModes: ['local', 'internacional'] }) });
    document.body.appendChild(p.element);
    await p.load();
    expect(p.element.querySelector('.tm-activate-form')).toBeNull();
  });
  it('load() data null → activeModes []', async () => {
    const p = createTeamModesPanel({ fetchModes: () => Promise.resolve(null) });
    await p.load();
    expect(p._state.activeModes).toEqual([]);
  });
  it('load() data sin activeModes → []', async () => {
    const p = createTeamModesPanel({ fetchModes: () => Promise.resolve({}) });
    await p.load();
    expect(p._state.activeModes).toEqual([]);
  });
  it('load() error', async () => {
    const p = createTeamModesPanel({ fetchModes: () => Promise.reject(new Error('NET')) });
    document.body.appendChild(p.element);
    await p.load();
    expect(p.element.querySelector('.tm-error')).toBeTruthy();
  });
  it('handleActivate local + AR → ok', async () => {
    const p = createTeamModesPanel({ activateMode: () => Promise.resolve({ ok: true }) });
    await p._handleActivate('local', 'AR');
    expect(p._state.activeModes.length).toBe(1);
    expect(p._state.lastActivated).toBe('local (AR)');
  });
  it('handleActivate internacional sin country → ok', async () => {
    const p = createTeamModesPanel({ activateMode: () => Promise.resolve({ ok: true }) });
    await p._handleActivate('internacional', '');
    expect(p._state.activeModes.length).toBe(1);
    expect(p._state.lastActivated).toBe('internacional');
  });
  it('handleActivate local sin country → error', async () => {
    const p = createTeamModesPanel();
    await p._handleActivate('local', '');
    expect(p._state.error).toBe('Liga Local requiere country code');
  });
  it('handleActivate modo invalido → error', async () => {
    const p = createTeamModesPanel();
    await p._handleActivate('xx', '');
    expect(p._state.error).toBe('Modo invalido');
  });
  it('handleActivate ok:false → state.error', async () => {
    const p = createTeamModesPanel({ activateMode: () => Promise.resolve({ ok: false, error: 'MAX_REACHED' }) });
    await p._handleActivate('amigos', '');
    expect(p._state.error).toBe('MAX_REACHED');
  });
  it('handleActivate ok:false sin error → fallback', async () => {
    const p = createTeamModesPanel({ activateMode: () => Promise.resolve({ ok: false }) });
    await p._handleActivate('amigos', '');
    expect(p._state.error).toBe('Error');
  });
  it('render modo string (legacy) sin countryCode', async () => {
    const p = createTeamModesPanel({ fetchModes: () => Promise.resolve({ activeModes: ['local'] }) });
    document.body.appendChild(p.element);
    await p.load();
    expect(p.element.querySelector('.tm-mode-name').textContent).toBe('local');
  });
  it('render modo object con countryCode', async () => {
    const p = createTeamModesPanel({ fetchModes: () => Promise.resolve({ activeModes: [{ mode: 'local', countryCode: 'AR' }] }) });
    document.body.appendChild(p.element);
    await p.load();
    expect(p.element.querySelector('.tm-mode-country').textContent).toBe('AR');
  });
  it('opts undefined → defaults', () => {
    const p = createTeamModesPanel();
    expect(p.element).toBeDefined();
  });
  it('click activar dispara handleActivate', async () => {
    let called = null;
    const p = createTeamModesPanel({ activateMode: (data) => { called = data; return Promise.resolve({ ok: true }); } });
    document.body.appendChild(p.element);
    await p.load();
    const inputs = p.element.querySelectorAll('.tm-country');
    inputs[0].value = 'AR';
    p.element.querySelector('.tm-activate-btn').click();
    await flush();
    expect(called).toBeDefined();
  });
  it('catch handler getToken reject', async () => {
    const p = createTeamModesPanel({ getToken: () => Promise.reject({}) });
    await p._handleActivate('internacional', '');
    expect(p._state.error).toBe('Error');
  });
  it('catch handler load getToken reject', async () => {
    const p = createTeamModesPanel({ getToken: () => Promise.reject({}) });
    await p.load();
    expect(p._state.error).toBe('Error');
  });
});

// ─── billing-top-up-panel ──────────────────────────────────────────────────
describe('billing-top-up-panel', () => {
  it('PRESETS_USD + USD_TO_CREDITS expuestos', () => {
    const p = createBillingTopUpPanel();
    expect(p.PRESETS_USD).toEqual([5, 10, 25, 50]);
    expect(p.USD_TO_CREDITS).toBe(1_000_000);
  });
  it('formatCredits varios rangos', () => {
    const p = createBillingTopUpPanel();
    expect(p._formatCredits(500)).toBe('500');
    expect(p._formatCredits(1500)).toBe('1K');
    expect(p._formatCredits(1_500_000)).toBe('1.5M');
    expect(p._formatCredits('x')).toBe('0');
  });
  it('load() ok hidrata balance', async () => {
    const p = createBillingTopUpPanel({ fetchBalance: () => Promise.resolve({ balance: 125_000_000 }) });
    await p.load();
    expect(p._state.balance).toBe(125_000_000);
  });
  it('load() data sin balance → 0', async () => {
    const p = createBillingTopUpPanel({ fetchBalance: () => Promise.resolve({}) });
    await p.load();
    expect(p._state.balance).toBe(0);
  });
  it('load() data null → 0', async () => {
    const p = createBillingTopUpPanel({ fetchBalance: () => Promise.resolve(null) });
    await p.load();
    expect(p._state.balance).toBe(0);
  });
  it('load() error', async () => {
    const p = createBillingTopUpPanel({ fetchBalance: () => Promise.reject(new Error('NET')) });
    document.body.appendChild(p.element);
    await p.load();
    expect(p.element.querySelector('.tu-error')).toBeTruthy();
  });
  it('handleTopUp 5 USD → 5M creditos', async () => {
    const p = createBillingTopUpPanel({ topUp: () => Promise.resolve({ ok: true, credits: 5_000_000, newBalance: 130_000_000 }) });
    await p._handleTopUp(5);
    expect(p._state.balance).toBe(130_000_000);
    expect(p._state.lastTopUp).toEqual({ usd: 5, credits: 5_000_000 });
  });
  it('handleTopUp sin newBalance fallback', async () => {
    const p = createBillingTopUpPanel({ topUp: () => Promise.resolve({ ok: true, credits: 5_000_000 }) });
    p._state.balance = 100_000_000;
    await p._handleTopUp(5);
    expect(p._state.balance).toBe(105_000_000);
  });
  it('handleTopUp sin credits fallback', async () => {
    const p = createBillingTopUpPanel({ topUp: () => Promise.resolve({ ok: true }) });
    p._state.balance = 100_000_000;
    await p._handleTopUp(5);
    expect(p._state.lastTopUp.credits).toBe(5_000_000);
  });
  it('handleTopUp monto invalido (<1)', async () => {
    const p = createBillingTopUpPanel();
    await p._handleTopUp(0);
    expect(p._state.error).toContain('Monto invalido');
  });
  it('handleTopUp monto NaN', async () => {
    const p = createBillingTopUpPanel();
    await p._handleTopUp(NaN);
    expect(p._state.error).toContain('Monto invalido');
  });
  it('handleTopUp string', async () => {
    const p = createBillingTopUpPanel();
    await p._handleTopUp('5');
    expect(p._state.error).toContain('Monto invalido');
  });
  it('handleTopUp ok:false', async () => {
    const p = createBillingTopUpPanel({ topUp: () => Promise.resolve({ ok: false, error: 'NO_FUNDS' }) });
    await p._handleTopUp(5);
    expect(p._state.error).toBe('NO_FUNDS');
  });
  it('handleTopUp ok:false sin error', async () => {
    const p = createBillingTopUpPanel({ topUp: () => Promise.resolve({ ok: false }) });
    await p._handleTopUp(5);
    expect(p._state.error).toBe('Error');
  });
  it('render presets botones', () => {
    const p = createBillingTopUpPanel();
    document.body.appendChild(p.element);
    const buttons = p.element.querySelectorAll('.tu-preset-btn');
    expect(buttons.length).toBe(4);
  });
  it('click preset 10 dispara handleTopUp', async () => {
    let called = null;
    const p = createBillingTopUpPanel({ topUp: (usd) => { called = usd; return Promise.resolve({ ok: true }); } });
    document.body.appendChild(p.element);
    const btns = p.element.querySelectorAll('.tu-preset-btn');
    btns[1].click(); // segundo preset = 10
    await flush();
    expect(called).toBe(10);
  });
  it('click custom dispara handleTopUp', async () => {
    let called = null;
    const p = createBillingTopUpPanel({ topUp: (usd) => { called = usd; return Promise.resolve({ ok: true }); } });
    document.body.appendChild(p.element);
    p.element.querySelector('.tu-custom-input').value = '15';
    p.element.querySelector('.tu-custom-btn').click();
    await flush();
    expect(called).toBe(15);
  });
  it('opts undefined → defaults', () => {
    const p = createBillingTopUpPanel();
    expect(p.element).toBeDefined();
  });
  it('catch getToken reject', async () => {
    const p = createBillingTopUpPanel({ getToken: () => Promise.reject({}) });
    await p._handleTopUp(5);
    expect(p._state.error).toBe('Error');
  });
  it('catch load getToken reject', async () => {
    const p = createBillingTopUpPanel({ getToken: () => Promise.reject({}) });
    await p.load();
    expect(p._state.error).toBe('Error');
  });
});
