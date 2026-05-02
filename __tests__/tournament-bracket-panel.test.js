import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createTournamentBracketPanel = require('../assets/ludomiia-panels/tournament-bracket-panel.js');

const TOURNAMENT = {
  status: 'active',
  rounds: [
    {
      name: 'Cuartos',
      matches: [
        { matchId: 'm1', player1Id: 'p1', player1Name: 'Maria', player2Id: 'p2', player2Name: 'Carlos', score1: null, score2: null, status: 'pending', winnerId: null },
        { matchId: 'm2', player1Id: 'p3', player1Name: 'Ana', player2Id: 'p4', player2Name: 'Luis', score1: 3, score2: 1, status: 'done', winnerId: 'p3' },
      ],
    },
    {
      name: 'Semifinal',
      matches: [
        { matchId: 'm3', player1Id: 'p3', player1Name: 'Ana', player2Id: null, player2Name: null, score1: null, score2: null, status: 'pending', winnerId: null },
      ],
    },
  ],
};

describe('tournament-bracket-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', () => {
    const p = createTournamentBracketPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra texto Cargando', () => {
    const p = createTournamentBracketPanel({ getToken: async () => 't' });
    expect(p.element.textContent).toContain('Cargando');
  });

  test('refresh muestra rondas', async () => {
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.round-col').length).toBe(2);
  });

  test('match-cards se renderizan', async () => {
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.match-card').length).toBe(3);
  });

  test('badge activo muestra En curso', async () => {
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.badge').textContent).toBe('En curso');
  });

  test('status finished muestra badge Finalizado', async () => {
    const t = { ...TOURNAMENT, status: 'finished' };
    const p = createTournamentBracketPanel({ fetchTournament: async () => t, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.badge').textContent).toBe('Finalizado');
  });

  test('match pending muestra botones report-btn', async () => {
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.report-btn').length).toBeGreaterThanOrEqual(2);
  });

  test('match done no tiene botones report', async () => {
    const onlyDone = {
      ...TOURNAMENT,
      rounds: [{ name: 'R1', matches: [TOURNAMENT.rounds[0].matches[1]] }],
    };
    const p = createTournamentBracketPanel({ fetchTournament: async () => onlyDone, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.report-btn').length).toBe(0);
  });

  test('player names se muestran', async () => {
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Maria');
    expect(p.element.textContent).toContain('Carlos');
  });

  test('match sin player2Name muestra TBD', async () => {
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('TBD');
  });

  test('score se muestra cuando disponible', async () => {
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('3');
  });

  test('rounds vacias muestra empty state', async () => {
    const t = { ...TOURNAMENT, rounds: [] };
    const p = createTournamentBracketPanel({ fetchTournament: async () => t, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Sin rondas');
  });

  test('tournament null no crash', async () => {
    const p = createTournamentBracketPanel({ fetchTournament: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Sin rondas');
  });

  test('refresh error muestra mensaje', async () => {
    const p = createTournamentBracketPanel({
      fetchTournament: async () => { throw new Error('T_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('T_ERR');
  });

  test('_handleReport llama reportResultFn', async () => {
    const reportResult = vi.fn(async () => TOURNAMENT);
    const p = createTournamentBracketPanel({ tournamentId: 't1', fetchTournament: async () => TOURNAMENT, reportResult, getToken: async () => 'tok' });
    await p.refresh();
    await p._handleReport('m1', 'p1');
    expect(reportResult).toHaveBeenCalledWith('t1', 'm1', { winnerId: 'p1' }, 'tok');
  });

  test('handleReport actualiza tournament', async () => {
    const updated = { ...TOURNAMENT, status: 'finished' };
    const reportResult = vi.fn(async () => updated);
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, reportResult, getToken: async () => 't' });
    await p.refresh();
    await p._handleReport('m1', 'p1');
    expect(p._state.tournament.status).toBe('finished');
  });

  test('handleReport respuesta null no rompe', async () => {
    const reportResult = vi.fn(async () => null);
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, reportResult, getToken: async () => 't' });
    await p.refresh();
    await p._handleReport('m1', 'p1');
    expect(p._state.error).toBeNull();
  });

  test('handleReport re-entering (reporting=true) no llama fn', async () => {
    const reportResult = vi.fn();
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, reportResult, getToken: async () => 't' });
    await p.refresh();
    p._setState({ reporting: true });
    await p._handleReport('m1', 'p1');
    expect(reportResult).not.toHaveBeenCalled();
  });

  test('handleReport error establece state.error', async () => {
    const reportResult = vi.fn(async () => { throw new Error('REP_ERR'); });
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, reportResult, getToken: async () => 't' });
    await p.refresh();
    await p._handleReport('m1', 'p1');
    expect(p._state.error).toBe('REP_ERR');
    expect(p._state.reporting).toBe(false);
  });

  test('click report-btn dispara handleReport', async () => {
    const reportResult = vi.fn(async () => TOURNAMENT);
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, reportResult, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('.report-btn').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(reportResult).toHaveBeenCalled();
  });

  test('click segundo report-btn dispara handleReport para player2', async () => {
    const reportResult = vi.fn(async () => TOURNAMENT);
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, reportResult, getToken: async () => 't' });
    await p.refresh();
    const btns = p.element.querySelectorAll('.report-btn');
    btns[1].click();
    await new Promise((r) => setTimeout(r, 20));
    expect(reportResult).toHaveBeenCalled();
  });

  test('tournament finished: report buttons not shown', async () => {
    const t = { ...TOURNAMENT, status: 'finished' };
    const p = createTournamentBracketPanel({ fetchTournament: async () => t, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.report-btn').length).toBe(0);
  });

  test('ronda sin name muestra Ronda N', async () => {
    const t = { status: 'active', rounds: [{ matches: [] }] };
    const p = createTournamentBracketPanel({ fetchTournament: async () => t, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Ronda 1');
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createTournamentBracketPanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('_setState loading:true muestra Cargando', async () => {
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    expect(p.element.textContent).toContain('Cargando');
  });

  test('_setState error muestra error en body', async () => {
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: false, error: 'err x' });
    expect(p.element.textContent).toContain('err x');
  });

  test('reporting=true durante render: no hay report-btn', async () => {
    const p = createTournamentBracketPanel({ fetchTournament: async () => TOURNAMENT, getToken: async () => 't' });
    await p.refresh();
    p._setState({ reporting: true });
    expect(p.element.querySelectorAll('.report-btn').length).toBe(0);
  });
});
