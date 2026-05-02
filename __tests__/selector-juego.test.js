import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createSelectorJuegoPanel = require('../assets/ludomiia-panels/selector-juego.js');

describe('selector-juego.js panel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('createSelectorJuegoPanel sin opts crea root vacio', async () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
    expect(p.element.querySelector('input.input')).not.toBeNull();
  });

  test('refresh con games render cards', async () => {
    const games = [
      { id: 'g1', name: 'Catan', type: 'competitivo', minPlayers: 3, maxPlayers: 4, avgDuration: 90, description: 'Comercio en isla', color: '#fc0' },
      { id: 'g2', name: 'Pandemic', type: 'cooperativo', minPlayers: 2, description: 'Salvar mundo' },
    ];
    const p = createSelectorJuegoPanel({
      fetchGames: async () => games,
      getToken: async () => 'tok',
      isOwner: false,
    });
    await p.refresh();
    const cards = p.element.querySelectorAll('.card');
    expect(cards.length).toBe(2);
  });

  test('search filtra', async () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    p._setState({ games: [{ id: '1', name: 'Catan' }, { id: '2', name: 'Pandemic' }], loading: false, search: 'cat', typeFilter: 'Todos' });
    const cards = p.element.querySelectorAll('.card');
    expect(cards.length).toBe(1);
  });

  test('typeFilter filtra', async () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    p._setState({
      games: [{ id: '1', name: 'A', type: 'competitivo' }, { id: '2', name: 'B', type: 'cooperativo' }],
      loading: false, search: '', typeFilter: 'cooperativo',
    });
    const cards = p.element.querySelectorAll('.card');
    expect(cards.length).toBe(1);
  });

  test('typeFilter Todos no filtra', async () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    p._setState({ games: [{ id: '1' }, { id: '2' }], loading: false, search: '', typeFilter: 'Todos' });
    expect(p.element.querySelectorAll('.card').length).toBe(2);
  });

  test('empty state cuando no hay games', async () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    p._setState({ games: [], loading: false });
    const msg = p.element.querySelector('p[style*="grid-column"]');
    expect(msg).not.toBeNull();
    expect(msg.textContent).toContain('No tenes juegos');
  });

  test('empty state filtrado cuando no hay match', async () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    p._setState({ games: [{ id: '1', name: 'X' }], loading: false, search: 'zzz', typeFilter: 'Todos' });
    const msg = p.element.querySelector('p[style*="grid-column"]');
    expect(msg.textContent).toContain('No hay juegos');
  });

  test('loading skeleton', async () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    p._setState({ loading: true });
    expect(p.element.querySelectorAll('.card').length).toBe(8);
  });

  test('isOwner agrega FAB', async () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't', isOwner: true });
    const fab = p.element.querySelector('button[title="Agregar juego"]');
    expect(fab).not.toBeNull();
  });

  test('FAB onClick dispara onAddGame', async () => {
    const onAddGame = vi.fn();
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't', isOwner: true, onAddGame });
    p.element.querySelector('button[title="Agregar juego"]').click();
    expect(onAddGame).toHaveBeenCalled();
  });

  test('click en card dispara onSelect', async () => {
    const onSelect = vi.fn();
    const p = createSelectorJuegoPanel({ fetchGames: async () => [{ id: 'g1', name: 'Catan' }], getToken: async () => 't', onSelect });
    await p.refresh();
    p.element.querySelector('.card').click();
    expect(onSelect).toHaveBeenCalledWith({ id: 'g1', name: 'Catan' });
  });

  test('click Jugar dispara onStart (stopPropagation)', async () => {
    const onStart = vi.fn();
    const onSelect = vi.fn();
    const p = createSelectorJuegoPanel({ fetchGames: async () => [{ id: 'g1', name: 'Catan' }], getToken: async () => 't', onSelect, onStart });
    await p.refresh();
    const card = p.element.querySelector('.card');
    const playBtn = card.querySelector('.btn-primary.btn-sm');
    playBtn.click();
    expect(onStart).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('click Ver dispara onSelect (stopPropagation)', async () => {
    const onStart = vi.fn();
    const onSelect = vi.fn();
    const p = createSelectorJuegoPanel({ fetchGames: async () => [{ id: 'g1', name: 'Catan' }], getToken: async () => 't', onSelect, onStart });
    await p.refresh();
    const card = p.element.querySelector('.card');
    const viewBtn = card.querySelector('.btn-ghost.btn-sm');
    viewBtn.click();
    expect(onSelect).toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
  });

  test('refresh con error → empty state', async () => {
    const p = createSelectorJuegoPanel({
      fetchGames: async () => { throw new Error('FETCH_FAIL'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelectorAll('.card').length).toBe(0);
  });

  test('refresh con response no-array → empty array fallback', async () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.card').length).toBe(0);
  });

  test('input search dispara render', async () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [{ id: '1', name: 'Catan' }], getToken: async () => 't' });
    await p.refresh();
    const input = p.element.querySelector('input.input');
    input.value = 'pandemic';
    input.dispatchEvent(new Event('input'));
    expect(p.element.querySelectorAll('.card').length).toBe(0);
  });

  test('filter button click dispara render + activa filter', async () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [{ id: '1', name: 'A', type: 'cooperativo' }], getToken: async () => 't' });
    await p.refresh();
    const buttons = p.element.querySelectorAll('button.btn-ghost.btn-sm, button.btn-primary.btn-sm');
    const competitivoBtn = Array.from(buttons).find((b) => b.textContent === 'competitivo');
    competitivoBtn.click();
    expect(competitivoBtn.className).toContain('btn-primary');
    expect(p.element.querySelectorAll('.card').length).toBe(0);
  });

  test('renderGameCard sin game.name fallback', () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    const card = p._renderGameCard({}, { onSelect: () => {}, onStart: () => {} });
    expect(card.querySelector('h3').textContent).toBe('Sin nombre');
  });

  test('renderGameCard con type pero sin minPlayers', () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    const card = p._renderGameCard({ name: 'X', type: 'competitivo' }, { onSelect: () => {}, onStart: () => {} });
    expect(card.querySelector('.badge')).not.toBeNull();
    expect(card.querySelectorAll('p').length).toBeLessThanOrEqual(1);
  });

  test('renderGameCard con minPlayers y maxPlayers iguales no muestra rango', () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    const card = p._renderGameCard({ name: 'X', minPlayers: 2, maxPlayers: 2 }, { onSelect: () => {}, onStart: () => {} });
    expect(card.textContent).toContain('2 jugadores');
    expect(card.textContent).not.toContain('-');
  });

  test('renderGameCard description >80 chars usa ellipsis', () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    const longDesc = 'a'.repeat(120);
    const card = p._renderGameCard({ name: 'X', description: longDesc }, { onSelect: () => {}, onStart: () => {} });
    expect(card.textContent).toContain('...');
  });

  test('renderGameCard color custom', () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    const card = p._renderGameCard({ name: 'X', color: '#abc' }, { onSelect: () => {}, onStart: () => {} });
    const stripe = card.querySelector('div[style*="height"]');
    expect(stripe.style.background).toContain('#abc');
  });

  test('_applyFilters search vacio + Todos retorna todos', () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    const r = p._applyFilters([{ name: 'A' }, { name: 'B' }], '', 'Todos');
    expect(r.length).toBe(2);
  });

  test('_applyFilters typeFilter vacio == undefined', () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    const r = p._applyFilters([{ name: 'A' }], '', '');
    expect(r.length).toBe(1);
  });

  test('_applyFilters game sin name', () => {
    const p = createSelectorJuegoPanel({ fetchGames: async () => [], getToken: async () => 't' });
    const r = p._applyFilters([{}], 'x', 'Todos');
    expect(r.length).toBe(0);
  });

  test('callbacks default no-op no rompen', () => {
    const p = createSelectorJuegoPanel({});
    expect(typeof p.refresh).toBe('function');
    // Defaults: getToken = async () => '', fetchGames = async () => []
  });

  test('refresh con default fetchGames retorna []', async () => {
    const p = createSelectorJuegoPanel({});
    await p.refresh();
    expect(p.element.querySelectorAll('.card').length).toBe(0);
  });
});
