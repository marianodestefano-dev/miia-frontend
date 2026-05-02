import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const createF1GapPanel = require('../assets/f1-panels/f1-gap-panel.js');

const INTERVALS_DATA = [
  { driver_number: 1,  gap_to_leader: 0,    interval: null },
  { driver_number: 11, gap_to_leader: 2.5,  interval: 2.5 },
  { driver_number: 44, gap_to_leader: 5.0,  interval: 2.5 },
];

describe('f1-gap-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('opts null -> panel creado', () => {
    const p = createF1GapPanel(null);
    expect(p.element).toBeDefined();
  });

  test('initial render -> Sin datos de gaps', () => {
    const p = createF1GapPanel({});
    expect(p.element.querySelector('.f1g-empty').textContent).toContain('Sin datos de gaps');
  });

  test('_setState loading=true -> Cargando gaps', () => {
    const p = createF1GapPanel({});
    p._setState({ loading: true });
    expect(p.element.querySelector('.f1g-loading').textContent).toBe('Cargando gaps...');
  });

  test('_setState error -> muestra error', () => {
    const p = createF1GapPanel({});
    p._setState({ loading: false, error: 'Timeout' });
    expect(p.element.querySelector('.f1g-error').textContent).toBe('Timeout');
  });

  test('data vacia (array) -> Sin intervalos', () => {
    const p = createF1GapPanel({});
    p._setState({ loading: false, data: [] });
    expect(p.element.querySelector('.f1g-empty').textContent).toContain('Sin intervalos');
  });

  test('data con intervals -> renderiza filas', () => {
    const p = createF1GapPanel({});
    p._setState({ loading: false, data: INTERVALS_DATA });
    expect(p.element.querySelectorAll('.f1g-row').length).toBe(3);
  });

  test('gap_to_leader=0 -> muestra +0.000', () => {
    const p = createF1GapPanel({});
    p._setState({ loading: false, data: INTERVALS_DATA });
    const rows = p.element.querySelectorAll('.f1g-row');
    expect(rows[0].querySelector('.f1g-gap-leader').textContent).toBe('+0.000');
  });

  test('interval=null -> muestra —', () => {
    const p = createF1GapPanel({});
    p._setState({ loading: false, data: INTERVALS_DATA });
    const rows = p.element.querySelectorAll('.f1g-row');
    expect(rows[0].querySelector('.f1g-interval').textContent).toBe('—');
  });

  test('interval string (como "LAP") -> muestra el string', () => {
    const p = createF1GapPanel({});
    p._setState({ loading: false, data: [{ driver_number: 1, gap_to_leader: 'LAP', interval: 'LAP' }] });
    const row = p.element.querySelector('.f1g-row');
    expect(row.querySelector('.f1g-gap-leader').textContent).toBe('LAP');
  });

  test('interval vacio "" -> muestra —', () => {
    const p = createF1GapPanel({});
    p._setState({ loading: false, data: [{ driver_number: 1, gap_to_leader: '', interval: '' }] });
    const row = p.element.querySelector('.f1g-row');
    expect(row.querySelector('.f1g-gap-leader').textContent).toBe('—');
  });

  test('loadIntervals ok -> data + loading=false', async () => {
    const fetchIntervals = vi.fn().mockResolvedValue(INTERVALS_DATA);
    const p = createF1GapPanel({ fetchIntervals });
    await p.loadIntervals();
    expect(p._state.data).toEqual(INTERVALS_DATA);
    expect(p._state.loading).toBe(false);
  });

  test('loadIntervals error -> error + loading=false', async () => {
    const fetchIntervals = vi.fn().mockRejectedValue(new Error('net fail'));
    const p = createF1GapPanel({ fetchIntervals });
    await p.loadIntervals();
    expect(p._state.error).toBe('net fail');
    expect(p._state.loading).toBe(false);
  });

  test('loadIntervals sin fetchIntervals -> data=null', async () => {
    const p = createF1GapPanel({});
    await p.loadIntervals();
    expect(p._state.data).toBeNull();
  });

  test('loadIntervals sin getToken -> llama con ""', async () => {
    const fetchIntervals = vi.fn().mockResolvedValue(INTERVALS_DATA);
    const p = createF1GapPanel({ fetchIntervals });
    await p.loadIntervals();
    expect(fetchIntervals).toHaveBeenCalledWith('');
  });
});
