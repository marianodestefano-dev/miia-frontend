import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const createF1Panel = require('../assets/f1-panels/f1-panel.js');

const STANDINGS_DATA = {
  drivers: [
    { id: 'd1', name: 'Max Verstappen', team: 'Red Bull', points: 100 },
    { id: 'd2', name: 'Lando Norris',   team: 'McLaren',  points: 80 },
  ],
};

const CALENDAR_DATA = {
  races: [
    { date: undefined,      raceName: undefined },       // no date/name
    { date: '2099-01-01',   raceName: 'Future GP' },    // next
    { date: '2099-02-01',   raceName: 'Later GP' },     // after next
  ],
};

describe('f1-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  // ── constructor ──────────────────────────────────────────────────────────

  test('opts null — crea panel sin error', () => {
    const p = createF1Panel(null);
    expect(p.element).toBeDefined();
    expect(p._state.tab).toBe('standings');
  });

  test('initial render — tab standings activo', () => {
    const p = createF1Panel({});
    const btn = p.element.querySelector('.f1-tab-standings');
    expect(btn.classList.contains('active')).toBe(true);
  });

  // ── loading state ─────────────────────────────────────────────────────────

  test('_setState loading=true muestra Cargando', () => {
    const p = createF1Panel({});
    p._setState({ loading: true });
    expect(p.element.querySelector('.f1-loading')).not.toBeNull();
    expect(p.element.querySelector('.f1-loading').textContent).toBe('Cargando...');
  });

  // ── error state ───────────────────────────────────────────────────────────

  test('_setState error muestra mensaje de error', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, error: 'Algo fallo' });
    expect(p.element.querySelector('.f1-error').textContent).toBe('Algo fallo');
  });

  // ── standings tab ─────────────────────────────────────────────────────────

  test('standings null muestra Sin standings disponibles', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, standings: null });
    expect(p.element.querySelector('.f1-empty').textContent).toContain('Sin standings');
  });

  test('standings con drivers renderiza tabla', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, standings: STANDINGS_DATA });
    expect(p.element.querySelectorAll('.f1-driver-row').length).toBe(2);
  });

  test('standings drivers vacios muestra Sin pilotos', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, standings: { drivers: [] } });
    expect(p.element.querySelector('.f1-empty-msg').textContent).toBe('Sin pilotos');
  });

  test('standings.drivers usa fallback [] cuando no hay key', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, standings: {} }); // no drivers key
    expect(p.element.querySelector('.f1-empty-msg').textContent).toBe('Sin pilotos');
  });

  test('driver adoptado tiene clase f1-adopted y boton Adoptado', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, standings: STANDINGS_DATA, adoptedDriver: 'd1' });
    const rows = p.element.querySelectorAll('.f1-driver-row');
    expect(rows[0].classList.contains('f1-adopted')).toBe(true);
    expect(rows[0].querySelector('.f1-adopt-btn').textContent).toBe('Adoptado');
  });

  test('driver no adoptado no tiene clase f1-adopted y boton Adoptar', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, standings: STANDINGS_DATA, adoptedDriver: 'd1' });
    const rows = p.element.querySelectorAll('.f1-driver-row');
    expect(rows[1].classList.contains('f1-adopted')).toBe(false);
    expect(rows[1].querySelector('.f1-adopt-btn').textContent).toBe('Adoptar');
  });

  test('driver sin name usa Unknown', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, standings: { drivers: [{ id: 'x', points: 10 }] } });
    expect(p.element.textContent).toContain('Unknown');
  });

  test('driver sin points muestra 0', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, standings: { drivers: [{ id: 'x', name: 'Piloto' }] } });
    const row = p.element.querySelector('.f1-driver-row');
    expect(row.textContent).toContain('0');
  });

  // ── calendar tab ──────────────────────────────────────────────────────────

  test('calendar null muestra Sin calendario disponible', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, tab: 'calendar', calendar: null });
    expect(p.element.querySelector('.f1-empty').textContent).toContain('Sin calendario');
  });

  test('calendar races vacias muestra Sin carreras', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, tab: 'calendar', calendar: { races: [] } });
    expect(p.element.querySelector('.f1-empty-msg').textContent).toBe('Sin carreras programadas');
  });

  test('calendar races usa fallback [] cuando no hay key', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, tab: 'calendar', calendar: {} }); // no races key
    expect(p.element.querySelector('.f1-empty-msg').textContent).toBe('Sin carreras programadas');
  });

  test('calendar renderiza race cards', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, tab: 'calendar', calendar: CALENDAR_DATA });
    expect(p.element.querySelectorAll('.f1-race-card').length).toBe(3);
  });

  test('primera carrera futura tiene badge PROXIMO y clase f1-race-next', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, tab: 'calendar', calendar: CALENDAR_DATA });
    const cards = p.element.querySelectorAll('.f1-race-card');
    // race index 1 is the first future (2099-01-01) — index 0 has no date → '' < today
    expect(cards[1].classList.contains('f1-race-next')).toBe(true);
    expect(cards[1].querySelector('.f1-next-badge')).not.toBeNull();
  });

  test('carrera sin date usa string vacio (isNext false)', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, tab: 'calendar', calendar: CALENDAR_DATA });
    const cards = p.element.querySelectorAll('.f1-race-card');
    // race index 0 has no date
    expect(cards[0].classList.contains('f1-race-next')).toBe(false);
    expect(cards[0].querySelector('.f1-race-date').textContent).toBe('');
  });

  test('carrera sin raceName usa GP', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, tab: 'calendar', calendar: CALENDAR_DATA });
    const cards = p.element.querySelectorAll('.f1-race-card');
    // race index 0 has no raceName → 'GP'
    expect(cards[0].querySelector('.f1-race-name').textContent).toBe('GP');
  });

  test('segunda carrera futura no tiene badge PROXIMO (foundNext ya true)', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, tab: 'calendar', calendar: CALENDAR_DATA });
    const cards = p.element.querySelectorAll('.f1-race-card');
    // race index 2 is after the next GP
    expect(cards[2].classList.contains('f1-race-next')).toBe(false);
    expect(cards[2].querySelector('.f1-next-badge')).toBeNull();
  });

  // ── tab buttons ───────────────────────────────────────────────────────────

  test('tab standings activo tiene clase active', () => {
    const p = createF1Panel({});
    p._setState({ tab: 'standings', loading: false, standings: null });
    expect(p.element.querySelector('.f1-tab-standings').classList.contains('active')).toBe(true);
    expect(p.element.querySelector('.f1-tab-calendar').classList.contains('active')).toBe(false);
  });

  test('tab calendar activo tiene clase active', () => {
    const p = createF1Panel({});
    p._setState({ tab: 'calendar', loading: false, calendar: null });
    expect(p.element.querySelector('.f1-tab-calendar').classList.contains('active')).toBe(true);
    expect(p.element.querySelector('.f1-tab-standings').classList.contains('active')).toBe(false);
  });

  // ── switchTab ─────────────────────────────────────────────────────────────

  test('switchTab al mismo tab es no-op', () => {
    const p = createF1Panel({});
    p._setState({ tab: 'standings', loading: false, standings: null });
    const before = p._state.tab;
    p.switchTab('standings');
    expect(p._state.tab).toBe(before); // no change
  });

  test('switchTab a calendar cambia tab y llama loadCalendar', async () => {
    const fetchCalendar = vi.fn().mockResolvedValue(CALENDAR_DATA);
    const p = createF1Panel({ fetchCalendar });
    p._setState({ tab: 'standings', loading: false, standings: null, calendar: null });
    p.switchTab('calendar');
    expect(p._state.tab).toBe('calendar');
    await new Promise(r => setTimeout(r, 20));
    expect(fetchCalendar).toHaveBeenCalled();
  });

  test('switchTab a calendar cuando ya cargado — no llama loadCalendar', async () => {
    const fetchCalendar = vi.fn().mockResolvedValue(CALENDAR_DATA);
    const p = createF1Panel({ fetchCalendar });
    p._setState({ tab: 'standings', loading: false, standings: null, calendar: CALENDAR_DATA });
    p.switchTab('calendar');
    await new Promise(r => setTimeout(r, 20));
    expect(fetchCalendar).not.toHaveBeenCalled();
  });

  test('switchTab a standings cuando ya cargado — no llama loadStandings', async () => {
    const fetchStandings = vi.fn().mockResolvedValue(STANDINGS_DATA);
    const p = createF1Panel({ fetchStandings });
    // Pre-load standings
    p._setState({ tab: 'calendar', loading: false, standings: STANDINGS_DATA });
    p.switchTab('standings');
    await new Promise(r => setTimeout(r, 20));
    expect(fetchStandings).not.toHaveBeenCalled();
  });

  test('switchTab a standings cuando no cargado — llama loadStandings', async () => {
    const fetchStandings = vi.fn().mockResolvedValue(STANDINGS_DATA);
    const p = createF1Panel({ fetchStandings });
    p._setState({ tab: 'calendar', loading: false, standings: null });
    p.switchTab('standings');
    await new Promise(r => setTimeout(r, 20));
    expect(fetchStandings).toHaveBeenCalled();
  });

  test('click tab Calendario dispara switchTab', async () => {
    const fetchCalendar = vi.fn().mockResolvedValue(CALENDAR_DATA);
    const p = createF1Panel({ fetchCalendar });
    p._setState({ tab: 'standings', loading: false, standings: null, calendar: null });
    p.element.querySelector('.f1-tab-calendar').click();
    await new Promise(r => setTimeout(r, 20));
    expect(p._state.tab).toBe('calendar');
  });

  test('click tab Standings dispara switchTab', () => {
    const p = createF1Panel({});
    p._setState({ tab: 'calendar', loading: false, calendar: null });
    p.element.querySelector('.f1-tab-standings').click();
    expect(p._state.tab).toBe('standings');
  });

  // ── loadStandings ─────────────────────────────────────────────────────────

  test('loadStandings sets standings + loading=false', async () => {
    const fetchStandings = vi.fn().mockResolvedValue(STANDINGS_DATA);
    const p = createF1Panel({ fetchStandings });
    await p.loadStandings();
    expect(p._state.standings).toEqual(STANDINGS_DATA);
    expect(p._state.loading).toBe(false);
  });

  test('loadStandings error sets error + loading=false', async () => {
    const fetchStandings = vi.fn().mockRejectedValue(new Error('no data'));
    const p = createF1Panel({ fetchStandings });
    await p.loadStandings();
    expect(p._state.error).toBe('no data');
    expect(p._state.loading).toBe(false);
  });

  test('loadStandings sin fetchStandings usa default (retorna null)', async () => {
    const p = createF1Panel({});
    await p.loadStandings();
    expect(p._state.standings).toBeNull();
  });

  test('loadStandings sin getToken usa default (token vacio)', async () => {
    const fetchStandings = vi.fn().mockResolvedValue(STANDINGS_DATA);
    const p = createF1Panel({ fetchStandings }); // no getToken
    await p.loadStandings();
    expect(fetchStandings).toHaveBeenCalledWith('');
  });

  // ── loadCalendar ──────────────────────────────────────────────────────────

  test('loadCalendar sets calendar + loading=false', async () => {
    const fetchCalendar = vi.fn().mockResolvedValue(CALENDAR_DATA);
    const p = createF1Panel({ fetchCalendar });
    await p.loadCalendar();
    expect(p._state.calendar).toEqual(CALENDAR_DATA);
    expect(p._state.loading).toBe(false);
  });

  test('loadCalendar error sets error + loading=false', async () => {
    const fetchCalendar = vi.fn().mockRejectedValue(new Error('cal fail'));
    const p = createF1Panel({ fetchCalendar });
    await p.loadCalendar();
    expect(p._state.error).toBe('cal fail');
    expect(p._state.loading).toBe(false);
  });

  test('loadCalendar sin fetchCalendar usa default (retorna null)', async () => {
    const p = createF1Panel({});
    await p.loadCalendar();
    expect(p._state.calendar).toBeNull();
  });

  test('loadCalendar sin getToken usa default (token vacio)', async () => {
    const fetchCalendar = vi.fn().mockResolvedValue(CALENDAR_DATA);
    const p = createF1Panel({ fetchCalendar }); // no getToken
    await p.loadCalendar();
    expect(fetchCalendar).toHaveBeenCalledWith('');
  });

  // ── adoptDriver ───────────────────────────────────────────────────────────

  test('adoptDriver actualiza adoptedDriver y llama onAdopt', () => {
    const onAdopt = vi.fn();
    const p = createF1Panel({ onAdopt });
    p._setState({ loading: false, standings: STANDINGS_DATA });
    p.adoptDriver('d1', 'Max Verstappen');
    expect(p._state.adoptedDriver).toBe('d1');
    expect(onAdopt).toHaveBeenCalledWith('d1', 'Max Verstappen');
  });

  test('click boton Adoptar llama adoptDriver', () => {
    const onAdopt = vi.fn();
    const p = createF1Panel({ onAdopt });
    p._setState({ loading: false, standings: STANDINGS_DATA });
    p.element.querySelector('.f1-adopt-btn').click();
    expect(onAdopt).toHaveBeenCalled();
  });

  test('default onAdopt — click no lanza error', () => {
    const p = createF1Panel({});
    p._setState({ loading: false, standings: STANDINGS_DATA });
    expect(() => p.element.querySelector('.f1-adopt-btn').click()).not.toThrow();
  });

  test('click boton Adoptar en driver sin name usa Unknown', () => {
    const onAdopt = vi.fn();
    const p = createF1Panel({ onAdopt });
    p._setState({ loading: false, standings: { drivers: [{ id: 'x' }] } }); // no name
    p.element.querySelector('.f1-adopt-btn').click();
    expect(onAdopt).toHaveBeenCalledWith('x', 'Unknown');
  });
});
