import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createDashboardHomePanel = require('../assets/ludomiia-panels/dashboard-home-panel.js');

const GAMES = [
  { id: 'g1', name: 'Ajedrez', description: 'El clasico juego de ajedrez estrategico', color: '#00e5ff' },
  { id: 'g2', name: 'Catan', description: 'Colonos de Catan construccion de asentamientos' },
  { id: 'g3', name: 'Pandemic', description: 'Juego cooperativo de enfermedades', color: '#7c3aed' },
  { id: 'g4', name: 'Uno', description: 'Juego de cartas familiar' },
];

const now = new Date();
const SESSIONS = [
  { id: 's1', gameId: 'g1', status: 'active', updatedAt: now.toISOString() },
  { id: 's2', gameId: 'g2', status: 'completed', updatedAt: now.toISOString() },
  { id: 's3', gameId: 'g3', status: 'completed', updatedAt: new Date(2020, 1, 1).toISOString() },
];

describe('dashboard-home-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('crea element HTMLElement', () => {
    const p = createDashboardHomePanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra Cargando dashboard', () => {
    const p = createDashboardHomePanel({ getToken: async () => 't' });
    expect(p.element.textContent).toContain('Cargando dashboard');
  });

  test('loading muestra 4 stat cards con ...', () => {
    const p = createDashboardHomePanel({ getToken: async () => 't' });
    const vals = p.element.querySelectorAll('.stat-value');
    expect(vals.length).toBe(4);
    vals.forEach(v => expect(v.textContent).toBe('...'));
  });

  test('displayName aparece en hero', () => {
    const p = createDashboardHomePanel({ displayName: 'Carlos', getToken: async () => 't' });
    expect(p.element.querySelector('.dashboard-hero').textContent).toContain('Carlos');
  });

  test('displayName default Jugador', () => {
    const p = createDashboardHomePanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.dashboard-hero').textContent).toContain('Jugador');
  });

  test('refresh carga games y sessions', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => SESSIONS,
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.games).toHaveLength(4);
    expect(p._state.sessions).toHaveLength(3);
    expect(p._state.loading).toBe(false);
  });

  test('4 stat cards tras refresh', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => SESSIONS,
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelectorAll('.stat-card').length).toBe(4);
  });

  test('stat Juegos muestra total games', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => [],
      getToken: async () => 't',
    });
    await p.refresh();
    const vals = [...p.element.querySelectorAll('.stat-value')];
    expect(vals[0].textContent).toBe('4');
  });

  test('stat En progreso muestra sesiones activas', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => [],
      fetchSessions: async () => SESSIONS,
      getToken: async () => 't',
    });
    await p.refresh();
    const vals = [...p.element.querySelectorAll('.stat-value')];
    expect(vals[2].textContent).toBe('1');
  });

  test('stat Completadas muestra sesiones completadas', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => [],
      fetchSessions: async () => SESSIONS,
      getToken: async () => 't',
    });
    await p.refresh();
    const vals = [...p.element.querySelectorAll('.stat-value')];
    expect(vals[3].textContent).toBe('2');
  });

  test('banner sesion activa visible cuando hay inProgress', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => SESSIONS,
      getToken: async () => 't',
    });
    await p.refresh();
    const banner = p.element.querySelector('.active-session-banner');
    expect(banner.style.display).not.toBe('none');
    expect(banner.textContent).toContain('ULTIMA PARTIDA');
  });

  test('banner muestra gameId de sesion activa', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => SESSIONS,
      getToken: async () => 't',
    });
    await p.refresh();
    const banner = p.element.querySelector('.active-session-banner');
    expect(banner.textContent).toContain('g1');
  });

  test('banner oculto cuando no hay sesiones activas', async () => {
    const completed = [{ id: 's1', gameId: 'g1', status: 'completed', updatedAt: new Date().toISOString() }];
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => completed,
      getToken: async () => 't',
    });
    await p.refresh();
    const banner = p.element.querySelector('.active-session-banner');
    expect(banner.style.display).toBe('none');
  });

  test('click Continuar llama onContinueSession con id sesion', async () => {
    const onContinue = vi.fn();
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => SESSIONS,
      getToken: async () => 't',
      onContinueSession: onContinue,
    });
    await p.refresh();
    p.element.querySelector('.continue-btn').click();
    expect(onContinue).toHaveBeenCalledWith('s1');
  });

  test('3 featured game cards (max 3)', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => [],
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelectorAll('.featured-game-card').length).toBe(3);
  });

  test('click Jugar en game card llama onPlayGame con gameId', async () => {
    const onPlay = vi.fn();
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => [],
      getToken: async () => 't',
      onPlayGame: onPlay,
    });
    await p.refresh();
    p.element.querySelector('.game-play-btn').click();
    expect(onPlay).toHaveBeenCalledWith('g1');
  });

  test('0 games muestra no-games message', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => [],
      fetchSessions: async () => [],
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelector('.no-games').textContent).toContain('No hay juegos');
  });

  test('1 game muestra 1 featured card', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => [GAMES[0]],
      fetchSessions: async () => [],
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelectorAll('.featured-game-card').length).toBe(1);
  });

  test('game sin descripcion no crashea', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => [{ id: 'g1', name: 'X' }],
      fetchSessions: async () => [],
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelectorAll('.featured-game-card').length).toBe(1);
  });

  test('fetchGames null → games=[]', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => null,
      fetchSessions: async () => null,
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.games).toEqual([]);
    expect(p._state.sessions).toEqual([]);
  });

  test('fetchGames rejected → games=[], sessions=[] (Promise.allSettled)', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => { throw new Error('NET'); },
      fetchSessions: async () => SESSIONS,
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.games).toEqual([]);
    expect(p._state.sessions).toHaveLength(3);
  });

  test('fetchSessions rejected → sessions=[]', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => { throw new Error('NET2'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.sessions).toEqual([]);
    expect(p._state.games).toHaveLength(4);
  });

  test('_setState loading:true muestra Cargando', async () => {
    const p = createDashboardHomePanel({ fetchGames: async () => GAMES, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    expect(p.element.textContent).toContain('Cargando dashboard');
  });

  test('_setState error muestra mensaje error', async () => {
    const p = createDashboardHomePanel({ fetchGames: async () => GAMES, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ error: 'DASH_ERR', loading: false });
    expect(p.element.querySelector('.error-state').textContent).toBe('DASH_ERR');
  });

  test('computeStats con sessions mixtas', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => SESSIONS,
      getToken: async () => 't',
    });
    await p.refresh();
    const stats = p._computeStats();
    expect(stats.inProgress).toBe(1);
    expect(stats.completed).toBe(2);
    expect(stats.games).toBe(4);
    expect(stats.featured).toHaveLength(3);
  });

  test('computeStats thisMonth solo cuenta completadas del mes actual', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => GAMES,
      fetchSessions: async () => SESSIONS,
      getToken: async () => 't',
    });
    await p.refresh();
    const stats = p._computeStats();
    expect(stats.thisMonth).toBe(1);
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createDashboardHomePanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('sesion activa sin gameId muestra string vacio', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => [],
      fetchSessions: async () => [{ id: 's1', status: 'active' }],
      getToken: async () => 't',
    });
    await p.refresh();
    const banner = p.element.querySelector('.active-session-banner');
    expect(banner.style.display).not.toBe('none');
  });

  test('session updatedAt faltante usa 0 en calculo mes', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => [],
      fetchSessions: async () => [{ id: 's1', status: 'completed' }],
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.sessions).toHaveLength(1);
  });

  test('session con createdAt y sin updatedAt se cuenta correctamente', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => [],
      fetchSessions: async () => [{ id: 's1', status: 'completed', createdAt: new Date().toISOString() }],
      getToken: async () => 't',
    });
    await p.refresh();
    const stats = p._computeStats();
    expect(stats.thisMonth).toBe(1);
  });

  test('game sin name muestra string vacio', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => [{ id: 'g1' }],
      fetchSessions: async () => [],
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelectorAll('.featured-game-card').length).toBe(1);
  });

  test('default onContinueSession (sin callback) no rompe al click Continuar', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => [],
      fetchSessions: async () => [{ id: 's1', status: 'active', gameId: 'g1' }],
      getToken: async () => 't',
    });
    await p.refresh();
    expect(() => p.element.querySelector('.continue-btn').click()).not.toThrow();
  });

  test('default onPlayGame (sin callback) no rompe al click Jugar', async () => {
    const p = createDashboardHomePanel({
      fetchGames: async () => [GAMES[0]],
      fetchSessions: async () => [],
      getToken: async () => 't',
    });
    await p.refresh();
    expect(() => p.element.querySelector('.game-play-btn').click()).not.toThrow();
  });
});
