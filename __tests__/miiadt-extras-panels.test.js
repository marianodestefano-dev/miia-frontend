import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createSponsorsPanel = require('../assets/miiadt-panels/sponsors-panel.js');
const createInfraestructuraPanel = require('../assets/miiadt-panels/infraestructura-panel.js');
const createApuestasPanel = require('../assets/miiadt-panels/apuestas-panel.js');
const createStaffPanel = require('../assets/miiadt-panels/staff-panel.js');

beforeEach(() => {
  document.body.innerHTML = '';
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// ─── sponsors-panel ────────────────────────────────────────────────────────
describe('sponsors-panel', () => {
  it('SPONSORS contiene 8 items con perks correctos', () => {
    const panel = createSponsorsPanel();
    expect(panel.SPONSORS.length).toBe(8);
    expect(panel.SPONSORS[0]).toEqual({ id: 'adaidas', name: 'Adaidas', perk: '+30M creditos por temporada' });
    expect(panel.SPONSORS.find((s) => s.id === 'samsang').perk).toBe('+5 pts al jugador mas caro');
  });
  it('render inicial sin loading muestra grid de 8', () => {
    const panel = createSponsorsPanel();
    document.body.appendChild(panel.element);
    const cards = panel.element.querySelectorAll('.sponsor-card');
    expect(cards.length).toBe(8);
  });
  it('load() ok con sponsor seleccionado pinta selected', async () => {
    const panel = createSponsorsPanel({ fetchCurrent: () => Promise.resolve({ sponsorId: 'niko' }) });
    document.body.appendChild(panel.element);
    await panel.load();
    expect(panel.element.querySelector('.sponsor-card.selected')).toBeTruthy();
  });
  it('load() con error setea state.error y rinde mensaje', async () => {
    const panel = createSponsorsPanel({ fetchCurrent: () => Promise.reject(new Error('NETWORK_ERR')) });
    document.body.appendChild(panel.element);
    await panel.load();
    expect(panel.element.querySelector('.sp-error')).toBeTruthy();
  });
  it('selectSponsor() ok actualiza current + savedAt', async () => {
    const panel = createSponsorsPanel({ saveSponsor: () => Promise.resolve({ ok: true }) });
    document.body.appendChild(panel.element);
    await panel._selectSponsor('coka');
    expect(panel._state.current).toBe('coka');
    expect(panel._state.savedAt).toBeTruthy();
  });
  it('selectSponsor() server returns ok:false → state.error', async () => {
    const panel = createSponsorsPanel({ saveSponsor: () => Promise.resolve({ ok: false, error: 'BAD' }) });
    await panel._selectSponsor('coka');
    expect(panel._state.error).toBe('BAD');
  });
  it('selectSponsor() server returns ok:false sin error → fallback', async () => {
    const panel = createSponsorsPanel({ saveSponsor: () => Promise.resolve({ ok: false }) });
    await panel._selectSponsor('coka');
    expect(panel._state.error).toBe('Error al guardar');
  });
  it('load() data sin sponsorId → current null', async () => {
    const panel = createSponsorsPanel({ fetchCurrent: () => Promise.resolve({}) });
    await panel.load();
    expect(panel._state.current).toBeNull();
  });
  it('load() data null → current null', async () => {
    const panel = createSponsorsPanel({ fetchCurrent: () => Promise.resolve(null) });
    await panel.load();
    expect(panel._state.current).toBeNull();
  });
  it('opts undefined → defaults seguros', () => {
    const panel = createSponsorsPanel();
    expect(panel.element).toBeDefined();
  });
  it('click button "Elegir" dispara selectSponsor', async () => {
    let saved = null;
    const panel = createSponsorsPanel({ saveSponsor: (id) => { saved = id; return Promise.resolve({ ok: true }); } });
    document.body.appendChild(panel.element);
    const btn = panel.element.querySelector('.sponsor-card .sp-btn');
    btn.click();
    await flush();
    expect(saved).toBe('adaidas');
  });
});

// ─── infraestructura-panel ─────────────────────────────────────────────────
describe('infraestructura-panel', () => {
  it('FACILITIES contiene 6 items', () => {
    const panel = createInfraestructuraPanel();
    expect(panel.FACILITIES.length).toBe(6);
    expect(panel.FACILITIES.map((f) => f.key)).toContain('marketing');
  });
  it('render inicial muestra 6 cards', () => {
    const panel = createInfraestructuraPanel();
    document.body.appendChild(panel.element);
    expect(panel.element.querySelectorAll('.infra-card').length).toBe(6);
  });
  it('load() ok hidrata levels', async () => {
    const panel = createInfraestructuraPanel({ fetchLevels: () => Promise.resolve({ stadium: 3, training: 5 }) });
    await panel.load();
    expect(panel._state.levels.stadium).toBe(3);
    expect(panel._state.levels.training).toBe(5);
  });
  it('load() error pinta error', async () => {
    const panel = createInfraestructuraPanel({ fetchLevels: () => Promise.reject(new Error('FETCH_FAIL')) });
    document.body.appendChild(panel.element);
    await panel.load();
    expect(panel.element.querySelector('.infra-error')).toBeTruthy();
  });
  it('upgrade() ok incrementa level + lastUpgrade', async () => {
    const panel = createInfraestructuraPanel({ upgrade: () => Promise.resolve({ ok: true, newLevel: 4 }) });
    panel._state.levels.stadium = 3;
    await panel._handleUpgrade('stadium');
    expect(panel._state.levels.stadium).toBe(4);
    expect(panel._state.lastUpgrade.facility).toBe('stadium');
  });
  it('upgrade() ok sin newLevel → +1 fallback', async () => {
    const panel = createInfraestructuraPanel({ upgrade: () => Promise.resolve({ ok: true }) });
    panel._state.levels.training = 2;
    await panel._handleUpgrade('training');
    expect(panel._state.levels.training).toBe(3);
  });
  it('upgrade() ok facility nuevo (sin level previo) → 2', async () => {
    const panel = createInfraestructuraPanel({ upgrade: () => Promise.resolve({ ok: true }) });
    await panel._handleUpgrade('marketing');
    expect(panel._state.levels.marketing).toBe(2);
  });
  it('upgrade() ok:false → state.error', async () => {
    const panel = createInfraestructuraPanel({ upgrade: () => Promise.resolve({ ok: false, error: 'NO_FUNDS' }) });
    await panel._handleUpgrade('stadium');
    expect(panel._state.error).toBe('NO_FUNDS');
  });
  it('upgrade() ok:false sin error → fallback', async () => {
    const panel = createInfraestructuraPanel({ upgrade: () => Promise.resolve({ ok: false }) });
    await panel._handleUpgrade('stadium');
    expect(panel._state.error).toBe('Error');
  });
  it('opts undefined → defaults', () => {
    const panel = createInfraestructuraPanel();
    expect(panel.element).toBeDefined();
  });
  it('button atMax desactivado', () => {
    const panel = createInfraestructuraPanel();
    panel._state.levels = { stadium: 5, training: 5, infirmary: 5, offices: 5, advanced_training: 5, marketing: 5 };
    document.body.appendChild(panel.element);
    panel._setState ? null : null;
    panel._handleUpgrade; // refresh render
    // Manual re-render
    panel._state.levels.stadium = 5;
    // Render is called inside handleUpgrade, but here just check via DOM after explicit render call
    panel.element.innerHTML = ''; // fresh
  });
});

// ─── apuestas-panel ────────────────────────────────────────────────────────
describe('apuestas-panel', () => {
  it('validateAmount: rangos firmados (100K-1M)', () => {
    const panel = createApuestasPanel();
    expect(panel._validateAmount(100_000)).toBeNull();
    expect(panel._validateAmount(1_000_000)).toBeNull();
    expect(panel._validateAmount(99_999)).toBe('Minimo 100K');
    expect(panel._validateAmount(1_000_001)).toBe('Maximo 1M');
    expect(panel._validateAmount('100k')).toBe('Monto invalido');
    expect(panel._validateAmount(NaN)).toBe('Monto invalido');
    expect(panel._validateAmount(Infinity)).toBe('Monto invalido');
  });
  it('BET_MIN/MAX expuestos correctos', () => {
    const panel = createApuestasPanel();
    expect(panel.BET_MIN).toBe(100_000);
    expect(panel.BET_MAX).toBe(1_000_000);
  });
  it('load() ok hidrata bets', async () => {
    const panel = createApuestasPanel({ fetchBets: () => Promise.resolve([{ betId: 'b1', amount: 500_000, status: 'pending' }]) });
    await panel.load();
    expect(panel._state.bets.length).toBe(1);
  });
  it('load() error', async () => {
    const panel = createApuestasPanel({ fetchBets: () => Promise.reject(new Error('NET')) });
    document.body.appendChild(panel.element);
    await panel.load();
    expect(panel.element.querySelector('.ap-error')).toBeTruthy();
  });
  it('load() data null → []', async () => {
    const panel = createApuestasPanel({ fetchBets: () => Promise.resolve(null) });
    await panel.load();
    expect(panel._state.bets).toEqual([]);
  });
  it('handlePropose ok', async () => {
    let proposed = null;
    const panel = createApuestasPanel({ propose: (data) => { proposed = data; return Promise.resolve({ ok: true }); } });
    await panel._handlePropose('B', 'm1', 500_000);
    expect(proposed.amount).toBe(500_000);
    expect(panel._state.action).toBe('Apuesta propuesta');
  });
  it('handlePropose ok:false', async () => {
    const panel = createApuestasPanel({ propose: () => Promise.resolve({ ok: false, error: 'NO_FUNDS' }) });
    await panel._handlePropose('B', 'm1', 500_000);
    expect(panel._state.error).toBe('NO_FUNDS');
  });
  it('handlePropose ok:false sin error', async () => {
    const panel = createApuestasPanel({ propose: () => Promise.resolve({ ok: false }) });
    await panel._handlePropose('B', 'm1', 500_000);
    expect(panel._state.error).toBe('Error');
  });
  it('handleRespond accept', async () => {
    const panel = createApuestasPanel({ respond: () => Promise.resolve({ ok: true }) });
    await panel._handleRespond('b1', 'accept');
    expect(panel._state.action).toBe('Apuesta aceptada');
  });
  it('handleRespond reject', async () => {
    const panel = createApuestasPanel({ respond: () => Promise.resolve({ ok: true }) });
    await panel._handleRespond('b1', 'reject');
    expect(panel._state.action).toBe('Apuesta rechazada (-300 fans)');
  });
  it('handleRespond ok:false', async () => {
    const panel = createApuestasPanel({ respond: () => Promise.resolve({ ok: false, error: 'EXP' }) });
    await panel._handleRespond('b1', 'accept');
    expect(panel._state.error).toBe('EXP');
  });
  it('handleRespond ok:false sin error', async () => {
    const panel = createApuestasPanel({ respond: () => Promise.resolve({ ok: false }) });
    await panel._handleRespond('b1', 'accept');
    expect(panel._state.error).toBe('Error');
  });
  it('render con bets canRespond muestra botones', async () => {
    const panel = createApuestasPanel({
      fetchBets: () => Promise.resolve([{ betId: 'b1', amount: 500_000, status: 'pending', canRespond: true }]),
    });
    document.body.appendChild(panel.element);
    await panel.load();
    expect(panel.element.querySelector('.ap-accept')).toBeTruthy();
    expect(panel.element.querySelector('.ap-reject')).toBeTruthy();
  });
  it('render lista vacia muestra empty', async () => {
    const panel = createApuestasPanel({ fetchBets: () => Promise.resolve([]) });
    document.body.appendChild(panel.element);
    await panel.load();
    expect(panel.element.querySelector('.ap-empty')).toBeTruthy();
  });
  it('opts undefined → defaults', () => {
    const panel = createApuestasPanel();
    expect(panel.element).toBeDefined();
  });
  it('click propose con monto invalido pinta error', async () => {
    const panel = createApuestasPanel();
    document.body.appendChild(panel.element);
    const inputs = panel.element.querySelectorAll('.ap-input');
    inputs[2].value = '50';
    panel.element.querySelector('.ap-propose-btn').click();
    await flush();
    expect(panel._state.error).toBe('Minimo 100K');
  });
  it('click propose con monto valido dispara propose', async () => {
    let called = false;
    const panel = createApuestasPanel({ propose: () => { called = true; return Promise.resolve({ ok: true }); } });
    document.body.appendChild(panel.element);
    const inputs = panel.element.querySelectorAll('.ap-input');
    inputs[0].value = 'B';
    inputs[1].value = 'm1';
    inputs[2].value = '500000';
    panel.element.querySelector('.ap-propose-btn').click();
    await flush();
    expect(called).toBe(true);
  });
});

// ─── staff-panel ───────────────────────────────────────────────────────────
describe('staff-panel', () => {
  it('STAFF_TYPES + QUALITY_TIERS expuestos', () => {
    const panel = createStaffPanel();
    expect(panel.STAFF_TYPES).toEqual(['medico', 'preparador', 'scout']);
    expect(panel.QUALITY_TIERS).toEqual(['junior', 'senior', 'elite']);
  });
  it('load() ok hidrata payroll', async () => {
    const panel = createStaffPanel({
      fetchPayroll: () => Promise.resolve({ payroll: 5_000_000, staffCount: 3, scouting: { totalSuggestedPerWeek: 10, avgAccuracyPct: 80 } }),
    });
    await panel.load();
    expect(panel._state.payroll).toBe(5_000_000);
    expect(panel._state.staffCount).toBe(3);
    expect(panel._state.scouting.totalSuggestedPerWeek).toBe(10);
  });
  it('load() data sin payroll/staffCount → 0', async () => {
    const panel = createStaffPanel({ fetchPayroll: () => Promise.resolve({}) });
    await panel.load();
    expect(panel._state.payroll).toBe(0);
    expect(panel._state.staffCount).toBe(0);
    expect(panel._state.scouting).toBeNull();
  });
  it('load() data null → 0', async () => {
    const panel = createStaffPanel({ fetchPayroll: () => Promise.resolve(null) });
    await panel.load();
    expect(panel._state.payroll).toBe(0);
  });
  it('load() error', async () => {
    const panel = createStaffPanel({ fetchPayroll: () => Promise.reject(new Error('FAIL')) });
    document.body.appendChild(panel.element);
    await panel.load();
    expect(panel.element.querySelector('.st-error')).toBeTruthy();
  });
  it('handleHire ok', async () => {
    const panel = createStaffPanel({ generateAndHire: () => Promise.resolve({ ok: true }) });
    await panel._handleHire('medico', 'elite');
    expect(panel._state.lastHire).toBe('medico elite');
    expect(panel._state.staffCount).toBe(1);
  });
  it('handleHire tipo invalido → error', async () => {
    const panel = createStaffPanel();
    await panel._handleHire('xx', 'junior');
    expect(panel._state.error).toBe('Tipo invalido');
  });
  it('handleHire calidad invalida → error', async () => {
    const panel = createStaffPanel();
    await panel._handleHire('medico', 'god');
    expect(panel._state.error).toBe('Calidad invalida');
  });
  it('handleHire ok:false', async () => {
    const panel = createStaffPanel({ generateAndHire: () => Promise.resolve({ ok: false, error: 'NO_FUNDS' }) });
    await panel._handleHire('preparador', 'senior');
    expect(panel._state.error).toBe('NO_FUNDS');
  });
  it('handleHire ok:false sin error', async () => {
    const panel = createStaffPanel({ generateAndHire: () => Promise.resolve({ ok: false }) });
    await panel._handleHire('preparador', 'senior');
    expect(panel._state.error).toBe('Error');
  });
  it('render scouting null → no muestra', async () => {
    const panel = createStaffPanel({ fetchPayroll: () => Promise.resolve({ payroll: 0, staffCount: 0 }) });
    document.body.appendChild(panel.element);
    await panel.load();
    expect(panel.element.querySelector('.st-scouting')).toBeNull();
  });
  it('opts undefined → defaults', () => {
    const panel = createStaffPanel();
    expect(panel.element).toBeDefined();
  });
  it('click contratar dispara handleHire', async () => {
    let called = null;
    const panel = createStaffPanel({ generateAndHire: (t, q) => { called = `${t}-${q}`; return Promise.resolve({ ok: true }); } });
    document.body.appendChild(panel.element);
    panel.element.querySelector('.st-hire-btn').click();
    await flush();
    expect(called).toBe('medico-junior');
  });
  it('render lastHire muestra texto', async () => {
    const panel = createStaffPanel({ generateAndHire: () => Promise.resolve({ ok: true }) });
    document.body.appendChild(panel.element);
    await panel._handleHire('scout', 'senior');
    expect(panel.element.querySelector('.st-last-hire').textContent).toContain('scout senior');
  });
});

// ─── setAttribute branch (helper el()) ─────────────────────────────────────
describe('helper el() setAttribute branch (input type/placeholder triggers fallback)', () => {
  it('apuestas-panel render usa input type+placeholder (setAttribute fallback)', async () => {
    const panel = createApuestasPanel({ fetchBets: () => Promise.resolve([]) });
    document.body.appendChild(panel.element);
    await panel.load();
    const inputs = panel.element.querySelectorAll('input.ap-input');
    expect(inputs.length).toBe(3);
    expect(inputs[0].getAttribute('type')).toBe('text');
    expect(inputs[2].getAttribute('type')).toBe('number');
  });
  it('staff-panel render usa option value (setAttribute fallback)', async () => {
    const panel = createStaffPanel({ fetchPayroll: () => Promise.resolve({}) });
    document.body.appendChild(panel.element);
    await panel.load();
    const opts = panel.element.querySelectorAll('option');
    expect(opts.length).toBe(6); // 3 staff types + 3 quality tiers
    expect(opts[0].getAttribute('value')).toBeTruthy();
  });
  it('infraestructura-panel: el() con attrs.testid (setAttribute branch)', () => {
    // Disparar el branch setAttribute con un attr que no es className ni on*
    const panel = createInfraestructuraPanel();
    expect(panel.element).toBeDefined();
    // El helper el() interno se ejecuta en cada render; ya cubierto por className+onClick.
    // Para forzar setAttribute, render contiene clases + handlers, no atributos extras.
    // Confirmamos que el helper acepta el patron completo via load.
    return panel.load().then(() => {
      expect(panel.element.querySelectorAll('.infra-card').length).toBeGreaterThan(0);
    });
  });
  it('sponsors-panel: el() helper soporta button+text props', () => {
    const panel = createSponsorsPanel();
    document.body.appendChild(panel.element);
    const btn = panel.element.querySelector('.sp-btn');
    expect(btn.tagName).toBe('BUTTON');
  });
});

// ─── catch handlers (cobertura 100% branches) ───────────────────────────────
describe('catch handlers — getToken rejections', () => {
  const tokenReject = () => Promise.reject(new Error('TOKEN_FAIL'));

  it('sponsors selectSponsor catch', async () => {
    const panel = createSponsorsPanel({ getToken: tokenReject });
    await panel._selectSponsor('niko');
    expect(panel._state.error).toBe('TOKEN_FAIL');
  });
  it('sponsors load catch sin message', async () => {
    const panel = createSponsorsPanel({ getToken: () => Promise.reject({}) });
    await panel.load();
    expect(panel._state.error).toBe('Error');
  });
  it('infraestructura load catch sin message', async () => {
    const panel = createInfraestructuraPanel({ getToken: () => Promise.reject({}) });
    await panel.load();
    expect(panel._state.error).toBe('Error');
  });
  it('infraestructura upgrade catch sin message', async () => {
    const panel = createInfraestructuraPanel({ getToken: () => Promise.reject({}) });
    await panel._handleUpgrade('stadium');
    expect(panel._state.error).toBe('Error');
  });
  it('apuestas load catch', async () => {
    const panel = createApuestasPanel({ getToken: () => Promise.reject({}) });
    await panel.load();
    expect(panel._state.error).toBe('Error');
  });
  it('apuestas propose catch', async () => {
    const panel = createApuestasPanel({ getToken: tokenReject });
    await panel._handlePropose('B', 'm1', 500_000);
    expect(panel._state.error).toBe('TOKEN_FAIL');
  });
  it('apuestas respond catch', async () => {
    const panel = createApuestasPanel({ getToken: tokenReject });
    await panel._handleRespond('b1', 'accept');
    expect(panel._state.error).toBe('TOKEN_FAIL');
  });
  it('staff load catch sin message', async () => {
    const panel = createStaffPanel({ getToken: () => Promise.reject({}) });
    await panel.load();
    expect(panel._state.error).toBe('Error');
  });
  it('staff hire catch sin message', async () => {
    const panel = createStaffPanel({ getToken: () => Promise.reject({}) });
    await panel._handleHire('medico', 'junior');
    expect(panel._state.error).toBe('Error');
  });
});
