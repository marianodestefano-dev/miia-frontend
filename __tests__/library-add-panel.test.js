import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createLibraryAddPanel = require('../assets/ludomiia-panels/library-add-panel.js');

const GAMES = [
  { id: 'g1', name: 'Ajedrez', type: 'competitivo' },
  { id: 'g2', name: 'Catan', type: 'competitivo' },
];

describe('library-add-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('crea element HTMLElement', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('no-owner muestra mensaje de no acceso', () => {
    const p = createLibraryAddPanel({ isOwner: false, getToken: async () => 't' });
    expect(p.element.querySelector('.no-access')).not.toBeNull();
    expect(p.element.querySelector('.no-access').textContent).toContain('owners');
  });

  test('no-owner _setState no crashea', () => {
    const p = createLibraryAddPanel({ isOwner: false, getToken: async () => 't' });
    expect(() => p._setState({ step: 1 })).not.toThrow();
  });

  test('step 0 inicial muestra Paso 1', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    expect(p.element.querySelector('.add-card').textContent).toContain('Paso 1');
  });

  test('barra de progreso tiene 3 pasos', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    expect(p.element.querySelectorAll('.progress-bar-step').length).toBe(3);
  });

  test('handleCheck busca y navega a step 1 si no existe', async () => {
    const p = createLibraryAddPanel({
      isOwner: true,
      fetchGames: async () => GAMES,
      getToken: async () => 't',
    });
    p._state.search = 'Dominos';
    await p._handleCheck();
    expect(p._state.found).toBe(false);
    expect(p._state.step).toBe(1);
    expect(p.element.querySelector('.add-card').textContent).toContain('Paso 2');
  });

  test('handleCheck muestra found=true si nombre existe', async () => {
    const p = createLibraryAddPanel({
      isOwner: true,
      fetchGames: async () => GAMES,
      getToken: async () => 't',
    });
    p._state.search = 'ajedrez';
    await p._handleCheck();
    expect(p._state.found).toBe(true);
    expect(p._state.step).toBe(0);
    expect(p.element.querySelector('.found-exists')).not.toBeNull();
  });

  test('found=false en step 0 muestra found-clear', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._state.found = false;
    p._state.step = 0;
    p._setState({});
    expect(p.element.querySelector('.found-clear')).not.toBeNull();
  });

  test('input de busqueda actualiza state.search', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    const input = p.element.querySelector('.add-search-input');
    input.value = 'Go';
    input.dispatchEvent(new Event('input'));
    expect(p._state.search).toBe('Go');
  });

  test('click Buscar dispara handleCheck', async () => {
    const fetchGames = vi.fn(async () => GAMES);
    const p = createLibraryAddPanel({ isOwner: true, fetchGames, getToken: async () => 't' });
    p._state.search = 'Go';
    p.element.querySelector('.add-search-btn').click();
    await new Promise(r => setTimeout(r, 20));
    expect(fetchGames).toHaveBeenCalled();
  });

  test('_setState step:1 muestra Paso 2', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 1 });
    expect(p.element.querySelector('.add-card').textContent).toContain('Paso 2');
  });

  test('step 1: input nombre actualiza form', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 1 });
    const inp = p.element.querySelector('.add-name-input');
    inp.value = 'Go';
    inp.dispatchEvent(new Event('input'));
    expect(p._state.form.name).toBe('Go');
  });

  test('step 1: input descripcion actualiza form', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 1 });
    const inp = p.element.querySelector('.add-desc-input');
    inp.value = 'Juego de estrategia';
    inp.dispatchEvent(new Event('input'));
    expect(p._state.form.description).toBe('Juego de estrategia');
  });

  test('step 1: select tipo actualiza form', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 1 });
    const sel = p.element.querySelector('.add-type-select');
    sel.value = 'cooperativo';
    sel.dispatchEvent(new Event('change'));
    expect(p._state.form.type).toBe('cooperativo');
  });

  test('step 1: input minPlayers actualiza form como numero', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 1 });
    const inp = p.element.querySelector('.add-min-input');
    inp.value = '3';
    inp.dispatchEvent(new Event('input'));
    expect(p._state.form.minPlayers).toBe(3);
  });

  test('step 1: input maxPlayers actualiza form', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 1 });
    const inp = p.element.querySelector('.add-max-input');
    inp.value = '6';
    inp.dispatchEvent(new Event('input'));
    expect(p._state.form.maxPlayers).toBe(6);
  });

  test('step 1: input avgDuration actualiza form', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 1 });
    const inp = p.element.querySelector('.add-dur-input');
    inp.value = '90';
    inp.dispatchEvent(new Event('input'));
    expect(p._state.form.avgDuration).toBe(90);
  });

  test('step 1: boton Atras vuelve a step 0', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 1 });
    p.element.querySelector('.add-back-btn').click();
    expect(p._state.step).toBe(0);
  });

  test('step 1: boton Preview avanza a step 2', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 1 });
    p.element.querySelector('.add-next-btn').click();
    expect(p._state.step).toBe(2);
  });

  test('step 2 muestra nombre del form', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._state.form.name = 'Go';
    p._setState({ step: 2 });
    expect(p.element.querySelector('.preview-card').textContent).toContain('Go');
  });

  test('step 2 muestra Sin nombre si form.name vacio', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._state.form.name = '';
    p._setState({ step: 2 });
    expect(p.element.querySelector('.preview-card').textContent).toContain('Sin nombre');
  });

  test('step 2 preview muestra tipo', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 2 });
    expect(p.element.querySelector('.preview-type').textContent).toBe('competitivo');
  });

  test('step 2 preview muestra jugadores', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 2 });
    expect(p.element.querySelector('.preview-players').textContent).toContain('jugadores');
  });

  test('step 2: boton Atras vuelve a step 1', () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 2 });
    p.element.querySelector('.add-back-btn2').click();
    expect(p._state.step).toBe(1);
  });

  test('handleSubmit llama addGameFn y onSuccess', async () => {
    const addGame = vi.fn(async () => null);
    const onSuccess = vi.fn();
    const p = createLibraryAddPanel({ isOwner: true, addGame, onSuccess, getToken: async () => 'tok' });
    p._setState({ step: 2 });
    await p._handleSubmit();
    expect(addGame).toHaveBeenCalledWith(p._state.form, 'tok');
    expect(onSuccess).toHaveBeenCalled();
  });

  test('handleSubmit re-entering (loading=true) no llama fn', async () => {
    const addGame = vi.fn();
    const p = createLibraryAddPanel({ isOwner: true, addGame, getToken: async () => 't' });
    p._state.loading = true;
    await p._handleSubmit();
    expect(addGame).not.toHaveBeenCalled();
  });

  test('handleSubmit error muestra submitError', async () => {
    const addGame = vi.fn(async () => { throw new Error('ADD_ERR'); });
    const p = createLibraryAddPanel({ isOwner: true, addGame, getToken: async () => 't' });
    p._setState({ step: 2 });
    await p._handleSubmit();
    expect(p._state.submitError).toBe('ADD_ERR');
    expect(p.element.querySelector('.submit-error').textContent).toBe('ADD_ERR');
  });

  test('loading=true en step 2 muestra Guardando y disabled', async () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._state.step = 2;
    p._state.loading = true;
    p._setState({});
    const btn = p.element.querySelector('.add-submit-btn');
    expect(btn.hasAttribute('disabled')).toBe(true);
    expect(btn.textContent).toBe('Guardando...');
  });

  test('click submit dispara handleSubmit', async () => {
    const addGame = vi.fn(async () => null);
    const p = createLibraryAddPanel({ isOwner: true, addGame, getToken: async () => 't' });
    p._setState({ step: 2 });
    p.element.querySelector('.add-submit-btn').click();
    await new Promise(r => setTimeout(r, 20));
    expect(addGame).toHaveBeenCalled();
  });

  test('game sin nombre en busqueda usa empty string', async () => {
    const p = createLibraryAddPanel({
      isOwner: true,
      fetchGames: async () => [{ id: 'g1' }],
      getToken: async () => 't',
    });
    p._state.search = 'algo';
    await p._handleCheck();
    expect(p._state.found).toBe(false);
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createLibraryAddPanel({ isOwner: true });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('default onSuccess no rompe al llamar', async () => {
    const p = createLibraryAddPanel({ isOwner: true, addGame: async () => null, getToken: async () => 't' });
    p._setState({ step: 2 });
    await expect(p._handleSubmit()).resolves.not.toThrow();
  });

  test('opts null usa defaults — isOwner false muestra no-access', () => {
    const p = createLibraryAddPanel(null);
    expect(p.element.querySelector('.no-access')).not.toBeNull();
  });

  test('default fetchGames ejecutado cuando _handleCheck sin fetchGames', async () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._state.search = 'xyz';
    await p._handleCheck();
    expect(p._state.found).toBe(false);
  });

  test('default getToken ejecutado cuando _handleCheck sin getToken', async () => {
    const p = createLibraryAddPanel({ isOwner: true, fetchGames: async () => [] });
    p._state.search = 'xyz';
    await p._handleCheck();
    expect(p._state.found).toBe(false);
  });

  test('default addGame ejecutado en _handleSubmit sin addGame', async () => {
    const p = createLibraryAddPanel({ isOwner: true, getToken: async () => 't' });
    p._setState({ step: 2 });
    await expect(p._handleSubmit()).resolves.not.toThrow();
  });

  test('handleSubmit error sin message usa fallback texto', async () => {
    const addGame = vi.fn(async () => { const e = new Error(); e.message = ''; throw e; });
    const p = createLibraryAddPanel({ isOwner: true, addGame, getToken: async () => 't' });
    p._setState({ step: 2 });
    await p._handleSubmit();
    expect(p._state.submitError).toBe('Error al guardar');
  });
});
