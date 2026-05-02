import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createLibraryPanel = require('../assets/ludomiia-panels/library-panel.js');

const GAMES = [
  { id: 'g1', name: 'Ajedrez', type: 'competitivo', description: 'El clasico', minPlayers: 2, maxPlayers: 2, avgDuration: 60 },
  { id: 'g2', name: 'Catan', type: 'competitivo', description: 'Colonos', minPlayers: 3, maxPlayers: 4 },
  { id: 'g3', name: 'Pandemic', type: 'cooperativo', description: 'A' .repeat(90), minPlayers: 2, maxPlayers: 4, avgDuration: 45 },
  { id: 'g4', name: 'Solitario', type: 'solitario', minPlayers: 1, maxPlayers: 1 },
];

describe('library-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('crea element HTMLElement', () => {
    const p = createLibraryPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra Cargando', () => {
    const p = createLibraryPanel({ getToken: async () => 't' });
    expect(p.element.textContent).toContain('Cargando');
  });

  test('4 botones de filtro tipo', () => {
    const p = createLibraryPanel({ getToken: async () => 't' });
    expect(p.element.querySelectorAll('.type-btn').length).toBe(4);
  });

  test('refresh muestra juegos', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.game-card').length).toBe(4);
  });

  test('countEl muestra total juegos', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.library-count').textContent).toContain('4 juegos encontrados');
  });

  test('1 juego muestra singular encontrado', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [GAMES[0]], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.library-count').textContent).toContain('1 juego encontrado');
  });

  test('filter por tipo competitivo muestra 2 juegos', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    p._setState({ typeFilter: 'competitivo' });
    expect(p.element.querySelectorAll('.game-card').length).toBe(2);
  });

  test('click boton tipo cambia filtro y re-renderiza', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    const cooperativoBtn = [...p.element.querySelectorAll('.type-btn')].find(b => b.textContent === 'cooperativo');
    cooperativoBtn.click();
    expect(p._state.typeFilter).toBe('cooperativo');
    expect(p.element.querySelectorAll('.game-card').length).toBe(1);
  });

  test('busqueda filtra por nombre', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    const input = p.element.querySelector('.library-search');
    input.value = 'catan';
    input.dispatchEvent(new Event('input'));
    expect(p.element.querySelectorAll('.game-card').length).toBe(1);
  });

  test('busqueda sin resultados muestra empty-state', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    const input = p.element.querySelector('.library-search');
    input.value = 'zzznoencontrado';
    input.dispatchEvent(new Event('input'));
    expect(p.element.querySelector('.empty-state').textContent).toContain('No se encontraron');
  });

  test('game con type muestra badge', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.game-type-badge').length).toBe(4);
  });

  test('game sin type no muestra badge', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [{ id: 'g1', name: 'X' }], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.game-type-badge').length).toBe(0);
  });

  test('game con minPlayers y maxPlayers iguales no muestra rango', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [GAMES[0]], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.game-players').textContent).toContain('2 jugadores');
    expect(p.element.querySelector('.game-players').textContent).not.toContain('2-2');
  });

  test('game con minPlayers y maxPlayers distintos muestra rango', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [GAMES[1]], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.game-players').textContent).toContain('3-4 jugadores');
  });

  test('game con avgDuration muestra duracion', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [GAMES[0]], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.game-players').textContent).toContain('60 min');
  });

  test('game sin avgDuration no muestra min', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [GAMES[1]], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.game-players').textContent).not.toContain('min');
  });

  test('game sin minPlayers no muestra .game-players', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [{ id: 'g1', name: 'X' }], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.game-players')).toBeNull();
  });

  test('game con descripcion larga trunca en 80 chars + ...', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [GAMES[2]], getToken: async () => 't' });
    await p.refresh();
    const desc = p.element.querySelector('.game-desc');
    expect(desc.textContent.length).toBeLessThanOrEqual(84);
    expect(desc.textContent).toContain('...');
  });

  test('game con descripcion corta no agrega ...', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [GAMES[0]], getToken: async () => 't' });
    await p.refresh();
    const desc = p.element.querySelector('.game-desc');
    expect(desc.textContent).not.toContain('...');
  });

  test('game sin descripcion no muestra .game-desc', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [GAMES[3]], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.game-desc')).toBeNull();
  });

  test('click en card llama onSelectGame', async () => {
    const onSelect = vi.fn();
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't', onSelectGame: onSelect });
    await p.refresh();
    p.element.querySelector('.game-card').click();
    expect(onSelect).toHaveBeenCalledWith(GAMES[0]);
  });

  test('click boton Jugar llama onSetupGame', async () => {
    const onSetup = vi.fn();
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't', onSetupGame: onSetup });
    await p.refresh();
    p.element.querySelector('.game-play-btn').click();
    expect(onSetup).toHaveBeenCalledWith(GAMES[0]);
  });

  test('click boton Ver llama onSelectGame', async () => {
    const onSelect = vi.fn();
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't', onSelectGame: onSelect });
    await p.refresh();
    p.element.querySelector('.game-detail-btn').click();
    expect(onSelect).toHaveBeenCalledWith(GAMES[0]);
  });

  test('isOwner=true muestra FAB agregar', () => {
    const p = createLibraryPanel({ isOwner: true, getToken: async () => 't' });
    expect(p.element.querySelector('.library-fab')).not.toBeNull();
  });

  test('isOwner=false no muestra FAB', () => {
    const p = createLibraryPanel({ isOwner: false, getToken: async () => 't' });
    expect(p.element.querySelector('.library-fab')).toBeNull();
  });

  test('click FAB llama onAddGame', async () => {
    const onAdd = vi.fn();
    const p = createLibraryPanel({ isOwner: true, getToken: async () => 't', onAddGame: onAdd });
    p.element.querySelector('.library-fab').click();
    expect(onAdd).toHaveBeenCalled();
  });

  test('fetchGames null → games=[]', async () => {
    const p = createLibraryPanel({ fetchGames: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p._state.games).toEqual([]);
  });

  test('0 juegos muestra empty-state', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.empty-state')).not.toBeNull();
  });

  test('_setState error muestra error-state', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    p._setState({ error: 'LIB_ERR', loading: false });
    expect(p.element.querySelector('.error-state').textContent).toBe('LIB_ERR');
  });

  test('_setState loading:true muestra Cargando', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    expect(p.element.textContent).toContain('Cargando');
  });

  test('game sin name muestra string vacio', async () => {
    const p = createLibraryPanel({ fetchGames: async () => [{ id: 'g1' }], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.game-card').length).toBe(1);
  });

  test('filterGames devuelve array filtrado correctamente', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    p._state.search = 'ajedrez';
    const filtered = p._filterGames();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Ajedrez');
  });

  test('_renderFilters actualiza clases de botones', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    p._state.typeFilter = 'cooperativo';
    p._renderFilters();
    const cooperativoBtn = [...p.element.querySelectorAll('.type-btn')].find(b => b.textContent === 'cooperativo');
    expect(cooperativoBtn.className).toContain('btn-primary');
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createLibraryPanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('default onSelectGame no rompe al click', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    expect(() => p.element.querySelector('.game-card').click()).not.toThrow();
  });

  test('default onSetupGame no rompe al click Jugar', async () => {
    const p = createLibraryPanel({ fetchGames: async () => GAMES, getToken: async () => 't' });
    await p.refresh();
    expect(() => p.element.querySelector('.game-play-btn').click()).not.toThrow();
  });

  test('default onAddGame no rompe al click FAB', () => {
    const p = createLibraryPanel({ isOwner: true, getToken: async () => 't' });
    expect(() => p.element.querySelector('.library-fab').click()).not.toThrow();
  });
});
