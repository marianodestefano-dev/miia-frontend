import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const createEquipoPanel = require('../assets/miiadt-panels/equipo-panel.js');

const TEAM_DATA = {
  teamName: 'Los Campeones',
  shieldUrl: 'https://example.com/shield.png',
  totalPoints: 250,
  rank: 3,
  players: [
    { name: 'Messi', position: 'DEL', points: 90 },
    { name: 'De Paul', position: 'MED', points: 75 },
  ],
};

describe('equipo-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('opts null crea panel sin error', () => {
    const p = createEquipoPanel(null);
    expect(p.element).toBeDefined();
    expect(p._state.team).toBeNull();
  });

  test('initial render estado inicial sin loading ni error', () => {
    const p = createEquipoPanel({});
    expect(p._state.loading).toBe(false);
    expect(p._state.error).toBeNull();
  });

  test('_setState loading=true muestra Cargando', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: true });
    expect(p.element.querySelector('.equipo-loading')).not.toBeNull();
    expect(p.element.querySelector('.equipo-loading').textContent).toBe('Cargando...');
  });

  test('_setState error muestra mensaje de error', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, error: 'Error red' });
    expect(p.element.querySelector('.equipo-error').textContent).toBe('Error red');
  });

  test('team null muestra Sin equipo disponible', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: null });
    expect(p.element.querySelector('.equipo-empty').textContent).toContain('Sin equipo');
  });

  test('equipo con shieldUrl muestra img', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: TEAM_DATA });
    expect(p.element.querySelector('.equipo-shield-img')).not.toBeNull();
    expect(p.element.querySelector('.equipo-shield-img').getAttribute('src')).toBe('https://example.com/shield.png');
  });

  test('equipo sin shieldUrl muestra iniciales del nombre', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: { teamName: 'River Plate', players: [] } });
    expect(p.element.querySelector('.equipo-shield').textContent).toBe('RI');
  });

  test('equipo sin shieldUrl y sin teamName usa EQ', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: { players: [] } });
    expect(p.element.querySelector('.equipo-shield').textContent).toBe('EQ');
  });

  test('nombre equipo sin teamName usa Mi Equipo', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: { players: [] } });
    expect(p.element.querySelector('.equipo-team-name').textContent).toBe('Mi Equipo');
  });

  test('stats muestra totalPoints y rank', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: TEAM_DATA });
    expect(p.element.querySelector('.equipo-total-pts').textContent).toBe('250');
    expect(p.element.querySelector('.equipo-rank').textContent).toBe('3');
  });

  test('stats sin totalPoints ni rank usa fallbacks', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: { shieldUrl: 'x', players: [] } });
    expect(p.element.querySelector('.equipo-total-pts').textContent).toBe('0');
    expect(p.element.querySelector('.equipo-rank').textContent).toBe('-');
  });

  test('players renderiza filas', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: TEAM_DATA });
    expect(p.element.querySelectorAll('.equipo-player-row').length).toBe(2);
  });

  test('players vacios muestra Sin jugadores titulares', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: { players: [] } });
    expect(p.element.querySelector('.equipo-empty-players').textContent).toBe('Sin jugadores titulares');
  });

  test('players sin key usa fallback []', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: { shieldUrl: 'x' } });
    expect(p.element.querySelector('.equipo-empty-players')).not.toBeNull();
  });

  test('jugador sin name/position/points usa fallbacks', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: { players: [{}] } });
    const row = p.element.querySelector('.equipo-player-row');
    expect(row.querySelector('.equipo-player-name').textContent).toBe('Jugador');
    expect(row.querySelector('.equipo-player-pos').textContent).toBe('POS');
    expect(row.querySelector('.equipo-player-pts').textContent).toBe('0');
  });

  test('boton Transferencias presente y llama onTransfer', () => {
    const onTransfer = vi.fn();
    const p = createEquipoPanel({ onTransfer });
    p._setState({ loading: false, team: TEAM_DATA });
    const btn = p.element.querySelector('.equipo-transfer-btn');
    expect(btn).not.toBeNull();
    btn.click();
    expect(onTransfer).toHaveBeenCalled();
  });

  test('default onTransfer click no lanza error', () => {
    const p = createEquipoPanel({});
    p._setState({ loading: false, team: TEAM_DATA });
    expect(() => p.element.querySelector('.equipo-transfer-btn').click()).not.toThrow();
  });

  test('load sets team + loading=false', async () => {
    const fetchTeam = vi.fn().mockResolvedValue(TEAM_DATA);
    const p = createEquipoPanel({ fetchTeam });
    await p.load();
    expect(p._state.team).toEqual(TEAM_DATA);
    expect(p._state.loading).toBe(false);
  });

  test('load error sets error + loading=false', async () => {
    const fetchTeam = vi.fn().mockRejectedValue(new Error('err'));
    const p = createEquipoPanel({ fetchTeam });
    await p.load();
    expect(p._state.error).toBe('err');
    expect(p._state.loading).toBe(false);
  });

  test('load sin fetchTeam usa default null', async () => {
    const p = createEquipoPanel({});
    await p.load();
    expect(p._state.team).toBeNull();
  });

  test('load sin getToken usa default token vacio', async () => {
    const fetchTeam = vi.fn().mockResolvedValue(TEAM_DATA);
    const p = createEquipoPanel({ fetchTeam });
    await p.load();
    expect(fetchTeam).toHaveBeenCalledWith('');
  });
});
