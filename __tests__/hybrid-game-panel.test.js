import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createHybridGamePanel = require('../assets/ludomiia-panels/hybrid-game-panel.js');

const GAME_STATE = {
  status: 'active',
  moves: [
    { description: 'Mueve A3->B4', player: 'P1' },
    { action: 'Roll dice 6', player: 'P2' },
  ],
  overlay: [
    { type: 'info', text: 'Buena jugada.' },
    { type: 'warning', text: 'Cuidado con la torre.' },
  ],
};

describe('hybrid-game-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', () => {
    const p = createHybridGamePanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra skeleton', () => {
    const p = createHybridGamePanel({ getToken: async () => 't' });
    const skels = p.element.querySelectorAll('div[style*="bg-elevated"]');
    expect(skels.length).toBeGreaterThanOrEqual(2);
  });

  test('loading deshabilita controles', () => {
    const p = createHybridGamePanel({ getToken: async () => 't' });
    expect(p.element.querySelector('input').hasAttribute('disabled')).toBe(true);
    expect(p.element.querySelector('button[title="Terminar partida hibrida"]').hasAttribute('disabled')).toBe(true);
  });

  test('refresh muestra estado activo + badge', async () => {
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.badge').textContent).toBe('Activo');
  });

  test('status ended muestra badge Finalizado', async () => {
    const p = createHybridGamePanel({
      fetchState: async () => ({ ...GAME_STATE, status: 'ended' }),
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelector('.badge').textContent).toBe('Finalizado');
  });

  test('movimientos se renderizan', async () => {
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, getToken: async () => 't' });
    await p.refresh();
    // Each move renders as a row
    const rows = p.element.querySelectorAll('.move-row');
    expect(rows.length).toBe(2);
  });

  test('sin movimientos muestra empty state', async () => {
    const p = createHybridGamePanel({
      fetchState: async () => ({ ...GAME_STATE, moves: [] }),
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.textContent).toContain('Sin movimientos');
  });

  test('overlay items se renderizan', async () => {
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.overlay-item').length).toBe(2);
  });

  test('overlay warning tiene borde amarillo', async () => {
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, getToken: async () => 't' });
    await p.refresh();
    const items = p.element.querySelectorAll('.overlay-item');
    const warning = Array.from(items).find((i) => i.textContent.includes('Cuidado'));
    expect(warning.style.borderLeftColor).toBeTruthy();
  });

  test('sin overlay muestra empty state', async () => {
    const p = createHybridGamePanel({
      fetchState: async () => ({ ...GAME_STATE, overlay: [] }),
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.textContent).toContain('Sin overlay');
  });

  test('refresh error muestra estado error', async () => {
    const p = createHybridGamePanel({
      fetchState: async () => { throw new Error('FETCH_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('FETCH_ERR');
  });

  test('handleRecordMove vacio no envia', async () => {
    const recordMove = vi.fn();
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, recordMove, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = '';
    await p._handleRecordMove();
    expect(recordMove).not.toHaveBeenCalled();
  });

  test('handleRecordMove llama recordMoveFn', async () => {
    const recordMove = vi.fn(async () => GAME_STATE);
    const p = createHybridGamePanel({ sessionId: 's1', fetchState: async () => GAME_STATE, recordMove, getToken: async () => 'tok' });
    await p.refresh();
    p.element.querySelector('input').value = 'move A3->B4';
    await p._handleRecordMove();
    expect(recordMove).toHaveBeenCalledWith('s1', { description: 'move A3->B4' }, 'tok');
  });

  test('recordMove actualiza gameState', async () => {
    const newState = { ...GAME_STATE, moves: [...GAME_STATE.moves, { description: 'new', player: 'P1' }] };
    const recordMove = vi.fn(async () => newState);
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, recordMove, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'x';
    await p._handleRecordMove();
    expect(p._state.gameState.moves.length).toBe(3);
  });

  test('recordMove response null no rompe', async () => {
    const recordMove = vi.fn(async () => null);
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, recordMove, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'x';
    await p._handleRecordMove();
    expect(p._state.error).toBeNull();
  });

  test('handleRecordMove guardado re-entering (recording=true)', async () => {
    const recordMove = vi.fn();
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, recordMove, getToken: async () => 't' });
    await p.refresh();
    p._setState({ recording: true });
    p.element.querySelector('input').value = 'x';
    await p._handleRecordMove();
    expect(recordMove).not.toHaveBeenCalled();
  });

  test('click boton Registrar dispara handleRecordMove', async () => {
    const recordMove = vi.fn(async () => null);
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, recordMove, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'move x';
    p.element.querySelector('.btn-primary.btn-sm').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(recordMove).toHaveBeenCalled();
  });

  test('handleRefreshOverlay llama requestOverlayFn', async () => {
    const requestOverlay = vi.fn(async () => ({ overlay: [{ type: 'info', text: 'ok' }] }));
    const p = createHybridGamePanel({ sessionId: 's1', fetchState: async () => GAME_STATE, requestOverlay, getToken: async () => 'tok' });
    await p.refresh();
    await p._handleRefreshOverlay();
    expect(requestOverlay).toHaveBeenCalledWith('s1', 'tok');
  });

  test('handleRefreshOverlay actualiza overlay en gameState', async () => {
    const requestOverlay = vi.fn(async () => ({ overlay: [{ type: 'info', text: 'nuevo' }] }));
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, requestOverlay, getToken: async () => 't' });
    await p.refresh();
    await p._handleRefreshOverlay();
    expect(p.element.querySelectorAll('.overlay-item').length).toBe(1);
  });

  test('handleRefreshOverlay con gameState null crea obj', async () => {
    const requestOverlay = vi.fn(async () => ({ overlay: [{ type: 'info', text: 'T' }] }));
    const p = createHybridGamePanel({ fetchState: async () => null, requestOverlay, getToken: async () => 't' });
    await p.refresh();
    await p._handleRefreshOverlay();
    expect(p._state.gameState.overlay.length).toBe(1);
  });

  test('handleRefreshOverlay response sin overlay no rompe', async () => {
    const requestOverlay = vi.fn(async () => ({ message: 'ok' }));
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, requestOverlay, getToken: async () => 't' });
    await p.refresh();
    await p._handleRefreshOverlay();
    expect(p._state.overlayError).toBeNull();
  });

  test('handleRefreshOverlay guardado re-entering', async () => {
    const requestOverlay = vi.fn();
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, requestOverlay, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loadingOverlay: true });
    await p._handleRefreshOverlay();
    expect(requestOverlay).not.toHaveBeenCalled();
  });

  test('click boton Actualizar overlay dispara handleRefreshOverlay', async () => {
    const requestOverlay = vi.fn(async () => null);
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, requestOverlay, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('.btn-ghost.btn-sm[style*="width"]').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(requestOverlay).toHaveBeenCalled();
  });

  test('handleEnd llama onEnd con gameState', async () => {
    const onEnd = vi.fn();
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, onEnd, getToken: async () => 't' });
    await p.refresh();
    await p._handleEnd();
    expect(onEnd).toHaveBeenCalledWith(GAME_STATE);
  });

  test('default onEnd no-op no rompe', async () => {
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, getToken: async () => 't' });
    await p.refresh();
    await expect(p._handleEnd()).resolves.not.toThrow();
  });

  test('callbacks default sin opts no rompen', async () => {
    const p = createHybridGamePanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('_setState loading:true re-muestra skeleton', async () => {
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    const skels = p.element.querySelectorAll('div[style*="bg-elevated"]');
    expect(skels.length).toBeGreaterThanOrEqual(2);
  });

  test('gameState null — sin movimientos y sin overlay', async () => {
    const p = createHybridGamePanel({ fetchState: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Sin movimientos');
  });

  test('status ended deshabilita controles', async () => {
    const p = createHybridGamePanel({
      fetchState: async () => ({ ...GAME_STATE, status: 'ended' }),
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelector('input').hasAttribute('disabled')).toBe(true);
  });

  test('overlayError se muestra en overlayBody', async () => {
    const requestOverlay = vi.fn(async () => { throw new Error('OV_ERR'); });
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, requestOverlay, getToken: async () => 't' });
    await p.refresh();
    await p._handleRefreshOverlay();
    expect(p._state.overlayError).toBe('OV_ERR');
  });

  test('loadingOverlay muestra skeleton en overlayBody', async () => {
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loadingOverlay: true });
    const skels = p.element.querySelectorAll('div[style*="bg-elevated"]');
    expect(skels.length).toBeGreaterThanOrEqual(1);
  });

  test('move con action (no description) se muestra', async () => {
    const p = createHybridGamePanel({
      fetchState: async () => ({ ...GAME_STATE, moves: [{ action: 'Roll 6', player: 'P2' }] }),
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.textContent).toContain('Roll 6');
  });

  test('move sin description ni action ni player renderiza vacio', async () => {
    const p = createHybridGamePanel({
      fetchState: async () => ({ ...GAME_STATE, moves: [{}] }),
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.querySelectorAll('.move-row').length).toBe(1);
  });

  test('handleRecordMove error establece state.error', async () => {
    const recordMove = vi.fn(async () => { throw new Error('REC_ERR'); });
    const p = createHybridGamePanel({ fetchState: async () => GAME_STATE, recordMove, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'x';
    await p._handleRecordMove();
    expect(p._state.error).toBe('REC_ERR');
    expect(p._state.recording).toBe(false);
  });
});
