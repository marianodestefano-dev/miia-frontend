import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createSessionDetailPanel = require('../assets/ludomiia-panels/session-detail-panel.js');

const SESSION = {
  id: 's1',
  gameId: 'Ajedrez',
  mode: 'competitivo',
  status: 'active',
  startedAt: '2026-05-01T10:00:00Z',
};

describe('session-detail-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('crea element HTMLElement', () => {
    const p = createSessionDetailPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('estado inicial muestra not-found', () => {
    const p = createSessionDetailPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.not-found-state')).not.toBeNull();
  });

  test('loading=true muestra loading-state', () => {
    const p = createSessionDetailPanel({ getToken: async () => 't' });
    p._setState({ loading: true });
    expect(p.element.querySelector('.loading-state')).not.toBeNull();
    expect(p.element.querySelector('.loading-state').textContent).toContain('Cargando');
  });

  test('load muestra titulo tras cargar', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.load('s1');
    expect(p.element.querySelector('.session-detail-title').textContent).toContain('Ajedrez');
  });

  test('load muestra modo', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.load('s1');
    expect(p.element.querySelector('.session-detail-mode').textContent).toBe('competitivo');
  });

  test('load muestra status', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.load('s1');
    expect(p.element.querySelector('.session-detail-status').textContent).toBe('active');
  });

  test('load muestra fecha formateada', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.load('s1');
    expect(p.element.querySelector('.session-detail-date').textContent).toBeTruthy();
  });

  test('fetchSession null muestra not-found', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => null, getToken: async () => 't' });
    await p.load('s1');
    expect(p.element.querySelector('.not-found-state')).not.toBeNull();
  });

  test('boton Narrar visible tras cargar', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.load('s1');
    expect(p.element.querySelector('.narrate-btn')).not.toBeNull();
  });

  test('boton Terminar visible tras cargar', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.load('s1');
    expect(p.element.querySelector('.finish-btn')).not.toBeNull();
  });

  test('handleNarrate llama narrateSessionFn', async () => {
    const narrateSession = vi.fn(async () => ({ text: 'El rey avanza' }));
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, narrateSession, getToken: async () => 't' });
    await p.load('s1');
    await p._handleNarrate();
    expect(narrateSession).toHaveBeenCalledWith('s1', 't');
  });

  test('handleNarrate con text muestra narrate-text', async () => {
    const narrateSession = vi.fn(async () => ({ text: 'El rey avanza' }));
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, narrateSession, getToken: async () => 't' });
    await p.load('s1');
    await p._handleNarrate();
    expect(p.element.querySelector('.narrate-text').textContent).toBe('El rey avanza');
  });

  test('handleNarrate sin text muestra string vacio', async () => {
    const narrateSession = vi.fn(async () => ({}));
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, narrateSession, getToken: async () => 't' });
    await p.load('s1');
    await p._handleNarrate();
    expect(p._state.narrateText).toBe('');
  });

  test('handleNarrate error muestra mensaje de error', async () => {
    const narrateSession = vi.fn(async () => { throw new Error('NET'); });
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, narrateSession, getToken: async () => 't' });
    await p.load('s1');
    await p._handleNarrate();
    expect(p.element.querySelector('.narrate-text').textContent).toContain('Error');
  });

  test('handleNarrate re-entrancy guard', async () => {
    const narrateSession = vi.fn(async () => ({ text: 'X' }));
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, narrateSession, getToken: async () => 't' });
    await p.load('s1');
    p._state.narrateLoading = true;
    await p._handleNarrate();
    expect(narrateSession).not.toHaveBeenCalled();
  });

  test('handleNarrate sin sessionId no llama fn', async () => {
    const narrateSession = vi.fn(async () => ({ text: 'X' }));
    const p = createSessionDetailPanel({ narrateSession, getToken: async () => 't' });
    await p._handleNarrate();
    expect(narrateSession).not.toHaveBeenCalled();
  });

  test('handleNarrate con audioBase64 crea audio', async () => {
    const narrateSession = vi.fn(async () => ({
      audioBase64: btoa('fake-audio-bytes'),
      contentType: 'audio/mpeg',
    }));
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, narrateSession, getToken: async () => 't' });
    await p.load('s1');
    await p._handleNarrate();
    expect(p.element.querySelector('.narrate-audio')).not.toBeNull();
  });

  test('narrateLoading=true muestra Narrando en boton', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.load('s1');
    p._setState({ narrateLoading: true });
    expect(p.element.querySelector('.narrate-btn').textContent).toBe('Narrando...');
    expect(p.element.querySelector('.narrate-btn').disabled).toBe(true);
  });

  test('click Narrar dispara handleNarrate', async () => {
    const narrateSession = vi.fn(async () => ({ text: 'R' }));
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, narrateSession, getToken: async () => 't' });
    await p.load('s1');
    p.element.querySelector('.narrate-btn').click();
    await new Promise(r => setTimeout(r, 20));
    expect(narrateSession).toHaveBeenCalled();
  });

  test('handleFinish llama finishSessionFn y onFinish', async () => {
    const finishSession = vi.fn(async () => null);
    const onFinish = vi.fn();
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, finishSession, onFinish, getToken: async () => 't' });
    await p.load('s1');
    await p._handleFinish();
    expect(finishSession).toHaveBeenCalledWith('s1', 't');
    expect(onFinish).toHaveBeenCalled();
  });

  test('handleFinish re-entrancy guard', async () => {
    const finishSession = vi.fn(async () => null);
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, finishSession, getToken: async () => 't' });
    await p.load('s1');
    p._state.finishing = true;
    await p._handleFinish();
    expect(finishSession).not.toHaveBeenCalled();
  });

  test('handleFinish sin sessionId no llama fn', async () => {
    const finishSession = vi.fn(async () => null);
    const p = createSessionDetailPanel({ finishSession, getToken: async () => 't' });
    await p._handleFinish();
    expect(finishSession).not.toHaveBeenCalled();
  });

  test('handleFinish error no llama onFinish pero sale de finishing', async () => {
    const finishSession = vi.fn(async () => { throw new Error('FIN_ERR'); });
    const onFinish = vi.fn();
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, finishSession, onFinish, getToken: async () => 't' });
    await p.load('s1');
    await p._handleFinish();
    expect(onFinish).not.toHaveBeenCalled();
    expect(p._state.finishing).toBe(false);
  });

  test('finishing=true muestra Terminando en boton', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.load('s1');
    p._setState({ finishing: true });
    expect(p.element.querySelector('.finish-btn').textContent).toBe('Terminando...');
    expect(p.element.querySelector('.finish-btn').disabled).toBe(true);
  });

  test('click Terminar dispara handleFinish', async () => {
    const finishSession = vi.fn(async () => null);
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, finishSession, getToken: async () => 't' });
    await p.load('s1');
    p.element.querySelector('.finish-btn').click();
    await new Promise(r => setTimeout(r, 20));
    expect(finishSession).toHaveBeenCalled();
  });

  test('session sin gameId muestra string vacio en titulo', async () => {
    const s = { id: 's1', mode: 'x', status: 'active', startedAt: '2026-01-01T00:00:00Z' };
    const p = createSessionDetailPanel({ fetchSession: async () => s, getToken: async () => 't' });
    await p.load('s1');
    expect(p.element.querySelector('.session-detail-title').textContent).toBe('Sesion: ');
  });

  test('opts null usa defaults — muestra not-found', () => {
    const p = createSessionDetailPanel(null);
    expect(p.element.querySelector('.not-found-state')).not.toBeNull();
  });

  test('default fetchSession devuelve null — not-found', async () => {
    const p = createSessionDetailPanel({ getToken: async () => 't' });
    await p.load('s1');
    expect(p.element.querySelector('.not-found-state')).not.toBeNull();
  });

  test('default narrateSession ejecutado — narrateText vacio', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.load('s1');
    await p._handleNarrate();
    expect(p._state.narrateText).toBe('');
  });

  test('default finishSession ejecutado — onFinish llamado', async () => {
    const onFinish = vi.fn();
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, onFinish, getToken: async () => 't' });
    await p.load('s1');
    await p._handleFinish();
    expect(onFinish).toHaveBeenCalled();
  });

  test('default onFinish no rompe', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.load('s1');
    await expect(p._handleFinish()).resolves.not.toThrow();
  });

  test('default getToken ejecutado en load sin getToken', async () => {
    const p = createSessionDetailPanel({ fetchSession: async () => SESSION });
    await p.load('s1');
    expect(p._state.session).not.toBeNull();
  });
});
