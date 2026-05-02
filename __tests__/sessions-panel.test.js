import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createSessionsPanel = require('../assets/ludomiia-panels/sessions-panel.js');

const ACTIVE_SESSION   = { id: 's1', gameId: 'Ajedrez',  status: 'active',    createdAt: '2026-05-01T10:00:00Z' };
const COMPLETED_SESSION= { id: 's2', gameId: 'Catan',    status: 'completed', createdAt: '2026-04-30T09:00:00Z' };
const SESSIONS = [ACTIVE_SESSION, COMPLETED_SESSION];

describe('sessions-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('crea element HTMLElement', () => {
    const p = createSessionsPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('tab bar visible inicialmente', () => {
    const p = createSessionsPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.sessions-tab-bar')).not.toBeNull();
  });

  test('loading=true muestra sessions-loading', () => {
    const p = createSessionsPanel({ getToken: async () => 't' });
    p._setState({ loading: true });
    expect(p.element.querySelector('.sessions-loading')).not.toBeNull();
  });

  test('loading inicial muestra sessions-loading', () => {
    const p = createSessionsPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.sessions-loading')).not.toBeNull();
  });

  test('load muestra partidas activas en tab active', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    expect(p.element.querySelectorAll('.session-card').length).toBe(1);
  });

  test('load muestra nombre del juego en tarjeta', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    expect(p.element.querySelector('.session-card-game').textContent).toBe('Ajedrez');
  });

  test('sesion activa muestra badge En progreso', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    expect(p.element.querySelector('.session-badge').textContent).toBe('En progreso');
  });

  test('sesion activa muestra boton Continuar', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    expect(p.element.querySelector('.session-continue-btn')).not.toBeNull();
  });

  test('click Continuar llama onContinueSession con id', async () => {
    const onContinueSession = vi.fn();
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, onContinueSession, getToken: async () => 't' });
    await p.load();
    p.element.querySelector('.session-continue-btn').click();
    expect(onContinueSession).toHaveBeenCalledWith('s1');
  });

  test('click tab Completadas muestra sesiones completadas', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    p.element.querySelector('.tab-completed-btn').click();
    expect(p._state.tab).toBe('completed');
    expect(p.element.querySelectorAll('.session-card').length).toBe(1);
  });

  test('sesion completada muestra badge Completada', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    p._setState({ tab: 'completed' });
    expect(p.element.querySelector('.session-badge').textContent).toBe('Completada');
  });

  test('sesion completada muestra boton Replay', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    p._setState({ tab: 'completed' });
    expect(p.element.querySelector('.session-replay-btn')).not.toBeNull();
  });

  test('click Replay llama onViewReplay con id', async () => {
    const onViewReplay = vi.fn();
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, onViewReplay, getToken: async () => 't' });
    await p.load();
    p._setState({ tab: 'completed' });
    p.element.querySelector('.session-replay-btn').click();
    expect(onViewReplay).toHaveBeenCalledWith('s2');
  });

  test('tab active sin sesiones muestra empty state activo', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => [COMPLETED_SESSION], getToken: async () => 't' });
    await p.load();
    expect(p.element.querySelector('.sessions-empty-msg').textContent).toContain('progreso');
  });

  test('tab completed sin sesiones muestra empty state completado', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => [ACTIVE_SESSION], getToken: async () => 't' });
    await p.load();
    p._setState({ tab: 'completed' });
    expect(p.element.querySelector('.sessions-empty-msg').textContent).toContain('completadas');
  });

  test('empty state activo muestra emoji 🎲', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => [], getToken: async () => 't' });
    await p.load();
    expect(p.element.querySelector('.sessions-empty-emoji').textContent).toBe('🎲');
  });

  test('empty state completado muestra emoji 🏆', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => [], getToken: async () => 't' });
    await p.load();
    p._setState({ tab: 'completed' });
    expect(p.element.querySelector('.sessions-empty-emoji').textContent).toBe('🏆');
  });

  test('click Ir a Biblioteca llama onGoToLibrary', async () => {
    const onGoToLibrary = vi.fn();
    const p = createSessionsPanel({ fetchSessions: async () => [], onGoToLibrary, getToken: async () => 't' });
    await p.load();
    p.element.querySelector('.sessions-go-library').click();
    expect(onGoToLibrary).toHaveBeenCalled();
  });

  test('tab activo muestra conteo cuando hay sesiones', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    expect(p.element.querySelector('.tab-active-btn').textContent).toContain('1');
  });

  test('tab completadas muestra conteo', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    expect(p.element.querySelector('.tab-completed-btn').textContent).toContain('1');
  });

  test('click tab activo mismo tab no cambia estado', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    p.element.querySelector('.tab-active-btn').click();
    expect(p._state.tab).toBe('active');
  });

  test('click tab completado mismo tab no cambia estado', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    p._setState({ tab: 'completed' });
    p.element.querySelector('.tab-completed-btn').click();
    expect(p._state.tab).toBe('completed');
  });

  test('fetchSessions sin array usa array vacio', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => null, getToken: async () => 't' });
    await p.load();
    expect(p._state.sessions).toEqual([]);
  });

  test('sesion sin gameId muestra string vacio', async () => {
    const s = { id: 's3', status: 'active', createdAt: '2026-01-01T00:00:00Z' };
    const p = createSessionsPanel({ fetchSessions: async () => [s], getToken: async () => 't' });
    await p.load();
    expect(p.element.querySelector('.session-card-game').textContent).toBe('');
  });

  test('_filterSessions separa activas y completadas', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    const filtered = p._filterSessions();
    expect(filtered.active.length).toBe(1);
    expect(filtered.completed.length).toBe(1);
  });

  test('opts null usa defaults — loading inicial', () => {
    const p = createSessionsPanel(null);
    expect(p.element.querySelector('.sessions-loading')).not.toBeNull();
  });

  test('default fetchSessions devuelve array vacio', async () => {
    const p = createSessionsPanel({ getToken: async () => 't' });
    await p.load();
    expect(p._state.sessions).toEqual([]);
  });

  test('default getToken ejecutado sin getToken', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS });
    await p.load();
    expect(p._state.sessions.length).toBe(2);
  });

  test('default onContinueSession no rompe', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    expect(() => p.element.querySelector('.session-continue-btn').click()).not.toThrow();
  });

  test('default onViewReplay no rompe', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    p._setState({ tab: 'completed' });
    expect(() => p.element.querySelector('.session-replay-btn').click()).not.toThrow();
  });

  test('default onGoToLibrary no rompe', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => [], getToken: async () => 't' });
    await p.load();
    expect(() => p.element.querySelector('.sessions-go-library').click()).not.toThrow();
  });

  test('click tab activo desde completado cambia a active', async () => {
    const p = createSessionsPanel({ fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.load();
    p._setState({ tab: 'completed' });
    p.element.querySelector('.tab-active-btn').click();
    expect(p._state.tab).toBe('active');
  });
});
