import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const createPuntuacionPanel = require('../assets/ludomiia-panels/puntuacion-panel.js');

describe('puntuacion-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  // ── constructor defaults
  test('opts null — crea panel sin error', () => {
    const p = createPuntuacionPanel(null);
    expect(p.element).toBeDefined();
  });

  test('crea panel sin sessionId', () => {
    const p = createPuntuacionPanel({});
    expect(p._state.loading).toBe(true);
  });

  test('crea panel con sessionId en opts', () => {
    const p = createPuntuacionPanel({ sessionId: 's99' });
    expect(p._state).toBeDefined();
  });

  // ── loading inicial
  test('estado inicial loading muestra skeleton sin score-rows', () => {
    const p = createPuntuacionPanel({});
    expect(p.element.querySelectorAll('.score-row').length).toBe(0);
  });

  test('refreshBtn disabled en loading inicial', () => {
    const p = createPuntuacionPanel({});
    const btns = p.element.querySelectorAll('button');
    expect(btns[btns.length - 1].getAttribute('disabled')).toBe('true');
  });

  // ── error state
  test('_setState error muestra mensaje', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, error: 'Algo fallo' });
    expect(p.element.textContent).toContain('Algo fallo');
  });

  test('_setState error oculta winner banner', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, error: 'err' });
    expect(p.element.querySelector('.winner-banner').style.display).toBe('none');
  });

  test('_setState error habilita refreshBtn', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, error: 'err' });
    const btns = p.element.querySelectorAll('button');
    expect(btns[btns.length - 1].hasAttribute('disabled')).toBe(false);
  });

  // ── winner
  test('winner.displayName aparece en banner', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { winner: { displayName: 'Ana', uid: 'u1' }, players: [], history: [] } });
    const banner = p.element.querySelector('.winner-banner');
    expect(banner.style.display).toBe('block');
    expect(banner.textContent).toContain('Ana');
  });

  test('winner con uid pero sin displayName usa uid', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { winner: { uid: 'user123' }, players: [], history: [] } });
    expect(p.element.querySelector('.winner-banner').textContent).toContain('user123');
  });

  test('winner sin displayName ni uid usa Jugador', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { winner: {}, players: [], history: [] } });
    expect(p.element.querySelector('.winner-banner').textContent).toContain('Jugador');
  });

  test('sin winner oculta banner', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { winner: null, players: [], history: [] } });
    expect(p.element.querySelector('.winner-banner').style.display).toBe('none');
  });

  // ── players
  test('players renderiza score-rows', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [
      { displayName: 'Top', score: 100 },
      { displayName: 'Second', score: 80 },
    ], history: [] } });
    expect(p.element.querySelectorAll('.score-row').length).toBe(2);
  });

  test('renderRow rank=0 tiene borde con var(--miia-cyan)', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [{ displayName: 'Champion', score: 200 }], history: [] } });
    const row = p.element.querySelector('.score-row');
    // happy-dom reorders CSS shorthand but keeps var() values
    expect(row.style.borderLeft).toContain('var(--miia-cyan)');
  });

  test('renderRow rank>=1 tiene borde transparent', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [
      { displayName: 'A', score: 100 },
      { displayName: 'B', score: 90 },
    ], history: [] } });
    const rows = p.element.querySelectorAll('.score-row');
    expect(rows[1].style.borderLeft).toContain('transparent');
  });

  test('renderRow rank>2 usa String(rank+1) sin emoji', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [
      { displayName: 'A', score: 100 },
      { displayName: 'B', score: 90 },
      { displayName: 'C', score: 80 },
      { displayName: 'D', score: 70 },
    ], history: [] } });
    expect(p.element.querySelectorAll('.score-row').length).toBe(4);
  });

  test('renderRow player.score null muestra 0', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [{ displayName: 'X', score: null }], history: [] } });
    expect(p.element.querySelector('.score-row').textContent).toContain('0');
  });

  test('renderRow player.uid sin displayName usa uid', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [{ uid: 'u77', score: 50 }], history: [] } });
    expect(p.element.textContent).toContain('u77');
  });

  test('renderRow sin displayName ni uid usa Jugador', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [{ score: 42 }], history: [] } });
    expect(p.element.textContent).toContain('Jugador');
  });

  test('players vacios muestra Sin jugadores', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [], history: [] } });
    expect(p.element.textContent).toContain('Sin jugadores');
  });

  test('scores sin players key usa [] fallback', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: {} });
    expect(p.element.textContent).toContain('Sin jugadores');
  });

  // ── history
  test('history con gameName y won=true muestra Victoria', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [], history: [{ gameName: 'Ajedrez', won: true }] } });
    expect(p.element.textContent).toContain('Ajedrez');
    expect(p.element.textContent).toContain('Victoria');
  });

  test('history sin gameName usa Partida, won=false → Derrota', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [], history: [{ won: false }] } });
    expect(p.element.textContent).toContain('Partida');
    expect(p.element.textContent).toContain('Derrota');
  });

  test('history vacia muestra Sin historial', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [], history: [] } });
    expect(p.element.textContent).toContain('Sin historial');
  });

  test('scores sin history key usa [] fallback', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, scores: { players: [] } });
    expect(p.element.textContent).toContain('Sin historial');
  });

  test('scores null coerced a {} — players/history vacios', () => {
    const p = createPuntuacionPanel({});
    p._setState({ loading: false, error: null, scores: null });
    expect(p.element.textContent).toContain('Sin jugadores');
    expect(p.element.textContent).toContain('Sin historial');
  });

  // ── onClose
  test('click closeBtn llama onClose', () => {
    const onClose = vi.fn();
    const p = createPuntuacionPanel({ onClose });
    p.element.querySelector('.btn-ghost').click();
    expect(onClose).toHaveBeenCalled();
  });

  test('default onClose — click no lanza error', () => {
    const p = createPuntuacionPanel({});
    expect(() => p.element.querySelector('.btn-ghost').click()).not.toThrow();
  });

  // ── refresh
  test('refresh llama getScores y actualiza state', async () => {
    const getScores = vi.fn().mockResolvedValue({ players: [{ displayName: 'Z', score: 99 }], history: [] });
    const p = createPuntuacionPanel({ getScores });
    await p.refresh();
    expect(p._state.loading).toBe(false);
    expect(p._state.scores.players[0].displayName).toBe('Z');
  });

  test('refresh con error pone error + loading=false', async () => {
    const getScores = vi.fn().mockRejectedValue(new Error('fetch fail'));
    const p = createPuntuacionPanel({ getScores });
    await p.refresh();
    expect(p._state.error).toBe('fetch fail');
    expect(p._state.loading).toBe(false);
  });

  test('refresh sin getScores usa default (retorna null)', async () => {
    const p = createPuntuacionPanel({});
    await p.refresh();
    expect(p._state.scores).toBeNull();
  });

  test('refresh sin getToken usa default (token vacio)', async () => {
    const getScores = vi.fn().mockResolvedValue({ players: [], history: [] });
    const p = createPuntuacionPanel({ getScores });
    await p.refresh();
    expect(getScores).toHaveBeenCalledWith(null, '');
  });

  test('click boton Actualizar ejecuta refresh', async () => {
    const getScores = vi.fn().mockResolvedValue({ players: [], history: [] });
    const p = createPuntuacionPanel({ getScores });
    p._setState({ loading: false, error: null, scores: null });
    const btns = p.element.querySelectorAll('button');
    btns[btns.length - 1].click();
    await new Promise(r => setTimeout(r, 20));
    expect(getScores).toHaveBeenCalled();
  });
});
