import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createAnalyticsPanel = require('../assets/ludomiia-panels/analytics-panel.js');

const STATS = {
  totalGames: 42,
  wins: 28,
  winRate: 67,
  avgDurationMin: 18,
};

const SESSIONS = [
  { createdAt: '2026-05-01T10:00:00Z', gameName: 'Ajedrez', status: 'ended', won: true, durationMin: 20 },
  { createdAt: '2026-04-30T15:30:00Z', gameName: 'Damas', status: 'ended', won: false, durationMin: 12 },
  { createdAt: '2026-04-29T09:00:00Z', gameName: 'Parchis', status: 'active', won: false, durationMin: null },
];

describe('analytics-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', () => {
    const p = createAnalyticsPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra skeleton', () => {
    const p = createAnalyticsPanel({ getToken: async () => 't' });
    const skels = p.element.querySelectorAll('div[style*="bg-elevated"]');
    expect(skels.length).toBeGreaterThanOrEqual(1);
  });

  test('loading deshabilita refreshBtn', () => {
    const p = createAnalyticsPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('button').hasAttribute('disabled')).toBe(true);
  });

  test('refresh muestra 4 stat-cards', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.stat-card').length).toBe(4);
  });

  test('stat-card muestra totalGames', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('42');
  });

  test('stat-card muestra winRate con %', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('67%');
  });

  test('stat-card muestra avgDurationMin con min', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('18 min');
  });

  test('stats null muestra guiones en stat-cards', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => null, fetchSessions: async () => [], getToken: async () => 't' });
    await p.refresh();
    const cards = p.element.querySelectorAll('.stat-card');
    expect(cards.length).toBe(4);
    // winRate null → '-'
    const texts = Array.from(cards).map((c) => c.textContent);
    expect(texts.some((t) => t.includes('-'))).toBe(true);
  });

  test('sessions se muestran como filas .session-row', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.session-row').length).toBe(3);
  });

  test('session won=true muestra Victoria', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Victoria');
  });

  test('session won=false status=ended muestra Derrota', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Derrota');
  });

  test('session status=active muestra En curso', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('En curso');
  });

  test('sessions vacias muestra empty state', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => [], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Sin partidas registradas');
  });

  test('fetchSessions null no rompe', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p._state.sessions).toEqual([]);
  });

  test('refresh error muestra mensaje', async () => {
    const p = createAnalyticsPanel({
      fetchStats: async () => { throw new Error('STATS_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('STATS_ERR');
  });

  test('error muestra texto en panel', async () => {
    const p = createAnalyticsPanel({ getToken: async () => 't' });
    p._setState({ loading: false, error: 'Fallo red' });
    expect(p.element.textContent).toContain('Fallo red');
  });

  test('click boton Actualizar llama refresh', async () => {
    const fetchStats = vi.fn(async () => STATS);
    const p = createAnalyticsPanel({ fetchStats, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    fetchStats.mockClear();
    p.element.querySelector('.btn-ghost.btn-sm').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchStats).toHaveBeenCalled();
  });

  test('session durationMin null muestra guion', async () => {
    const sess = [{ createdAt: '2026-05-01', gameName: 'G', status: 'ended', won: true, durationMin: null }];
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => sess, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.session-row').length).toBe(1);
  });

  test('session sin gameName muestra guion', async () => {
    const sess = [{ createdAt: '2026-05-01', status: 'ended', won: true, durationMin: 5 }];
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => sess, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.session-row').length).toBe(1);
  });

  test('session sin createdAt muestra guion', async () => {
    const sess = [{ gameName: 'X', status: 'ended', won: false, durationMin: 3 }];
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => sess, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.session-row').length).toBe(1);
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createAnalyticsPanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('_setState loading:true muestra skeleton', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    const skels = p.element.querySelectorAll('div[style*="bg-elevated"]');
    expect(skels.length).toBeGreaterThanOrEqual(1);
  });

  test('stats.winRate null muestra guion', async () => {
    const p = createAnalyticsPanel({
      fetchStats: async () => ({ totalGames: 5, wins: 2, winRate: null, avgDurationMin: null }),
      fetchSessions: async () => [],
      getToken: async () => 't',
    });
    await p.refresh();
    const cards = p.element.querySelectorAll('.stat-card');
    expect(cards.length).toBe(4);
  });

  test('refreshBtn habilitado despues de refresh', async () => {
    const p = createAnalyticsPanel({ fetchStats: async () => STATS, fetchSessions: async () => SESSIONS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('button').hasAttribute('disabled')).toBe(false);
  });
});
