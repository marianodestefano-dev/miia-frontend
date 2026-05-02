import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const createMercadoPanel = require('../assets/miiadt-panels/mercado-panel.js');

const FUTURE = new Date(Date.now() + 7200000).toISOString(); // +2h
const PAST   = new Date(Date.now() - 1000).toISOString();    // -1s

const MARKET_DATA = {
  bids: [
    { id: 'b1', playerName: 'Messi', currentBid: 5000, expiresAt: FUTURE },
    { id: 'b2', playerName: 'Ronaldo', currentBid: 4000, expiresAt: PAST },
  ],
};

describe('mercado-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('opts null crea panel sin error', () => {
    const p = createMercadoPanel(null);
    expect(p.element).toBeDefined();
    expect(p._state.market).toBeNull();
  });

  test('initial render estado inicial sin loading', () => {
    const p = createMercadoPanel({});
    expect(p._state.loading).toBe(false);
  });

  test('_setState loading=true muestra Cargando', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: true });
    expect(p.element.querySelector('.mercado-loading').textContent).toBe('Cargando...');
  });

  test('_setState error muestra mensaje de error', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, error: 'Error de red' });
    expect(p.element.querySelector('.mercado-error').textContent).toBe('Error de red');
  });

  test('market null muestra Sin mercado disponible', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, market: null });
    expect(p.element.querySelector('.mercado-empty').textContent).toContain('Sin mercado');
  });

  test('bids vacias muestra Sin pujas activas', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, market: { bids: [] } });
    expect(p.element.querySelector('.mercado-no-bids').textContent).toBe('Sin pujas activas');
  });

  test('bids sin key usa fallback []', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, market: {} });
    expect(p.element.querySelector('.mercado-no-bids')).not.toBeNull();
  });

  test('bids renderiza cards', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, market: MARKET_DATA });
    expect(p.element.querySelectorAll('.mercado-bid-card').length).toBe(2);
  });

  test('bid card muestra playerName y currentBid', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, market: MARKET_DATA });
    const cards = p.element.querySelectorAll('.mercado-bid-card');
    expect(cards[0].querySelector('.mercado-bid-player').textContent).toBe('Messi');
    expect(cards[0].querySelector('.mercado-bid-amount').textContent).toBe('5000');
  });

  test('bid con expiresAt futuro muestra tiempo restante', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, market: MARKET_DATA });
    const card = p.element.querySelectorAll('.mercado-bid-card')[0];
    // Debe contener 'h' y 'm' (ej: '1h 59m')
    expect(card.querySelector('.mercado-bid-time').textContent).toMatch(/\d+h \d+m/);
  });

  test('bid con expiresAt pasado muestra Expirada', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, market: MARKET_DATA });
    const card = p.element.querySelectorAll('.mercado-bid-card')[1];
    expect(card.querySelector('.mercado-bid-time').textContent).toBe('Expirada');
  });

  test('bid sin expiresAt muestra Sin tiempo', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, market: { bids: [{ id: 'x' }] } });
    const card = p.element.querySelector('.mercado-bid-card');
    expect(card.querySelector('.mercado-bid-time').textContent).toBe('Sin tiempo');
  });

  test('bid sin playerName usa Jugador', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, market: { bids: [{ id: 'x', currentBid: 100 }] } });
    const card = p.element.querySelector('.mercado-bid-card');
    expect(card.querySelector('.mercado-bid-player').textContent).toBe('Jugador');
  });

  test('bid sin currentBid muestra 0', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, market: { bids: [{ playerName: 'X' }] } });
    const card = p.element.querySelector('.mercado-bid-card');
    expect(card.querySelector('.mercado-bid-amount').textContent).toBe('0');
  });

  test('click Pujar llama onBid con bid.id', () => {
    const onBid = vi.fn();
    const p = createMercadoPanel({ onBid });
    p._setState({ loading: false, market: MARKET_DATA });
    p.element.querySelector('.mercado-bid-btn').click();
    expect(onBid).toHaveBeenCalledWith('b1');
  });

  test('click Pujar en bid sin id llama onBid con null', () => {
    const onBid = vi.fn();
    const p = createMercadoPanel({ onBid });
    p._setState({ loading: false, market: { bids: [{ playerName: 'X' }] } });
    p.element.querySelector('.mercado-bid-btn').click();
    expect(onBid).toHaveBeenCalledWith(null);
  });

  test('default onBid click no lanza error', () => {
    const p = createMercadoPanel({});
    p._setState({ loading: false, market: MARKET_DATA });
    expect(() => p.element.querySelector('.mercado-bid-btn').click()).not.toThrow();
  });

  test('load sets market + loading=false', async () => {
    const fetchMarket = vi.fn().mockResolvedValue(MARKET_DATA);
    const p = createMercadoPanel({ fetchMarket });
    await p.load();
    expect(p._state.market).toEqual(MARKET_DATA);
    expect(p._state.loading).toBe(false);
  });

  test('load error sets error + loading=false', async () => {
    const fetchMarket = vi.fn().mockRejectedValue(new Error('timeout'));
    const p = createMercadoPanel({ fetchMarket });
    await p.load();
    expect(p._state.error).toBe('timeout');
    expect(p._state.loading).toBe(false);
  });

  test('load sin fetchMarket usa default null', async () => {
    const p = createMercadoPanel({});
    await p.load();
    expect(p._state.market).toBeNull();
  });

  test('load sin getToken usa default token vacio', async () => {
    const fetchMarket = vi.fn().mockResolvedValue(MARKET_DATA);
    const p = createMercadoPanel({ fetchMarket });
    await p.load();
    expect(fetchMarket).toHaveBeenCalledWith('');
  });
});
