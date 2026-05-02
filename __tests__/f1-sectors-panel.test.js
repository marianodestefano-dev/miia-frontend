import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const createF1SectorsPanel = require('../assets/f1-panels/f1-sectors-panel.js');

const LAP_DATA = [
  { driver_number: 1, driver_acronym: 'VER', s1: 28.5, s2: 35.0, s3: 27.0 },
  { driver_number: 11, driver_acronym: 'PER', s1: 29.0, s2: 34.5, s3: 27.5 },
  { driver_number: 44, driver_acronym: 'HAM', s1: 28.5, s2: 35.5, s3: 27.0 },
];

describe('f1-sectors-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  // constructor
  test('opts null -> panel creado', () => {
    const p = createF1SectorsPanel(null);
    expect(p.element).toBeDefined();
    expect(p._state.loading).toBe(false);
  });

  test('initial render -> contenido vacio (null data)', () => {
    const p = createF1SectorsPanel({});
    const empty = p.element.querySelector('.f1s-empty');
    expect(empty).not.toBeNull();
    expect(empty.textContent).toContain('Sin datos');
  });

  // loading
  test('_setState loading=true muestra Cargando sectores', () => {
    const p = createF1SectorsPanel({});
    p._setState({ loading: true });
    const el = p.element.querySelector('.f1s-loading');
    expect(el).not.toBeNull();
    expect(el.textContent).toBe('Cargando sectores...');
  });

  // error
  test('_setState error muestra error', () => {
    const p = createF1SectorsPanel({});
    p._setState({ loading: false, error: 'Fallo S1' });
    expect(p.element.querySelector('.f1s-error').textContent).toBe('Fallo S1');
  });

  // empty array
  test('data vacia (array vacio) -> Sin vueltas disponibles', () => {
    const p = createF1SectorsPanel({});
    p._setState({ loading: false, data: [] });
    expect(p.element.querySelector('.f1s-empty').textContent).toContain('Sin vueltas');
  });

  // valid data — sectors
  test('data con laps -> renderiza tabla con filas', () => {
    const p = createF1SectorsPanel({});
    p._setState({ loading: false, data: LAP_DATA });
    expect(p.element.querySelectorAll('.f1s-row').length).toBe(3);
  });

  test('fastest S1 tiene clase f1s-green', () => {
    const p = createF1SectorsPanel({});
    p._setState({ loading: false, data: LAP_DATA });
    const rows = p.element.querySelectorAll('.f1s-row');
    // VER s1=28.5 === min, HAM s1=28.5 === min -> both green
    const s1Cells = [...rows].map(r => r.querySelectorAll('.f1s-sector')[0]);
    expect(s1Cells[0].classList.contains('f1s-green')).toBe(true);
    expect(s1Cells[1].classList.contains('f1s-yellow')).toBe(true);
    expect(s1Cells[2].classList.contains('f1s-green')).toBe(true);
  });

  test('fastest S2 (PER 34.5) tiene f1s-green, otros f1s-yellow', () => {
    const p = createF1SectorsPanel({});
    p._setState({ loading: false, data: LAP_DATA });
    const rows = p.element.querySelectorAll('.f1s-row');
    const s2Cells = [...rows].map(r => r.querySelectorAll('.f1s-sector')[1]);
    expect(s2Cells[1].classList.contains('f1s-green')).toBe(true);
    expect(s2Cells[0].classList.contains('f1s-yellow')).toBe(true);
  });

  test('sector null -> clase f1s-none y texto —', () => {
    const p = createF1SectorsPanel({});
    p._setState({ loading: false, data: [{ driver_number: 1, s1: null, s2: null, s3: null }] });
    const sectors = p.element.querySelectorAll('.f1s-sector');
    expect(sectors[0].classList.contains('f1s-none')).toBe(true);
    expect(sectors[0].textContent).toBe('—');
  });

  test('driver sin acronym usa driver_number como fallback', () => {
    const p = createF1SectorsPanel({});
    p._setState({ loading: false, data: [{ driver_number: 99, s1: 30.0, s2: 35.0, s3: 28.0 }] });
    const driver = p.element.querySelector('.f1s-driver');
    expect(driver.textContent).toBe('99');
  });

  // loadSectors
  test('loadSectors ok -> sets data + loading=false', async () => {
    const fetchLaps = vi.fn().mockResolvedValue(LAP_DATA);
    const p = createF1SectorsPanel({ fetchLaps });
    await p.loadSectors();
    expect(p._state.data).toEqual(LAP_DATA);
    expect(p._state.loading).toBe(false);
  });

  test('loadSectors error -> sets error + loading=false', async () => {
    const fetchLaps = vi.fn().mockRejectedValue(new Error('laps fail'));
    const p = createF1SectorsPanel({ fetchLaps });
    await p.loadSectors();
    expect(p._state.error).toBe('laps fail');
    expect(p._state.loading).toBe(false);
  });

  test('loadSectors sin fetchLaps -> data=null', async () => {
    const p = createF1SectorsPanel({});
    await p.loadSectors();
    expect(p._state.data).toBeNull();
  });

  test('loadSectors sin getToken -> llama fetchLaps con ""', async () => {
    const fetchLaps = vi.fn().mockResolvedValue(LAP_DATA);
    const p = createF1SectorsPanel({ fetchLaps });
    await p.loadSectors();
    expect(fetchLaps).toHaveBeenCalledWith('');
  });

  test('driver sin acronym ni driver_number -> acronym usa ? (L20)', () => {
    const p = createF1SectorsPanel({});
    // No driver_number, no driver_acronym -> String(undefined || '?') = '?'
    p._setState({ loading: false, data: [{ s1: 30.0, s2: 35.0, s3: 28.0 }] });
    const driver = p.element.querySelector('.f1s-driver');
    expect(driver.textContent).toBe('?');
  });
});
