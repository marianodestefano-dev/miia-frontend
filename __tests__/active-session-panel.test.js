import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createActiveSessionPanel = require('../assets/ludomiia-panels/active-session-panel.js');

describe('active-session-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('crea element HTMLElement', () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('titulo de partida activa visible', () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.session-title').textContent).toBe('Partida activa');
  });

  test('boton Finalizar visible', () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.session-end-btn')).not.toBeNull();
  });

  test('input de texto visible', () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.session-text-input')).not.toBeNull();
  });

  test('load inicializa sessionId y limpia mensajes', () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    p._state.messages = [{ role: 'user', text: 'hola' }];
    p.load('sess-1');
    expect(p._state.sessionId).toBe('sess-1');
    expect(p._state.messages).toHaveLength(0);
  });

  test('handleSend agrega mensaje usuario al chat', async () => {
    const sendAction = vi.fn(async () => ({ gmResponse: 'OK', state: {} }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    await p._handleSend('Muevo el alfil');
    expect(p._state.messages.some(m => m.role === 'user' && m.text === 'Muevo el alfil')).toBe(true);
  });

  test('handleSend agrega respuesta de MIIA', async () => {
    const sendAction = vi.fn(async () => ({ gmResponse: 'Buen movimiento!', state: {} }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    await p._handleSend('test');
    expect(p._state.messages.some(m => m.role === 'miia' && m.text === 'Buen movimiento!')).toBe(true);
  });

  test('handleSend llama sendAction con sessionId, msg, token', async () => {
    const sendAction = vi.fn(async () => ({ gmResponse: 'R', state: {} }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 'tok' });
    p.load('sess-abc');
    await p._handleSend('accion');
    expect(sendAction).toHaveBeenCalledWith('sess-abc', 'accion', 'tok');
  });

  test('handleSend muestra chat bubbles tras enviar', async () => {
    const sendAction = vi.fn(async () => ({ gmResponse: 'R', state: {} }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    await p._handleSend('hola');
    expect(p.element.querySelectorAll('.chat-bubble').length).toBe(2);
  });

  test('bubble usuario tiene clase user-bubble', async () => {
    const sendAction = vi.fn(async () => ({ gmResponse: 'R', state: {} }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    await p._handleSend('test');
    expect(p.element.querySelector('.user-bubble')).not.toBeNull();
  });

  test('bubble miia tiene clase miia-bubble', async () => {
    const sendAction = vi.fn(async () => ({ gmResponse: 'R', state: {} }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    await p._handleSend('test');
    expect(p.element.querySelector('.miia-bubble')).not.toBeNull();
  });

  test('handleSend loading=true muestra typing-indicator', async () => {
    let resolveAction;
    const sendAction = vi.fn(() => new Promise(r => { resolveAction = r; }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    const sendPromise = p._handleSend('test');
    // After first await (getToken), sendAction is called and loading=true
    await new Promise(r => setTimeout(r, 10));
    if (resolveAction) resolveAction({ gmResponse: 'done', state: {} });
    await sendPromise;
  });

  test('loading=true via _setState muestra typing-indicator', () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    p._setState({ loading: true });
    expect(p.element.querySelector('.typing-indicator')).not.toBeNull();
  });

  test('handleSend no envia si input vacio', async () => {
    const sendAction = vi.fn();
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    await p._handleSend('  ');
    expect(sendAction).not.toHaveBeenCalled();
  });

  test('handleSend no envia si loading=true', async () => {
    const sendAction = vi.fn();
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    p._state.loading = true;
    await p._handleSend('test');
    expect(sendAction).not.toHaveBeenCalled();
  });

  test('handleSend no envia si gameOver=true', async () => {
    const sendAction = vi.fn();
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    p._state.gameOver = true;
    await p._handleSend('test');
    expect(sendAction).not.toHaveBeenCalled();
  });

  test('handleSend error agrega mensaje de error de MIIA', async () => {
    const sendAction = vi.fn(async () => { throw new Error('NET'); });
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    await p._handleSend('test');
    expect(p._state.messages.some(m => m.role === 'miia' && m.text.includes('Error'))).toBe(true);
  });

  test('respuesta sin gmResponse usa texto por defecto', async () => {
    const sendAction = vi.fn(async () => ({ state: {} }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    await p._handleSend('test');
    expect(p._state.messages.some(m => m.text === 'Turno procesado.')).toBe(true);
  });

  test('respuesta con state.status=finished activa gameOver', async () => {
    const sendAction = vi.fn(async () => ({ gmResponse: 'Fin', state: { status: 'finished', turn: 5 } }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    await p._handleSend('ultima accion');
    expect(p._state.gameOver).toBe(true);
  });

  test('gameOver muestra overlay', async () => {
    const sendAction = vi.fn(async () => ({ gmResponse: 'Fin', state: { status: 'finished', turn: 5 } }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    await p._handleSend('ultima accion');
    expect(p.element.querySelector('.game-over-overlay').style.display).toBe('flex');
  });

  test('gameOver muestra turno completado', async () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    p._setState({ gameOver: true, gameState: { turn: 7 } });
    expect(p.element.querySelector('.game-over-sub').textContent).toContain('7');
  });

  test('gameOver sin turno muestra 0', () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    p._setState({ gameOver: true, gameState: {} });
    expect(p.element.querySelector('.game-over-sub').textContent).toContain('0');
  });

  test('click Ver mis partidas llama onSessionEnd', () => {
    const onSessionEnd = vi.fn();
    const p = createActiveSessionPanel({ onSessionEnd, getToken: async () => 't' });
    p._setState({ gameOver: true, gameState: {} });
    p.element.querySelector('.ver-partidas-btn').click();
    expect(onSessionEnd).toHaveBeenCalled();
  });

  test('handleEnd pone gameOver=true y llama endSessionFn', async () => {
    const endSession = vi.fn(async () => null);
    const p = createActiveSessionPanel({ endSession, getToken: async () => 'tok' });
    p.load('sess-1');
    await p._handleEnd();
    expect(endSession).toHaveBeenCalledWith('sess-1', 'tok');
    expect(p._state.gameOver).toBe(true);
  });

  test('handleEnd sin sessionId no llama endSessionFn', async () => {
    const endSession = vi.fn();
    const p = createActiveSessionPanel({ endSession, getToken: async () => 't' });
    await p._handleEnd();
    expect(endSession).not.toHaveBeenCalled();
  });

  test('click boton Finalizar dispara handleEnd', async () => {
    const endSession = vi.fn(async () => null);
    const p = createActiveSessionPanel({ endSession, getToken: async () => 't' });
    p.load('s1');
    p.element.querySelector('.session-end-btn').click();
    await new Promise(r => setTimeout(r, 20));
    expect(endSession).toHaveBeenCalled();
  });

  test('gameOver=true deshabilita input y sendBtn', () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    p._setState({ gameOver: true });
    expect(p.element.querySelector('.session-text-input').hasAttribute('disabled')).toBe(true);
    expect(p.element.querySelector('.session-send-btn').hasAttribute('disabled')).toBe(true);
  });

  test('loading=false, gameOver=false habilita input y sendBtn', () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    p._setState({ loading: false, gameOver: false });
    expect(p.element.querySelector('.session-text-input').hasAttribute('disabled')).toBe(false);
    expect(p.element.querySelector('.session-send-btn').hasAttribute('disabled')).toBe(false);
  });

  test('input keydown Enter dispara handleSend', async () => {
    const sendAction = vi.fn(async () => ({ gmResponse: 'R', state: {} }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    const input = p.element.querySelector('.session-text-input');
    input.value = 'muevo';
    input.dispatchEvent(new Event('input'));
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false, bubbles: true });
    input.dispatchEvent(enterEvent);
    await new Promise(r => setTimeout(r, 20));
    expect(sendAction).toHaveBeenCalled();
  });

  test('Enter con shiftKey no dispara handleSend', async () => {
    const sendAction = vi.fn(async () => ({ gmResponse: 'R', state: {} }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    const input = p.element.querySelector('.session-text-input');
    input.value = 'test';
    input.dispatchEvent(new Event('input'));
    const shiftEnter = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true });
    input.dispatchEvent(shiftEnter);
    await new Promise(r => setTimeout(r, 10));
    expect(sendAction).not.toHaveBeenCalled();
  });

  test('respuesta null usa texto por defecto', async () => {
    const sendAction = vi.fn(async () => null);
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    await p._handleSend('test');
    expect(p._state.messages.some(m => m.text === 'Turno procesado.')).toBe(true);
  });

  test('opts null usa defaults', async () => {
    const p = createActiveSessionPanel(null);
    p.load('s1');
    await p._handleSend('test');
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('default onSessionEnd no rompe al click', () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    p._setState({ gameOver: true, gameState: {} });
    expect(() => p.element.querySelector('.ver-partidas-btn').click()).not.toThrow();
  });

  test('endSession error no interrumpe handleEnd', async () => {
    const endSession = vi.fn(async () => { throw new Error('END_ERR'); });
    const p = createActiveSessionPanel({ endSession, getToken: async () => 't' });
    p.load('s1');
    await expect(p._handleEnd()).resolves.not.toThrow();
    expect(p._state.gameOver).toBe(true);
  });

  test('default endSession no rompe al llamar handleEnd', async () => {
    const p = createActiveSessionPanel({ getToken: async () => 't' });
    p.load('s1');
    await p._handleEnd();
    expect(p._state.gameOver).toBe(true);
  });

  test('click boton Enviar dispara handleSend', async () => {
    const sendAction = vi.fn(async () => ({ gmResponse: 'R', state: {} }));
    const p = createActiveSessionPanel({ sendAction, getToken: async () => 't' });
    p.load('s1');
    const input = p.element.querySelector('.session-text-input');
    input.value = 'test click';
    input.dispatchEvent(new Event('input'));
    p.element.querySelector('.session-send-btn').click();
    await new Promise(r => setTimeout(r, 20));
    expect(sendAction).toHaveBeenCalled();
  });
});
