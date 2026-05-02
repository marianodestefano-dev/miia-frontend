import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const createF1TelemetryPanel = require('../assets/f1-panels/f1-telemetry-panel.js');

const STINTS_DATA = [
  { driver_number: 1,  compound: 'SOFT',         lap_start: 1,  lap_end: 20, lap_count: 20 },
  { driver_number: 11, compound: 'MEDIUM',        lap_start: 1,  lap_end: 22, lap_count: 22 },
  { driver_number: 44, compound: 'HARD',          lap_start: 5,  lap_count: null },
  { driver_number: 16, compound: 'INTERMEDIATE',  lap_start: 1,  lap_end: 10, lap_count: 10 },
  { driver_number: 55, compound: 'WET',           lap_start: 1,  lap_end: 8,  lap_count: 8  },
];

const PITS_DATA = [
  { driver_number: 1,  lap_number: 20 },
  { driver_number: 1,  lap_number: 35 },
  { driver_number: 11, lap_number: 22 },
];

describe('f1-telemetry-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('opts null -> panel creado', () => {
    const p = createF1TelemetryPanel(null);
    expect(p.element).toBeDefined();
  });

  test('initial render -> Sin datos de telemetria', () => {
    const p = createF1TelemetryPanel({});
    expect(p.element.querySelector('.f1t-empty').textContent).toContain('Sin datos');
  });

  test('_setState loading=true -> Cargando telemetria', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: true });
    expect(p.element.querySelector('.f1t-loading').textContent).toBe('Cargando telemetria...');
  });

  test('_setState error -> muestra error', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, error: 'Error stints' });
    expect(p.element.querySelector('.f1t-error').textContent).toBe('Error stints');
  });

  test('stints array vacio -> Sin stints disponibles', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [] });
    expect(p.element.querySelector('.f1t-empty').textContent).toContain('Sin stints');
  });

  test('stints con data -> renderiza filas', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: STINTS_DATA, pits: PITS_DATA });
    const rows = p.element.querySelectorAll('.f1t-row');
    expect(rows.length).toBe(5);
  });

  test('SOFT -> color rojo #FF2D2D', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 1, compound: 'SOFT', lap_count: 10 }], pits: [] });
    const icon = p.element.querySelector('.f1t-tyre-icon');
    expect(icon.style.backgroundColor).toBe('#FF2D2D');
  });

  test('MEDIUM -> color amarillo #FFD700', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 1, compound: 'MEDIUM', lap_count: 10 }], pits: [] });
    const icon = p.element.querySelector('.f1t-tyre-icon');
    expect(icon.style.backgroundColor).toBe('#FFD700');
  });

  test('HARD -> color blanco #FFFFFF', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 1, compound: 'HARD', lap_count: 10 }], pits: [] });
    const icon = p.element.querySelector('.f1t-tyre-icon');
    expect(icon.style.backgroundColor).toBe('#FFFFFF');
  });

  test('INTERMEDIATE -> color verde #00C800', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 1, compound: 'INTERMEDIATE', lap_count: 10 }], pits: [] });
    const icon = p.element.querySelector('.f1t-tyre-icon');
    expect(icon.style.backgroundColor).toBe('#00C800');
  });

  test('WET -> color azul #0080FF', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 1, compound: 'WET', lap_count: 5 }], pits: [] });
    const icon = p.element.querySelector('.f1t-tyre-icon');
    expect(icon.style.backgroundColor).toBe('#0080FF');
  });

  test('compuesto desconocido -> color #888888', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 1, compound: 'SUPER_HYPER', lap_count: 5 }], pits: [] });
    const icon = p.element.querySelector('.f1t-tyre-icon');
    expect(icon.style.backgroundColor).toBe('#888888');
  });

  test('compound null -> color #888888 y label ?', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 1, compound: null, lap_count: 5 }], pits: [] });
    const icon = p.element.querySelector('.f1t-tyre-icon');
    expect(icon.style.backgroundColor).toBe('#888888');
    expect(p.element.querySelector('.f1t-tyre-label').textContent).toBe('?');
  });

  test('lap_count=null pero lap_start y lap_end definidos -> calcula vueltas', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 1, compound: 'HARD', lap_start: 5, lap_end: 25, lap_count: null }], pits: [] });
    const lapsCell = p.element.querySelector('.f1t-laps');
    expect(lapsCell.textContent).toBe('21'); // 25 - 5 + 1
  });

  test('lap_count=null y sin lap_end -> muestra ?', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 1, compound: 'SOFT', lap_start: 1, lap_count: null }], pits: [] });
    const lapsCell = p.element.querySelector('.f1t-laps');
    expect(lapsCell.textContent).toBe('?');
  });

  test('pit count correcto (driver con 2 pits)', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 1, compound: 'SOFT', lap_count: 10 }], pits: PITS_DATA });
    const pitsCell = p.element.querySelector('.f1t-pits');
    expect(pitsCell.textContent).toBe('2');
  });

  test('driver sin pits -> pits=0', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 44, compound: 'HARD', lap_count: 30 }], pits: PITS_DATA });
    const pitsCell = p.element.querySelector('.f1t-pits');
    expect(pitsCell.textContent).toBe('0');
  });

  test('pits=null -> pit counts 0', () => {
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints: [{ driver_number: 1, compound: 'SOFT', lap_count: 5 }], pits: null });
    const pitsCell = p.element.querySelector('.f1t-pits');
    expect(pitsCell.textContent).toBe('0');
  });

  test('duplicate driver_number en stints -> solo muestra el ultimo', () => {
    const stints = [
      { driver_number: 1, compound: 'SOFT',   lap_count: 20 },
      { driver_number: 1, compound: 'MEDIUM', lap_count: 15 },
    ];
    const p = createF1TelemetryPanel({});
    p._setState({ loading: false, stints, pits: [] });
    const rows = p.element.querySelectorAll('.f1t-row');
    expect(rows.length).toBe(1);
    expect(p.element.querySelector('.f1t-tyre-label').textContent).toBe('MEDIUM');
  });

  test('loadTelemetry ok -> stints+pits + loading=false', async () => {
    const fetchStints = vi.fn().mockResolvedValue(STINTS_DATA);
    const fetchPits   = vi.fn().mockResolvedValue(PITS_DATA);
    const p = createF1TelemetryPanel({ fetchStints, fetchPits });
    await p.loadTelemetry();
    expect(p._state.stints).toEqual(STINTS_DATA);
    expect(p._state.pits).toEqual(PITS_DATA);
    expect(p._state.loading).toBe(false);
  });

  test('loadTelemetry error -> error + loading=false', async () => {
    const fetchStints = vi.fn().mockRejectedValue(new Error('stints down'));
    const p = createF1TelemetryPanel({ fetchStints });
    await p.loadTelemetry();
    expect(p._state.error).toBe('stints down');
    expect(p._state.loading).toBe(false);
  });

  test('loadTelemetry sin getToken -> llama fetchStints con ""', async () => {
    const fetchStints = vi.fn().mockResolvedValue(STINTS_DATA);
    const fetchPits   = vi.fn().mockResolvedValue(PITS_DATA);
    const p = createF1TelemetryPanel({ fetchStints, fetchPits });
    await p.loadTelemetry();
    expect(fetchStints).toHaveBeenCalledWith('');
  });

  test('loadTelemetry sin fetchStints/Pits -> stints=null, pits=null', async () => {
    const p = createF1TelemetryPanel({});
    await p.loadTelemetry();
    expect(p._state.stints).toBeNull();
    expect(p._state.pits).toBeNull();
  });
});
