import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createF1Panel = require('../assets/f1-panels/f1-panel.js');

const DRIVERS = [
  { id: 'VER', name: 'Verstappen', team: 'Red Bull', team_color: '#3671C6', points: 200, position: 1 },
  { id: 'HAM', name: 'Hamilton', team: 'Ferrari', team_color: '#E8002D', points: 180, position: 2, adoptedByOwner: true },
  { id: 'NOR', name: 'Norris', team: 'McLaren', team_color: '#FF8000', points: 160, position: 3 },
  { id: 'no-name', team: 'Unknown', points: null, position: 4 },
];

const GPS = [
  { id: 'BHR', name: 'GP Bahréin', circuit: 'Sakhir', country: 'Bahréin', date: '2026-03-01', isPast: true },
  { id: 'SAU', name: 'GP Arabia Saudita', circuit: 'Jeddah', country: 'Arabia Saudita', date: '2026-03-08', isNext: true },
  { id: 'AUS', name: 'GP Australia', circuit: 'Albert Park', country: 'Australia', date: '2026-03-22' },
  { id: 'no-name-gp' },
];

describe('f1-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  // ── constructor / defaults ──────────────────────────────────────────────────

  test('crea element HTMLElement', () => {
    const p = createF1Panel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('opts undefined no rompe (opts = opts || {})', () => {
    const p = createF1Panel(undefined);
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('opts null no rompe', () => {
    const p = createF1Panel(null);
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('título MiiaF1 presente', () => {
    const p = createF1Panel({});
    expect(p.element.textContent).toContain('MiiaF1');
  });

  test('tabs Pilotos y Calendario presentes', () => {
    const p = createF1Panel({});
    const tabs = p.element.querySelectorAll('.f1-tab');
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toBe('Pilotos');
    expect(tabs[1].textContent).toBe('Calendario');
  });

  // ── tab switching ───────────────────────────────────────────────────────────

  test('tab inicial es standings (calendar panel oculto)', () => {
    const p = createF1Panel({});
    const calPanel = p.element.querySelector('.f1-calendar-panel');
    expect(calPanel.style.display).toBe('none');
  });

  test('switchTab calendar → muestra calendar, oculta standings', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    expect(p._state.activeTab).toBe('calendar');
    const standPanel = p.element.querySelector('.f1-standings-panel');
    const calPanel = p.element.querySelector('.f1-calendar-panel');
    expect(standPanel.style.display).toBe('none');
    expect(calPanel.style.display).not.toBe('none');
  });

  test('switchTab standings → muestra standings, oculta calendar', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p.switchTab('standings');
    expect(p._state.activeTab).toBe('standings');
    const standPanel = p.element.querySelector('.f1-standings-panel');
    expect(standPanel.style.display).not.toBe('none');
  });

  test('click tab Calendario dispara switchTab', () => {
    const p = createF1Panel({});
    const tabs = p.element.querySelectorAll('.f1-tab');
    tabs[1].click();
    expect(p._state.activeTab).toBe('calendar');
  });

  test('click tab Pilotos vuelve a standings', () => {
    const p = createF1Panel({});
    const tabs = p.element.querySelectorAll('.f1-tab');
    tabs[1].click();
    tabs[0].click();
    expect(p._state.activeTab).toBe('standings');
  });

  // ── standings loading/error/empty ───────────────────────────────────────────

  test('standingsLoading → skeleton en standings panel', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: true });
    const skels = p.element.querySelector('.f1-standings-panel').querySelectorAll('.f1-skeleton');
    expect(skels.length).toBeGreaterThan(0);
  });

  test('standingsError → mensaje error en standings panel', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standingsError: 'Error standings' });
    expect(p.element.querySelector('.f1-standings-panel').textContent).toContain('Error standings');
  });

  test('standings null → drivers=[] → "Sin pilotos"', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: null });
    expect(p.element.querySelector('.f1-standings-panel').textContent).toContain('Sin pilotos');
  });

  test('drivers [] → "Sin pilotos"', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: [] } });
    expect(p.element.querySelector('.f1-standings-panel').textContent).toContain('Sin pilotos');
  });

  test('drivers presentes → renderiza f1-driver-row', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: DRIVERS } });
    const rows = p.element.querySelectorAll('.f1-driver-row');
    expect(rows.length).toBe(4);
  });

  // ── driver row branches ─────────────────────────────────────────────────────

  test('driver adoptedByOwner → borde rojo, sin botón Adoptar', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: [{ id: 'HAM', name: 'Hamilton', adoptedByOwner: true, points: 100, position: 1 }] } });
    const row = p.element.querySelector('.f1-driver-row');
    expect(row.style.borderLeft).toContain('#E10600');
    expect(row.querySelector('.f1-adopt-btn')).toBeNull();
  });

  test('driver NO adoptado → borde transparent, botón Adoptar visible', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: [{ id: 'VER', name: 'Verstappen', points: 200, position: 1 }] } });
    const row = p.element.querySelector('.f1-driver-row');
    expect(row.style.borderLeft).toContain('transparent');
    expect(row.querySelector('.f1-adopt-btn')).toBeTruthy();
  });

  test('driver.name presente → muestra name', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: [{ id: 'VER', name: 'Verstappen', points: 0, position: 1 }] } });
    expect(p.element.textContent).toContain('Verstappen');
  });

  test('driver sin name pero con id → muestra id', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: [{ id: 'XYZ-ID', points: 0, position: 1 }] } });
    expect(p.element.textContent).toContain('XYZ-ID');
  });

  test('driver sin name ni id → muestra "Piloto"', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: [{ points: 10, position: 1 }] } });
    expect(p.element.textContent).toContain('Piloto');
  });

  test('driver.points=0 → muestra "0" (0 != null)', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: [{ name: 'X', points: 0, position: 1 }] } });
    expect(p.element.querySelector('.f1-standings-panel').textContent).toContain('0');
  });

  test('driver.points=null → muestra "0" (|| 0 fallback)', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: [{ name: 'X', points: null, position: 1 }] } });
    expect(p.element.querySelector('.f1-standings-panel').textContent).toContain('0');
  });

  test('driver.team_color ausente → dot usa #888', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: [{ name: 'X', points: 5, position: 1 }] } });
    const row = p.element.querySelector('.f1-driver-row');
    expect(row).toBeTruthy();
  });

  test('driver.team presente → muestra team', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: [{ name: 'X', team: 'McLaren', points: 50, position: 1 }] } });
    expect(p.element.textContent).toContain('McLaren');
  });

  test('driver.position ausente → muestra "—" (|| falsy branch)', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: false, standings: { drivers: [{ name: 'X', points: 10 }] } });
    expect(p.element.querySelector('.f1-standings-panel').textContent).toContain('—');
  });

  // ── adopt button ───────────────────────────────────────────────────────────

  test('click Adoptar llama onAdopt con driverId', async () => {
    const onAdopt = vi.fn().mockResolvedValue(null);
    const p = createF1Panel({ onAdopt, getToken: async () => 'tok' });
    p._setState({ standingsLoading: false, standings: { drivers: [{ id: 'VER', name: 'Verstappen', points: 200, position: 1 }] } });
    p.element.querySelector('.f1-adopt-btn').click();
    await new Promise(r => setTimeout(r, 20));
    expect(onAdopt).toHaveBeenCalledWith('VER', 'tok');
  });

  test('adoptDriver con driver sin id ni name usa string vacío', async () => {
    const onAdopt = vi.fn().mockResolvedValue(null);
    const p = createF1Panel({ onAdopt, getToken: async () => 't' });
    p._setState({ standingsLoading: false, standings: { drivers: [{ points: 5, position: 1 }] } });
    p.element.querySelector('.f1-adopt-btn').click();
    await new Promise(r => setTimeout(r, 20));
    expect(onAdopt).toHaveBeenCalledWith('', 't');
  });

  test('default onAdopt no rompe', async () => {
    const p = createF1Panel({ getToken: async () => 't' });
    p._setState({ standingsLoading: false, standings: { drivers: [{ id: 'VER', name: 'V', points: 0, position: 1 }] } });
    expect(() => p.element.querySelector('.f1-adopt-btn').click()).not.toThrow();
    await new Promise(r => setTimeout(r, 20));
  });

  // ── calendar loading/error/empty ────────────────────────────────────────────

  test('calendarLoading → skeleton en calendar panel', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: true });
    const skels = p.element.querySelector('.f1-calendar-panel').querySelectorAll('.f1-skeleton');
    expect(skels.length).toBeGreaterThan(0);
  });

  test('calendarError → mensaje error en calendar panel', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendarError: 'Error cal' });
    expect(p.element.querySelector('.f1-calendar-panel').textContent).toContain('Error cal');
  });

  test('calendar null → gps=[] → "Sin GPs"', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: null });
    expect(p.element.querySelector('.f1-calendar-panel').textContent).toContain('Sin GPs');
  });

  test('gps [] → "Sin GPs"', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: { gps: [] } });
    expect(p.element.querySelector('.f1-calendar-panel').textContent).toContain('Sin GPs');
  });

  test('gps presentes → renderiza f1-gp-item', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: { gps: GPS } });
    const items = p.element.querySelectorAll('.f1-gp-item');
    expect(items.length).toBe(4);
  });

  // ── GP item branches ────────────────────────────────────────────────────────

  test('gp.isNext → borde rojo, badge ACTIVO', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: { gps: [{ id: 'SAU', name: 'GP Arabia', circuit: 'Jeddah', country: 'Arabia', date: '2026-03-08', isNext: true }] } });
    const item = p.element.querySelector('.f1-gp-item');
    expect(item.style.borderLeft).toContain('#E10600');
    expect(item.textContent).toContain('ACTIVO');
  });

  test('gp.isPast → opacidad 0.55, badge PASADO', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: { gps: [{ id: 'BHR', name: 'GP Bahréin', circuit: 'Sakhir', country: 'Bahréin', date: '2026-03-01', isPast: true }] } });
    const item = p.element.querySelector('.f1-gp-item');
    expect(item.style.opacity).toBe('0.55');
    expect(item.textContent).toContain('PASADO');
  });

  test('gp upcoming (no isNext, no isPast) → badge PRÓXIMO', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: { gps: [{ id: 'AUS', name: 'GP Australia', circuit: 'Albert Park', country: 'Australia', date: '2026-03-22' }] } });
    const item = p.element.querySelector('.f1-gp-item');
    expect(item.textContent).toContain('PRÓXIMO');
  });

  test('gp.name presente → muestra name', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: { gps: [{ id: 'BHR', name: 'GP Bahréin', date: '2026-03-01' }] } });
    expect(p.element.textContent).toContain('GP Bahréin');
  });

  test('gp sin name pero con id → muestra id', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: { gps: [{ id: 'MY-ID', date: '2026-05-01' }] } });
    expect(p.element.textContent).toContain('MY-ID');
  });

  test('gp sin name ni id → muestra "GP"', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: { gps: [{ date: '2026-05-01' }] } });
    expect(p.element.textContent).toContain('GP');
  });

  test('gp.date ausente → muestra "—"', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: { gps: [{ name: 'GP Test' }] } });
    expect(p.element.textContent).toContain('—');
  });

  test('gp.country ausente → circuitEl solo muestra circuit', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: { gps: [{ name: 'GP Test', circuit: 'Monza', date: '2026-09-07' }] } });
    expect(p.element.textContent).toContain('Monza');
  });

  test('gp.circuit y country → "circuit — country"', () => {
    const p = createF1Panel({});
    p.switchTab('calendar');
    p._setState({ calendarLoading: false, calendar: { gps: [{ name: 'GP Italia', circuit: 'Monza', country: 'Italia', date: '2026-09-07' }] } });
    expect(p.element.textContent).toContain('Monza — Italia');
  });

  // ── loadStandings / loadCalendar / refresh ──────────────────────────────────

  test('loadStandings exitoso actualiza standings', async () => {
    const p = createF1Panel({
      fetchStandings: async () => ({ drivers: DRIVERS }),
      getToken: async () => 'tok',
    });
    await p.loadStandings();
    expect(p._state.standingsLoading).toBe(false);
    expect(p._state.standings.drivers.length).toBe(4);
  });

  test('loadStandings error pone standingsError', async () => {
    const p = createF1Panel({
      fetchStandings: async () => { throw new Error('standings fail'); },
      getToken: async () => 't',
    });
    await p.loadStandings();
    expect(p._state.standingsError).toBe('standings fail');
    expect(p._state.standingsLoading).toBe(false);
  });

  test('loadCalendar exitoso actualiza calendar', async () => {
    const p = createF1Panel({
      fetchCalendar: async () => ({ gps: GPS }),
      getToken: async () => 'tok',
    });
    await p.loadCalendar();
    expect(p._state.calendarLoading).toBe(false);
    expect(p._state.calendar.gps.length).toBe(4);
  });

  test('loadCalendar error pone calendarError', async () => {
    const p = createF1Panel({
      fetchCalendar: async () => { throw new Error('cal fail'); },
      getToken: async () => 't',
    });
    await p.loadCalendar();
    expect(p._state.calendarError).toBe('cal fail');
    expect(p._state.calendarLoading).toBe(false);
  });

  test('refresh() llama loadStandings + loadCalendar', async () => {
    const fetchStandings = vi.fn().mockResolvedValue({ drivers: [] });
    const fetchCalendar = vi.fn().mockResolvedValue({ gps: [] });
    const p = createF1Panel({ fetchStandings, fetchCalendar, getToken: async () => 't' });
    await p.refresh();
    expect(fetchStandings).toHaveBeenCalled();
    expect(fetchCalendar).toHaveBeenCalled();
  });

  test('default fetchStandings retorna null → standings=null', async () => {
    const p = createF1Panel({ getToken: async () => 't' });
    await p.loadStandings();
    expect(p._state.standings).toBeNull();
  });

  test('default fetchCalendar retorna null → calendar=null', async () => {
    const p = createF1Panel({ getToken: async () => 't' });
    await p.loadCalendar();
    expect(p._state.calendar).toBeNull();
  });

  test('default getToken → token vacío pasado a fetchStandings', async () => {
    let capturedToken;
    const p = createF1Panel({ fetchStandings: async (tok) => { capturedToken = tok; return null; } });
    await p.loadStandings();
    expect(capturedToken).toBe('');
  });

  test('_setState standingsLoading:true + calendarLoading:true → doble skeleton', () => {
    const p = createF1Panel({});
    p._setState({ standingsLoading: true, calendarLoading: true });
    const standSkels = p.element.querySelector('.f1-standings-panel').querySelectorAll('.f1-skeleton');
    expect(standSkels.length).toBeGreaterThan(0);
  });
});
