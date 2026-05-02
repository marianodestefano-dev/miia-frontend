import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const miiadtLand = require('../assets/miiadt-panels/miiadt-land.js');

describe('miiadt-land.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  // ── handleNav ─────────────────────────────────────────────────────────

  test('handleNav signup redirige a login?mode=signup', () => {
    const loc = { href: '' };
    miiadtLand.handleNav('signup', loc);
    expect(loc.href).toBe('/login.html?mode=signup&product=miiadt');
  });

  test('handleNav login redirige a login?mode=login', () => {
    const loc = { href: '' };
    miiadtLand.handleNav('login', loc);
    expect(loc.href).toBe('/login.html?mode=login&product=miiadt');
  });

  test('handleNav sin location no lanza error', () => {
    expect(() => miiadtLand.handleNav('signup', null)).not.toThrow();
  });

  // ── scrollToSection ───────────────────────────────────────────────────

  test('scrollToSection llama scrollIntoView si el elemento existe', () => {
    const mockEl = { scrollIntoView: vi.fn() };
    const mockDoc = { getElementById: vi.fn(() => mockEl) };
    miiadtLand.scrollToSection('features', mockDoc);
    expect(mockDoc.getElementById).toHaveBeenCalledWith('features');
    expect(mockEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  test('scrollToSection no lanza error si elemento no existe', () => {
    const mockDoc = { getElementById: vi.fn(() => null) };
    expect(() => miiadtLand.scrollToSection('nope', mockDoc)).not.toThrow();
  });

  test('scrollToSection sin doc no lanza error', () => {
    expect(() => miiadtLand.scrollToSection('features', null)).not.toThrow();
  });
});
