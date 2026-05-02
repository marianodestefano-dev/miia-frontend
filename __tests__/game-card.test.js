import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createGameCard = require('../assets/ludomiia-panels/game-card.js');

const GAME = {
  id: 'g1',
  name: 'Ajedrez',
  description: 'El clasico juego de estrategia',
  category: 'Estrategia',
  minPlayers: 2,
  maxPlayers: 2,
  multiplayer: false,
};

describe('game-card.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('crea element HTMLElement article', () => {
    const c = createGameCard(GAME);
    expect(c.element).toBeInstanceOf(HTMLElement);
    expect(c.element.tagName).toBe('ARTICLE');
  });

  test('muestra clase game-card-root', () => {
    const c = createGameCard(GAME);
    expect(c.element.className).toBe('game-card-root');
  });

  test('muestra inicial del nombre', () => {
    const c = createGameCard(GAME);
    expect(c.element.querySelector('.game-card-initial').textContent).toBe('A');
  });

  test('muestra nombre del juego', () => {
    const c = createGameCard(GAME);
    expect(c.element.querySelector('.game-card-name').textContent).toBe('Ajedrez');
  });

  test('muestra rango de jugadores', () => {
    const c = createGameCard(GAME);
    expect(c.element.querySelector('.game-card-players').textContent).toContain('jugadores');
  });

  test('muestra categoria', () => {
    const c = createGameCard(GAME);
    expect(c.element.querySelector('.game-card-category').textContent).toBe('Estrategia');
  });

  test('multiplayer=false no muestra badge Online', () => {
    const c = createGameCard(GAME);
    expect(c.element.querySelector('.badge-online')).toBeNull();
  });

  test('multiplayer=true muestra badge Online', () => {
    const c = createGameCard({ ...GAME, multiplayer: true });
    expect(c.element.querySelector('.badge-online')).not.toBeNull();
    expect(c.element.querySelector('.badge-online').textContent).toBe('Online');
  });

  test('desc-expanded oculta inicialmente', () => {
    const c = createGameCard(GAME);
    const el = c.element.querySelector('.game-card-desc-expanded');
    expect(el.style.display).toBe('none');
  });

  test('mouseenter muestra descripcion expandida', () => {
    const c = createGameCard(GAME);
    c.element.dispatchEvent(new Event('mouseenter'));
    expect(c.element.querySelector('.game-card-desc-expanded').style.display).toBe('');
  });

  test('mouseleave vuelve a ocultar descripcion', () => {
    const c = createGameCard(GAME);
    c.element.dispatchEvent(new Event('mouseenter'));
    c.element.dispatchEvent(new Event('mouseleave'));
    expect(c.element.querySelector('.game-card-desc-expanded').style.display).toBe('none');
  });

  test('descripcion expandida muestra texto', () => {
    const c = createGameCard(GAME);
    expect(c.element.querySelector('.game-card-desc-expanded').textContent).toBe('El clasico juego de estrategia');
  });

  test('boton CTA visible', () => {
    const c = createGameCard(GAME);
    expect(c.element.querySelector('.game-card-cta')).not.toBeNull();
  });

  test('click CTA llama onView con id', () => {
    const onView = vi.fn();
    const c = createGameCard({ ...GAME, onView });
    c.element.querySelector('.game-card-cta').click();
    expect(onView).toHaveBeenCalledWith('g1');
  });

  test('sin players no muestra game-card-players', () => {
    const c = createGameCard({ id: 'g1', name: 'X', description: 'D' });
    expect(c.element.querySelector('.game-card-players')).toBeNull();
  });

  test('solo minPlayers sin maxPlayers no muestra players', () => {
    const c = createGameCard({ id: 'g1', name: 'X', description: 'D', minPlayers: 2 });
    expect(c.element.querySelector('.game-card-players')).toBeNull();
  });

  test('sin categoria no muestra game-card-category', () => {
    const c = createGameCard({ id: 'g1', name: 'X', description: 'D' });
    expect(c.element.querySelector('.game-card-category')).toBeNull();
  });

  test('opts null usa defaults', () => {
    const c = createGameCard(null);
    expect(c.element).toBeInstanceOf(HTMLElement);
  });

  test('default onView no rompe', () => {
    const c = createGameCard({ id: 'g1', name: 'X', description: 'D' });
    expect(() => c.element.querySelector('.game-card-cta').click()).not.toThrow();
  });

  test('aria-label del CTA contiene nombre', () => {
    const c = createGameCard(GAME);
    expect(c.element.querySelector('.game-card-cta').getAttribute('aria-label')).toContain('Ajedrez');
  });

  test('nombre vacio muestra inicial vacia', () => {
    const c = createGameCard({ id: 'g1', name: '', description: 'D' });
    expect(c.element.querySelector('.game-card-initial').textContent).toBe('');
  });
});
