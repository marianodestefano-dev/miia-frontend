import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { handleNav, scrollToSection } = require('../assets/miiadt-panels/miiadt-land.js');

describe('miiadt-land.js', () => {
  // handleNav
  test('handleNav sin location -> no lanza error', () => {
    expect(() => handleNav('signup', null)).not.toThrow();
    expect(() => handleNav('login', undefined)).not.toThrow();
  });

  test('handleNav signup -> location.href = signup URL', () => {
    const loc = {};
    handleNav('signup', loc);
    expect(loc.href).toContain('mode=signup');
    expect(loc.href).toContain('product=miiadt');
  });

  test('handleNav cualquier otra accion -> location.href = login URL', () => {
    const loc = {};
    handleNav('login', loc);
    expect(loc.href).toContain('mode=login');
  });

  // scrollToSection
  test('scrollToSection sin doc -> no lanza error', () => {
    expect(() => scrollToSection('hero', null)).not.toThrow();
  });

  test('scrollToSection elemento existe -> llama scrollIntoView', () => {
    const mockEl = { scrollIntoView: vi.fn() };
    const mockDoc = { getElementById: vi.fn().mockReturnValue(mockEl) };
    scrollToSection('hero', mockDoc);
    expect(mockDoc.getElementById).toHaveBeenCalledWith('hero');
    expect(mockEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  test('scrollToSection elemento NO existe -> no lanza error', () => {
    const mockDoc = { getElementById: vi.fn().mockReturnValue(null) };
    expect(() => scrollToSection('no-existe', mockDoc)).not.toThrow();
  });
});
