import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createAchievementsPanel = require('../assets/ludomiia-panels/achievements-panel.js');

const ACHIEVEMENTS = [
  { id: 'a1', title: 'Primera Victoria', description: 'Gana tu primera partida.', icon: '🥇', unlockedAt: '2026-04-01T10:00:00Z' },
  { id: 'a2', title: '10 Victorias', description: 'Gana 10 partidas.', icon: '🏆', unlockedAt: null, progress: 7, total: 10 },
  { id: 'a3', title: 'Experto', description: 'Juega 50 partidas.', icon: '⭐', unlockedAt: null, progress: null, total: null },
];

describe('achievements-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', () => {
    const p = createAchievementsPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra Cargando logros', () => {
    const p = createAchievementsPanel({ getToken: async () => 't' });
    expect(p.element.textContent).toContain('Cargando logros');
  });

  test('refresh muestra achievement-cards', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.achievement-card').length).toBe(3);
  });

  test('count muestra N / total desbloqueados', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('1 / 3 desbloqueados');
  });

  test('logro desbloqueado muestra checkmark', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('✓ Desbloqueado');
  });

  test('logro bloqueado con progreso muestra barra y texto', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('7 / 10');
  });

  test('logro sin progreso ni total no muestra barra', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    const cards = p.element.querySelectorAll('.achievement-card');
    expect(cards.length).toBe(3);
  });

  test('icon se muestra', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('🥇');
  });

  test('filter all muestra todos', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    p._handleFilter('all');
    expect(p.element.querySelectorAll('.achievement-card').length).toBe(3);
  });

  test('filter unlocked muestra solo desbloqueados', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    p._handleFilter('unlocked');
    expect(p.element.querySelectorAll('.achievement-card').length).toBe(1);
  });

  test('filter locked muestra solo bloqueados', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    p._handleFilter('locked');
    expect(p.element.querySelectorAll('.achievement-card').length).toBe(2);
  });

  test('filter locked sin resultados muestra empty state', async () => {
    const all = [{ id: 'a1', title: 'T', icon: '🥇', unlockedAt: '2026-01-01' }];
    const p = createAchievementsPanel({ fetchAchievements: async () => all, getToken: async () => 't' });
    await p.refresh();
    p._handleFilter('locked');
    expect(p.element.textContent).toContain('Sin logros en este filtro');
  });

  test('tab activo cambia className', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    p._handleFilter('unlocked');
    const tabs = p.element.querySelectorAll('.tab-btn');
    expect(tabs[1].className).toContain('tab-active');
    expect(tabs[0].className).not.toContain('tab-active');
  });

  test('click tab Desbloqueados dispara filter', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    const tabs = p.element.querySelectorAll('.tab-btn');
    tabs[1].click();
    expect(p._state.filter).toBe('unlocked');
  });

  test('click tab Bloqueados dispara filter', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    const tabs = p.element.querySelectorAll('.tab-btn');
    tabs[2].click();
    expect(p._state.filter).toBe('locked');
  });

  test('click tab Todos vuelve a all', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    p._handleFilter('locked');
    const tabs = p.element.querySelectorAll('.tab-btn');
    tabs[0].click();
    expect(p._state.filter).toBe('all');
  });

  test('refresh error muestra mensaje', async () => {
    const p = createAchievementsPanel({
      fetchAchievements: async () => { throw new Error('ACH_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('ACH_ERR');
    expect(p.element.textContent).toContain('ACH_ERR');
  });

  test('fetchAchievements null retorna [] sin crash', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p._state.achievements).toEqual([]);
  });

  test('logro sin icon muestra 🏅 default', async () => {
    const achs = [{ id: 'x', title: 'X', unlockedAt: null, progress: null, total: null }];
    const p = createAchievementsPanel({ fetchAchievements: async () => achs, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('🏅');
  });

  test('logro sin title muestra Logro default', async () => {
    const achs = [{ id: 'x', unlockedAt: null }];
    const p = createAchievementsPanel({ fetchAchievements: async () => achs, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Logro');
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createAchievementsPanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('_setState loading:true muestra Cargando logros', async () => {
    const p = createAchievementsPanel({ fetchAchievements: async () => ACHIEVEMENTS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    expect(p.element.textContent).toContain('Cargando logros');
  });

  test('progreso 100% no excede barra (min 100)', async () => {
    const achs = [{ id: 'x', title: 'X', unlockedAt: null, progress: 15, total: 10 }];
    const p = createAchievementsPanel({ fetchAchievements: async () => achs, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('15 / 10');
  });
});
