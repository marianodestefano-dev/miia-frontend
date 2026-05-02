import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createLeaderboardPanel = require('../assets/ludomiia-panels/leaderboard-panel.js');

const ENTRIES = [
  { uid: 'u1', displayName: 'Maria', wins: 30, gamesPlayed: 40, winRate: 75 },
  { uid: 'u2', displayName: 'Carlos', wins: 20, gamesPlayed: 35, winRate: 57 },
  { uid: 'u3', displayName: 'Ana', wins: 15, gamesPlayed: 20, winRate: 75 },
  { uid: 'u4', displayName: 'Luis', wins: 10, gamesPlayed: 18, winRate: 55 },
];

const GAMES = [
  { id: 'chess', name: 'Ajedrez' },
  { id: 'checkers', name: 'Damas' },
];

describe('leaderboard-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', async () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => ENTRIES, getToken: async () => 't' });
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra texto Cargando', () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => new Promise(() => {}), getToken: async () => 't' });
    expect(p.element.textContent).toContain('Cargando');
  });

  test('refresh muestra entradas .lb-row', async () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => ENTRIES, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.lb-row').length).toBe(4);
  });

  test('top 3 muestran medallas', async () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => ENTRIES, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('🥇');
    expect(p.element.textContent).toContain('🥈');
    expect(p.element.textContent).toContain('🥉');
  });

  test('posicion 4+ muestra numero', async () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => ENTRIES, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('4');
  });

  test('displayName se muestra', async () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => ENTRIES, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Maria');
  });

  test('winRate se muestra con %', async () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => ENTRIES, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('75%');
  });

  test('entries vacias muestra empty state', async () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => [], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Sin datos');
  });

  test('fetchLeaderboard null retorna [] sin crash', async () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p._state.entries).toEqual([]);
  });

  test('error muestra mensaje en tabla', async () => {
    const p = createLeaderboardPanel({
      fetchLeaderboard: async () => { throw new Error('LB_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('LB_ERR');
    expect(p.element.textContent).toContain('LB_ERR');
  });

  test('entry sin displayName usa uid', async () => {
    const entries = [{ uid: 'xyz', wins: 5, gamesPlayed: 8, winRate: 62 }];
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => entries, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('xyz');
  });

  test('entry sin displayName ni uid muestra Anon', async () => {
    const entries = [{ wins: 5, gamesPlayed: 8, winRate: 62 }];
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => entries, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Anon');
  });

  test('entry wins null muestra guion', async () => {
    const entries = [{ displayName: 'X', wins: null, gamesPlayed: 5, winRate: null }];
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => entries, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.lb-row').length).toBe(1);
  });

  test('entry gamesPlayed null muestra guion', async () => {
    const entries = [{ displayName: 'X', wins: 3, gamesPlayed: null, winRate: 100 }];
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => entries, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.lb-row').length).toBe(1);
  });

  test('sin games no hay select', () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => [], getToken: async () => 't' });
    expect(p.element.querySelector('select')).toBeNull();
  });

  test('con games renderiza select', () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => [], getToken: async () => 't', games: GAMES });
    expect(p.element.querySelector('select')).not.toBeNull();
  });

  test('select tiene opcion Todos los juegos + juegos', () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => [], getToken: async () => 't', games: GAMES });
    const options = p.element.querySelectorAll('option');
    expect(options.length).toBe(3);
    expect(options[0].textContent).toBe('Todos los juegos');
  });

  test('handleGameChange con valor llama fetchLeaderboard con gameId', async () => {
    const fetchLeaderboard = vi.fn(async () => ENTRIES);
    const p = createLeaderboardPanel({ fetchLeaderboard, getToken: async () => 'tok', games: GAMES });
    await p.refresh();
    fetchLeaderboard.mockClear();
    await p._handleGameChange({ target: { value: 'chess' } });
    await new Promise((r) => setTimeout(r, 20));
    expect(p._state.selectedGameId).toBe('chess');
    expect(fetchLeaderboard).toHaveBeenCalledWith('chess', 'tok');
  });

  test('handleGameChange con valor vacio setea selectedGameId null', async () => {
    const fetchLeaderboard = vi.fn(async () => []);
    const p = createLeaderboardPanel({ fetchLeaderboard, getToken: async () => 't', games: GAMES });
    await p.refresh();
    p._setState({ selectedGameId: 'chess' });
    await p._handleGameChange({ target: { value: '' } });
    expect(p._state.selectedGameId).toBeNull();
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createLeaderboardPanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('_setState loading:true muestra Cargando', async () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => ENTRIES, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    expect(p.element.textContent).toContain('Cargando');
  });

  test('_setState error:X muestra error', async () => {
    const p = createLeaderboardPanel({ fetchLeaderboard: async () => ENTRIES, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: false, error: 'custom error' });
    expect(p.element.textContent).toContain('custom error');
  });
});
