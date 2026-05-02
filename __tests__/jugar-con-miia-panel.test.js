import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createJugarConMiiaPanel = require('../assets/ludomiia-panels/jugar-con-miia-panel.js');

const SESSION = {
  id: 's1', gameName: 'Catan', status: 'active',
  players: [{ uid: 'u1', name: 'Player1' }],
  startedAt: '2026-05-02T15:00:00Z',
  messages: [
    { role: 'user', content: 'Que hago?', timestamp: '2026-05-02T15:01:00Z' },
    { role: 'assistant', content: 'Te recomiendo construir.', timestamp: '2026-05-02T15:01:05Z' },
  ],
};

describe('jugar-con-miia-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', () => {
    const p = createJugarConMiiaPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading state muestra skeleton', () => {
    const p = createJugarConMiiaPanel({ getToken: async () => 't' });
    expect(p.element.querySelectorAll('.card').length).toBeGreaterThanOrEqual(1);
  });

  test('loading deshabilita input + botones', () => {
    const p = createJugarConMiiaPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('input').hasAttribute('disabled')).toBe(true);
    expect(p.element.querySelector('button[title="Terminar partida"]').hasAttribute('disabled')).toBe(true);
  });

  test('refresh con session muestra gameName', async () => {
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('h2').textContent).toBe('Catan');
  });

  test('session activa muestra badge En juego', async () => {
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.refresh();
    const badge = p.element.querySelector('.badge');
    expect(badge.textContent).toBe('En juego');
  });

  test('session ended muestra badge Finalizada', async () => {
    const p = createJugarConMiiaPanel({
      fetchSession: async () => ({ ...SESSION, status: 'ended' }),
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelector('.badge').textContent).toBe('Finalizada');
  });

  test('session activa habilita input y botones', async () => {
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('input').hasAttribute('disabled')).toBe(false);
    expect(p.element.querySelector('button[title="Terminar partida"]').hasAttribute('disabled')).toBe(false);
  });

  test('session ended deshabilita controles', async () => {
    const p = createJugarConMiiaPanel({
      fetchSession: async () => ({ ...SESSION, status: 'ended' }),
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelector('input').hasAttribute('disabled')).toBe(true);
  });

  test('mensajes se renderizan en body', async () => {
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.msg-user').length).toBe(1);
    expect(p.element.querySelectorAll('.msg-miia').length).toBe(1);
  });

  test('sin mensajes muestra empty state', async () => {
    const p = createJugarConMiiaPanel({
      fetchSession: async () => ({ ...SESSION, messages: [] }),
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.textContent).toContain('Empieza la partida');
  });

  test('handleSend vacio no envia', async () => {
    const sendMessage = vi.fn();
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, sendMessage, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = '';
    await p._handleSend();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('handleSend con mensaje llama sendMessage', async () => {
    const updated = { ...SESSION, messages: [...SESSION.messages, { role: 'user', content: 'Hola', timestamp: '' }] };
    const sendMessage = vi.fn(async () => updated);
    const p = createJugarConMiiaPanel({ sessionId: 's1', fetchSession: async () => SESSION, sendMessage, getToken: async () => 'tok' });
    await p.refresh();
    p.element.querySelector('input').value = 'Hola';
    await p._handleSend();
    expect(sendMessage).toHaveBeenCalledWith('s1', 'Hola', 'tok');
  });

  test('sendMessage actualiza session con respuesta', async () => {
    const updated = { ...SESSION, messages: [...SESSION.messages, { role: 'assistant', content: 'Resp', timestamp: '' }] };
    const sendMessage = vi.fn(async () => updated);
    const p = createJugarConMiiaPanel({ sessionId: 's1', fetchSession: async () => SESSION, sendMessage, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'test';
    await p._handleSend();
    expect(p._state.session.messages.length).toBe(3);
  });

  test('sendMessage error muestra sendError', async () => {
    const sendMessage = vi.fn(async () => { throw new Error('NET_ERR'); });
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, sendMessage, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'test';
    await p._handleSend();
    expect(p._state.sendError).toBe('NET_ERR');
  });

  test('Enter key dispara handleSend', async () => {
    const sendMessage = vi.fn(async () => null);
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, sendMessage, getToken: async () => 't' });
    await p.refresh();
    const input = p.element.querySelector('input');
    input.value = 'Hola';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
    expect(sendMessage).toHaveBeenCalled();
  });

  test('click boton Enviar dispara handleSend', async () => {
    const sendMessage = vi.fn(async () => null);
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, sendMessage, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'test';
    p.element.querySelector('.btn-primary.btn-sm').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(sendMessage).toHaveBeenCalled();
  });

  test('click boton Terminar partida dispara endGame', async () => {
    const endGame = vi.fn(async () => null);
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, endGame, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('button[title="Terminar partida"]').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(endGame).toHaveBeenCalled();
  });

  test('handleEnd llama endGameFn y dispara onEnd', async () => {
    const endGame = vi.fn(async () => ({ score: 42 }));
    const onEnd = vi.fn();
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, endGame, onEnd, getToken: async () => 't' });
    await p.refresh();
    await p._handleEnd();
    expect(endGame).toHaveBeenCalledWith(null, 't');
    expect(onEnd).toHaveBeenCalledWith({ score: 42 });
  });

  test('handleEnd marca session como ended', async () => {
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, endGame: async () => null, getToken: async () => 't' });
    await p.refresh();
    await p._handleEnd();
    expect(p._state.session.status).toBe('ended');
  });

  test('handleEnd error muestra sendError', async () => {
    const endGame = vi.fn(async () => { throw new Error('END_FAIL'); });
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, endGame, getToken: async () => 't' });
    await p.refresh();
    await p._handleEnd();
    expect(p._state.sendError).toBe('END_FAIL');
  });

  test('handleSend guardado re-entering (sending=true)', async () => {
    const sendMessage = vi.fn(async () => SESSION);
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, sendMessage, getToken: async () => 't' });
    await p.refresh();
    p._setState({ sending: true });
    p.element.querySelector('input').value = 'test';
    await p._handleSend();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('handleEnd guardado re-entering (ending=true)', async () => {
    const endGame = vi.fn(async () => null);
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, endGame, getToken: async () => 't' });
    await p.refresh();
    p._setState({ ending: true });
    await p._handleEnd();
    expect(endGame).not.toHaveBeenCalled();
  });

  test('refresh con error muestra estado error', async () => {
    const p = createJugarConMiiaPanel({
      fetchSession: async () => { throw new Error('FETCH_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('FETCH_ERR');
    expect(p.element.textContent).toContain('Error');
  });

  test('session null → gameName fallback "Partida"', async () => {
    const p = createJugarConMiiaPanel({ fetchSession: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('h2').textContent).toBe('Partida');
  });

  test('sendMessage response null no rompe', async () => {
    const sendMessage = vi.fn(async () => null);
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, sendMessage, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'test';
    await p._handleSend();
    expect(p._state.sendError).toBeNull();
  });

  test('callbacks default sin opts no rompen (opts undefined)', async () => {
    const p = createJugarConMiiaPanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('default onEnd no-op invocado', async () => {
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, endGame: async () => null, getToken: async () => 't' });
    await p.refresh();
    await expect(p._handleEnd()).resolves.not.toThrow();
  });

  test('default sendMessage no-op — click Enviar sin callback', async () => {
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'test';
    p.element.querySelector('.btn-primary.btn-sm').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(p._state.sendError).toBeNull();
  });

  test('default endGame no-op — click Terminar sin callback', async () => {
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('button[title="Terminar partida"]').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(p._state.sendError).toBeNull();
  });

  test('_setState loading:true re-muestra skeleton', async () => {
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    expect(p.element.querySelectorAll('.card').length).toBeGreaterThanOrEqual(1);
  });

  test('fmtTime timestamp formateado en mensaje', async () => {
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, getToken: async () => 't' });
    await p.refresh();
    const spans = p.element.querySelectorAll('span');
    const timeSpan = Array.from(spans).find((s) => /^\d{1,2}:\d{2}/.test(s.textContent));
    expect(timeSpan).not.toBeNull();
  });

  test('handleSend con sessionId especifico', async () => {
    const sendMessage = vi.fn(async () => null);
    const p = createJugarConMiiaPanel({ sessionId: 'mySession', fetchSession: async () => SESSION, sendMessage, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'test';
    await p._handleSend();
    expect(sendMessage).toHaveBeenCalledWith('mySession', 'test', 't');
  });

  test('sendError se muestra y limpia correctamente', async () => {
    const sendMessage = vi.fn(async () => { throw new Error('ERR'); });
    const p = createJugarConMiiaPanel({ fetchSession: async () => SESSION, sendMessage, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'x';
    await p._handleSend();
    expect(p.element.querySelector('p[style*="display"]').style.display).not.toBe('none');
    // Now clear error and re-render
    p._setState({ sendError: null });
    expect(p.element.querySelector('p[style*="display"]').style.display).toBe('none');
  });
});
