import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const createLigaPanel = require('../assets/miiadt-panels/liga-panel.js');

const LEAGUE_DATA = {
  leagueName: 'Liga MIIADT 2025',
  standings: [
    { teamName: 'Boca', points: 30, gamesPlayed: 10, won: 9, drawn: 3, lost: 1 },
    { teamName: 'River', points: 25, gamesPlayed: 10, won: 7, drawn: 4, lost: 2 },
  ],
  nextFixture: { homeTeam: 'Boca', awayTeam: 'River', date: '2099-06-01' },
};

describe('liga-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  // ── constructor ────────────────────────────────────────────────────────

  test('opts null — crea panel sin error', () => {
    const p = createLigaPanel(null);
    expect(p.element).toBeDefined();
    expect(p._state.league).toBeNull();
  });

  test('initial render — estado inicial sin loading ni error', () => {
    const p = createLigaPanel({});
    expect(p._state.loading).toBe(false);
    expect(p._state.error).toBeNull();
  });

  // ── loading ────────────────────────────────────────────────────────────

  test('_setState loading=true muestra Cargando', () => {
    const p = createLigaPanel({});
    p._setState({ loading: true });
    expect(p.element.querySelector('.liga-loading')).not.toBeNull();
    expect(p.element.querySelector('.liga-loading').textContent).toBe('Cargando...');
  });

  // ── error ──────────────────────────────────────────────────────────────

  test('_setState error muestra mensaje de error', () => {
    const p = createLigaPanel({});
    p._setState({ loading: false, error: 'Fallo la red' });
    expect(p.element.querySelector('.liga-error').textContent).toBe('Fallo la red');
  });

  // ── league null ────────────────────────────────────────────────────────

  test('league null muestra Sin liga disponible', () => {
    const p = createLigaPanel({});
    p._setState({ loading: false, league: null });
    expect(p.element.querySelector('.liga-empty').textContent).toContain('Sin liga');
  });

  // ── standings ──────────────────────────────────────────────────────────

  test('standings renderiza filas correctamente', () => {
    const p = createLigaPanel({});
    p._setState({ loading: false, league: LEAGUE_DATA });
    expect(p.element.querySelectorAll('.liga-standing-row').length).toBe(2);
  });

  test('standings vacias muestra Sin equipos', () => {
    const p = createLigaPanel({});
    p._setState({ loading: false, league: { leagueName: 'L1', standings: [] } });
    expect(p.element.querySelector('.liga-empty-standings').textContent).toBe('Sin equipos en la liga');
  });

  test('standings sin key usa fallback []', () => {
    const p = createLigaPanel({});
    p._setState({ loading: false, league: { leagueName: 'L1' } });
    expect(p.element.querySelector('.liga-empty-standings')).not.toBeNull();
  });

  test('equipo sin teamName usa Equipo', () => {
    const p = createLigaPanel({});
    p._setState({ loading: false, league: { standings: [{ points: 5 }] } });
    const row = p.element.querySelector('.liga-standing-row');
    expect(row.querySelector('.liga-standing-name').textContent).toBe('Equipo');
  });

  test('equipo sin points/gp/won/drawn/lost usa 0', () => {
    const p = createLigaPanel({});
    p._setState({ loading: false, league: { standings: [{ teamName: 'X' }] } });
    const row = p.element.querySelector('.liga-standing-row');
    expect(row.querySelector('.liga-standing-pts').textContent).toBe('0');
    expect(row.querySelector('.liga-standing-gp').textContent).toBe('0');
    expect(row.querySelector('.liga-standing-w').textContent).toBe('0');
    expect(row.querySelector('.liga-standing-d').textContent).toBe('0');
    expect(row.querySelector('.liga-standing-l').textContent).toBe('0');
  });

  test('liga sin leagueName usa Liga', () => {
    const p = createLigaPanel({});
    p._setState({ loading: false, league: { standings: [] } });
    expect(p.element.querySelector('.liga-league-name').textContent).toBe('Liga');
  });

  // ── nextFixture ────────────────────────────────────────────────────────

  test('nextFixture presente renderiza seccion', () => {
    const p = createLigaPanel({});
    p._setState({ loading: false, league: LEAGUE_DATA });
    expect(p.element.querySelector('.liga-next-fixture')).not.toBeNull();
    expect(p.element.querySelector('.liga-fixture-home').textContent).toBe('Boca');
    expect(p.element.querySelector('.liga-fixture-away').textContent).toBe('River');
    expect(p.element.querySelector('.liga-fixture-date').textContent).toBe('2099-06-01');
  });

  test('nextFixture ausente no renderiza seccion', () => {
    const p = createLigaPanel({});
    p._setState({ loading: false, league: { standings: [] } });
    expect(p.element.querySelector('.liga-next-fixture')).toBeNull();
  });

  test('fixture sin homeTeam/awayTeam/date usa fallbacks', () => {
    const p = createLigaPanel({});
    p._setState({ loading: false, league: { standings: [], nextFixture: {} } });
    expect(p.element.querySelector('.liga-fixture-home').textContent).toBe('Local');
    expect(p.element.querySelector('.liga-fixture-away').textContent).toBe('Visitante');
    expect(p.element.querySelector('.liga-fixture-date').textContent).toBe('Fecha TBD');
  });

  // ── botones ────────────────────────────────────────────────────────────

  test('isOwner=false muestra boton Unirse', () => {
    const p = createLigaPanel({ isOwner: false });
    p._setState({ loading: false, league: LEAGUE_DATA });
    expect(p.element.querySelector('.liga-join-btn')).not.toBeNull();
    expect(p.element.querySelector('.liga-create-team-btn')).toBeNull();
  });

  test('isOwner=true muestra boton Crear equipo', () => {
    const p = createLigaPanel({ isOwner: true });
    p._setState({ loading: false, league: LEAGUE_DATA });
    expect(p.element.querySelector('.liga-create-team-btn')).not.toBeNull();
    expect(p.element.querySelector('.liga-join-btn')).toBeNull();
  });

  test('click Unirse llama onJoin con leagueName', () => {
    const onJoin = vi.fn();
    const p = createLigaPanel({ isOwner: false, onJoin });
    p._setState({ loading: false, league: LEAGUE_DATA });
    p.element.querySelector('.liga-join-btn').click();
    expect(onJoin).toHaveBeenCalledWith('Liga MIIADT 2025');
  });

  test('click Unirse con liga sin leagueName usa Liga', () => {
    const onJoin = vi.fn();
    const p = createLigaPanel({ isOwner: false, onJoin });
    p._setState({ loading: false, league: { standings: [] } });
    p.element.querySelector('.liga-join-btn').click();
    expect(onJoin).toHaveBeenCalledWith('Liga');
  });

  test('click Crear equipo llama onCreateTeam', () => {
    const onCreateTeam = vi.fn();
    const p = createLigaPanel({ isOwner: true, onCreateTeam });
    p._setState({ loading: false, league: LEAGUE_DATA });
    p.element.querySelector('.liga-create-team-btn').click();
    expect(onCreateTeam).toHaveBeenCalled();
  });

  test('default onJoin — click no lanza error', () => {
    const p = createLigaPanel({ isOwner: false });
    p._setState({ loading: false, league: LEAGUE_DATA });
    expect(() => p.element.querySelector('.liga-join-btn').click()).not.toThrow();
  });

  test('default onCreateTeam — click no lanza error', () => {
    const p = createLigaPanel({ isOwner: true });
    p._setState({ loading: false, league: LEAGUE_DATA });
    expect(() => p.element.querySelector('.liga-create-team-btn').click()).not.toThrow();
  });

  // ── load ──────────────────────────────────────────────────────────────

  test('load sets league + loading=false', async () => {
    const fetchLeague = vi.fn().mockResolvedValue(LEAGUE_DATA);
    const p = createLigaPanel({ fetchLeague });
    await p.load();
    expect(p._state.league).toEqual(LEAGUE_DATA);
    expect(p._state.loading).toBe(false);
  });

  test('load error sets error + loading=false', async () => {
    const fetchLeague = vi.fn().mockRejectedValue(new Error('net fail'));
    const p = createLigaPanel({ fetchLeague });
    await p.load();
    expect(p._state.error).toBe('net fail');
    expect(p._state.loading).toBe(false);
  });

  test('load sin fetchLeague usa default (retorna null)', async () => {
    const p = createLigaPanel({});
    await p.load();
    expect(p._state.league).toBeNull();
  });

  test('load sin getToken usa default (token vacio)', async () => {
    const fetchLeague = vi.fn().mockResolvedValue(LEAGUE_DATA);
    const p = createLigaPanel({ fetchLeague });
    await p.load();
    expect(fetchLeague).toHaveBeenCalledWith('');
  });
});
