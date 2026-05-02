import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createGameHistoryPanel = require('../assets/ludomiia-panels/game-history-panel.js');

const SESSIONS = [
  { sessionId: 's1', gameName: 'Ajedrez', status: 'ended', won: true, durationMin: 20, createdAt: '2026-05-01T10:00:00Z', playerCount: 2 },
  { sessionId: 's2', gameName: 'Damas', status: 'ended', won: false, durationMin: 12, createdAt: '2026-04-30T15:00:00Z', playerCount: 2 },
  { sessionId: 's3', gameName: 'Parchis', status: 'active', won: false, durationMin: null, createdAt: '2026-04-29T09:00:00Z', playerCount: 4 },
];

const PAGE1 = { sessions: SESSIONS, total: 25 };

describe('game-history-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra Cargando', () => {
    const p = createGameHistoryPanel({ fetchHistory: () => new Promise(() => {}), getToken: async () => 't' });
    expect(p.element.textContent).toContain('Cargando');
  });

  test('historial muestra rows .history-row', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.history-row').length).toBe(3);
  });

  test('total partidas se muestra en header', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('25 partidas');
  });

  test('paginacion muestra pagina actual / total', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't', pageSize: 10 });
    await p.refresh();
    expect(p.element.textContent).toContain('Pág. 1 / 3');
  });

  test('sesion ganada muestra 🏆', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('🏆');
  });

  test('sesion perdida muestra ❌', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('❌');
  });

  test('sesion activa muestra ⏳', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('⏳');
  });

  test('click row expande detalle .history-detail', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('.history-row').click();
    expect(p.element.querySelectorAll('.history-detail').length).toBe(1);
  });

  test('click row dos veces colapsa detalle', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('.history-row').click();
    p.element.querySelector('.history-row').click();
    expect(p.element.querySelectorAll('.history-detail').length).toBe(0);
  });

  test('detalle muestra nombre del juego', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    p._handleExpand('s1');
    expect(p.element.querySelectorAll('.history-detail').length).toBe(1);
    expect(p.element.textContent).toContain('Ajedrez');
  });

  test('detalle sesion perdida muestra Derrota', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    p._handleExpand('s2');
    expect(p.element.textContent).toContain('Derrota');
  });

  test('detalle sesion activa muestra En curso', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    p._handleExpand('s3');
    expect(p.element.textContent).toContain('En curso');
  });

  test('detalle durationMin null muestra guion', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    p._handleExpand('s3');
    expect(p.element.querySelectorAll('.history-detail').length).toBe(1);
  });

  test('sesion sin gameName muestra Partida', async () => {
    const sess = [{ sessionId: 'x', status: 'ended', won: false }];
    const p = createGameHistoryPanel({ fetchHistory: async () => ({ sessions: sess, total: 1 }), getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Partida');
  });

  test('sesion sin durationMin no muestra min en meta', async () => {
    const sess = [{ sessionId: 'x', gameName: 'G', status: 'ended', won: true, durationMin: null }];
    const p = createGameHistoryPanel({ fetchHistory: async () => ({ sessions: sess, total: 1 }), getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.history-row').length).toBe(1);
  });

  test('pag 1 deshabilita prev', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't', pageSize: 10 });
    await p.refresh();
    const buttons = p.element.querySelectorAll('button');
    const prevBtn = buttons[0];
    expect(prevBtn.hasAttribute('disabled')).toBe(true);
  });

  test('pag < total habilita next', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't', pageSize: 10 });
    await p.refresh();
    const buttons = p.element.querySelectorAll('button');
    const nextBtn = buttons[1];
    expect(nextBtn.hasAttribute('disabled')).toBe(false);
  });

  test('handleNext avanza pagina y llama fetchHistory', async () => {
    const fetchHistory = vi.fn(async () => PAGE1);
    const p = createGameHistoryPanel({ fetchHistory, getToken: async () => 't', pageSize: 10 });
    await p.refresh();
    fetchHistory.mockClear();
    await p._handleNext();
    expect(fetchHistory).toHaveBeenCalledWith(2, 10, 't');
    expect(p._state.page).toBe(2);
  });

  test('handleNext en ultima pagina no llama fetchHistory', async () => {
    const fetchHistory = vi.fn(async () => ({ sessions: SESSIONS, total: 3 }));
    const p = createGameHistoryPanel({ fetchHistory, getToken: async () => 't', pageSize: 10 });
    await p.refresh();
    fetchHistory.mockClear();
    await p._handleNext();
    expect(fetchHistory).not.toHaveBeenCalled();
  });

  test('handlePrev retrocede pagina', async () => {
    const fetchHistory = vi.fn(async () => PAGE1);
    const p = createGameHistoryPanel({ fetchHistory, getToken: async () => 't', pageSize: 10 });
    await p.refresh();
    await p._handleNext();
    fetchHistory.mockClear();
    await p._handlePrev();
    expect(fetchHistory).toHaveBeenCalledWith(1, 10, 't');
    expect(p._state.page).toBe(1);
  });

  test('handlePrev en pag 1 no llama fetchHistory', async () => {
    const fetchHistory = vi.fn(async () => PAGE1);
    const p = createGameHistoryPanel({ fetchHistory, getToken: async () => 't', pageSize: 10 });
    await p.refresh();
    fetchHistory.mockClear();
    await p._handlePrev();
    expect(fetchHistory).not.toHaveBeenCalled();
  });

  test('click next button avanza pagina', async () => {
    const fetchHistory = vi.fn(async () => PAGE1);
    const p = createGameHistoryPanel({ fetchHistory, getToken: async () => 't', pageSize: 10 });
    await p.refresh();
    fetchHistory.mockClear();
    const buttons = p.element.querySelectorAll('button');
    buttons[1].click();
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchHistory).toHaveBeenCalled();
  });

  test('click prev button retrocede pagina', async () => {
    const fetchHistory = vi.fn(async () => PAGE1);
    const p = createGameHistoryPanel({ fetchHistory, getToken: async () => 't', pageSize: 10 });
    await p.refresh();
    await p._handleNext();
    fetchHistory.mockClear();
    const buttons = p.element.querySelectorAll('button');
    buttons[0].click();
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchHistory).toHaveBeenCalled();
  });

  test('error al cargar muestra mensaje', async () => {
    const p = createGameHistoryPanel({
      fetchHistory: async () => { throw new Error('HIST_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('HIST_ERR');
    expect(p.element.textContent).toContain('HIST_ERR');
  });

  test('sessions vacias muestra empty state', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => ({ sessions: [], total: 0 }), getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Sin partidas');
  });

  test('fetchHistory null sessions y total no rompe', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p._state.sessions).toEqual([]);
    expect(p._state.total).toBe(0);
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createGameHistoryPanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('_setState loading:true muestra Cargando', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    expect(p.element.textContent).toContain('Cargando');
  });

  test('_setState error muestra error en listEl', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => PAGE1, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: false, error: 'test err' });
    expect(p.element.textContent).toContain('test err');
  });

  test('pagina final deshabilita next', async () => {
    const p = createGameHistoryPanel({ fetchHistory: async () => ({ sessions: SESSIONS, total: 3 }), getToken: async () => 't', pageSize: 10 });
    await p.refresh();
    const buttons = p.element.querySelectorAll('button');
    expect(buttons[1].hasAttribute('disabled')).toBe(true);
  });

  test('detalle con playerCount null muestra guion', async () => {
    const sess = [{ sessionId: 'y', gameName: 'G', status: 'ended', won: true, durationMin: 5, playerCount: null }];
    const p = createGameHistoryPanel({ fetchHistory: async () => ({ sessions: sess, total: 1 }), getToken: async () => 't' });
    await p.refresh();
    p._handleExpand('y');
    expect(p.element.querySelectorAll('.history-detail').length).toBe(1);
  });

  test('detalle sin gameName ni status muestra guion en renderDetail', async () => {
    const sess = [{ sessionId: 'z', won: false, durationMin: null, playerCount: null }];
    const p = createGameHistoryPanel({ fetchHistory: async () => ({ sessions: sess, total: 1 }), getToken: async () => 't' });
    await p.refresh();
    p._handleExpand('z');
    expect(p.element.querySelectorAll('.history-detail').length).toBe(1);
  });
});
