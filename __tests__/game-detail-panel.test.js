import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createGameDetailPanel = require('../assets/ludomiia-panels/game-detail-panel.js');

const GAME_FULL = {
  id: 'g1',
  name: 'Ajedrez',
  description: 'El clasico juego de estrategia milenario',
  category: 'Estrategia',
  minPlayers: 2,
  maxPlayers: 2,
  rules: 'Cada pieza tiene su propio movimiento...',
  expansions: [
    { id: 'e1', name: 'Variante Fischer', description: 'Chess960' },
    { id: 'e2', name: 'Ajedrez rapido' },
  ],
};

const GAME_MINIMAL = {
  id: 'g2',
  name: 'Go',
};

describe('game-detail-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('crea element HTMLElement', () => {
    const p = createGameDetailPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('boton Volver visible inicialmente', () => {
    const p = createGameDetailPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.back-btn')).not.toBeNull();
  });

  test('click Volver llama onBack', () => {
    const onBack = vi.fn();
    const p = createGameDetailPanel({ onBack, getToken: async () => 't' });
    p.element.querySelector('.back-btn').click();
    expect(onBack).toHaveBeenCalled();
  });

  test('estado inicial sin game muestra not-found', () => {
    const p = createGameDetailPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.not-found-state')).not.toBeNull();
  });

  test('loading=true muestra loading-state', () => {
    const p = createGameDetailPanel({ getToken: async () => 't' });
    p._setState({ loading: true });
    expect(p.element.querySelector('.loading-state')).not.toBeNull();
    expect(p.element.querySelector('.loading-state').textContent).toContain('Cargando');
  });

  test('load muestra titulo del juego tras cargar', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_FULL, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelector('.game-detail-title').textContent).toBe('Ajedrez');
  });

  test('load muestra categoria', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_FULL, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelector('.game-detail-meta').textContent).toContain('Estrategia');
  });

  test('load muestra jugadores', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_FULL, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelector('.game-detail-meta').textContent).toContain('jugadores');
  });

  test('load muestra descripcion', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_FULL, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelector('.game-detail-desc').textContent).toContain('clasico');
  });

  test('load muestra reglas', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_FULL, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelector('.game-rules').textContent).toContain('pieza');
  });

  test('load muestra expansion-items', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_FULL, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelectorAll('.expansion-item').length).toBe(2);
  });

  test('expansion con descripcion muestra texto', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_FULL, getToken: async () => 't' });
    await p.load('g1');
    const items = p.element.querySelectorAll('.expansion-item');
    expect(items[0].textContent).toContain('Chess960');
  });

  test('expansion sin descripcion no muestra separador', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_FULL, getToken: async () => 't' });
    await p.load('g1');
    const items = p.element.querySelectorAll('.expansion-item');
    expect(items[1].textContent).not.toContain(' — ');
  });

  test('juego sin nombre muestra string vacio en titulo', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => ({ id: 'g1' }), getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelector('.game-detail-title').textContent).toBe('');
  });

  test('juego sin category ni players no muestra meta', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_MINIMAL, getToken: async () => 't' });
    await p.load('g2');
    expect(p.element.querySelector('.game-detail-meta')).toBeNull();
  });

  test('juego con solo category muestra meta', async () => {
    const g = { id: 'g1', name: 'X', category: 'Abstracto' };
    const p = createGameDetailPanel({ fetchGame: async () => g, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelector('.game-detail-meta').textContent).toContain('Abstracto');
  });

  test('juego con solo players muestra meta', async () => {
    const g = { id: 'g1', name: 'X', minPlayers: 2, maxPlayers: 4 };
    const p = createGameDetailPanel({ fetchGame: async () => g, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelector('.game-detail-meta').textContent).toContain('jugadores');
  });

  test('juego sin descripcion no muestra game-detail-desc', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_MINIMAL, getToken: async () => 't' });
    await p.load('g2');
    expect(p.element.querySelector('.game-detail-desc')).toBeNull();
  });

  test('juego sin reglas no muestra game-rules-section', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_MINIMAL, getToken: async () => 't' });
    await p.load('g2');
    expect(p.element.querySelector('.game-rules-section')).toBeNull();
  });

  test('juego sin expansiones no muestra game-expansions-section', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_MINIMAL, getToken: async () => 't' });
    await p.load('g2');
    expect(p.element.querySelector('.game-expansions-section')).toBeNull();
  });

  test('juego con expansiones vacias no muestra seccion', async () => {
    const g = { id: 'g1', name: 'X', expansions: [] };
    const p = createGameDetailPanel({ fetchGame: async () => g, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelector('.game-expansions-section')).toBeNull();
  });

  test('boton Iniciar partida visible tras cargar', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_FULL, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelector('.game-start-btn')).not.toBeNull();
  });

  test('click Iniciar llama onStartSession con gameId', async () => {
    const onStartSession = vi.fn();
    const p = createGameDetailPanel({ fetchGame: async () => GAME_FULL, getToken: async () => 't', onStartSession });
    await p.load('g1');
    p.element.querySelector('.game-start-btn').click();
    expect(onStartSession).toHaveBeenCalledWith('g1');
  });

  test('fetchGame retorna null → muestra not-found', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => null, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelector('.not-found-state')).not.toBeNull();
  });

  test('_setState error muestra error-state', async () => {
    const p = createGameDetailPanel({ getToken: async () => 't' });
    p._setState({ error: 'GAME_ERR', loading: false });
    expect(p.element.querySelector('.error-state').textContent).toBe('GAME_ERR');
  });

  test('default callbacks no rompen', async () => {
    const p = createGameDetailPanel(null);
    await p.load('x');
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('default onBack no rompe al click', () => {
    const p = createGameDetailPanel({ getToken: async () => 't' });
    expect(() => p.element.querySelector('.back-btn').click()).not.toThrow();
  });

  test('default onStartSession no rompe al click Iniciar', async () => {
    const p = createGameDetailPanel({ fetchGame: async () => GAME_FULL, getToken: async () => 't' });
    await p.load('g1');
    expect(() => p.element.querySelector('.game-start-btn').click()).not.toThrow();
  });

  test('expansion sin nombre muestra string vacio', async () => {
    const g = { id: 'g1', name: 'X', expansions: [{ id: 'e1' }] };
    const p = createGameDetailPanel({ fetchGame: async () => g, getToken: async () => 't' });
    await p.load('g1');
    expect(p.element.querySelectorAll('.expansion-item').length).toBe(1);
  });
});
