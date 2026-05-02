const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DSA_PATH = path.join(__dirname, '..', 'assets', 'v2-design-system.css');
const DSA_CSS = fs.readFileSync(DSA_PATH, 'utf8');

test('DSA.1 - existe en assets/', () => {
  expect(fs.existsSync(DSA_PATH)).toBe(true);
});

test('DSA.2 - contiene tokens core (--miia-cyan, --miia-violet, --accent, --r-md)', () => {
  expect(DSA_CSS).toContain('--miia-cyan');
  expect(DSA_CSS).toContain('--miia-violet');
  expect(DSA_CSS).toContain('--miia-rose');
  expect(DSA_CSS).toContain('--accent:');
  expect(DSA_CSS).toContain('--r-md:');
  expect(DSA_CSS).toContain('--bg-card:');
  expect(DSA_CSS).toContain('--text-1:');
});

test('DSA.3 - themes light + dark', () => {
  expect(DSA_CSS).toMatch(/\[data-theme="dark"\]/);
  expect(DSA_CSS).toMatch(/\[data-theme="light"\]/);
});

test('DSA.4 - reset universal', () => {
  expect(DSA_CSS).toMatch(/\*,\s*\*::before,\s*\*::after/);
});

test('DSA.5 - layout base classes', () => {
  expect(DSA_CSS).toContain('.miia-app');
  expect(DSA_CSS).toContain('.miia-body');
  expect(DSA_CSS).toContain('.miia-main');
  expect(DSA_CSS).toContain('.miia-section');
});

test('DSA.6 - botones core', () => {
  expect(DSA_CSS).toContain('.btn');
  expect(DSA_CSS).toContain('.btn-primary');
  expect(DSA_CSS).toContain('.btn-secondary');
});

test('DSA.7 - card + section-header', () => {
  expect(DSA_CSS).toContain('.card');
  expect(DSA_CSS).toContain('.card-title');
  expect(DSA_CSS).toContain('.section-header');
  expect(DSA_CSS).toContain('.section-title');
});

test('DSA.8 - sidebar colapsable', () => {
  expect(DSA_CSS).toContain('.miia-sidebar');
  expect(DSA_CSS).toContain('.sidebar-grp');
  expect(DSA_CSS).toContain('.sidebar-item');
  expect(DSA_CSS).toMatch(/\.miia-sidebar\.collapsed/);
  expect(DSA_CSS).toMatch(/\.miia-sidebar\.mobile-open/);
});

test('DSA.9 - WhatsApp widget + dot', () => {
  expect(DSA_CSS).toContain('.wa-widget');
  expect(DSA_CSS).toMatch(/\.wa-widget\.connected/);
  expect(DSA_CSS).toContain('.wa-dot');
  expect(DSA_CSS).toMatch(/\.wa-dot\.connected/);
});

test('DSA.10 - toast + tooltip', () => {
  expect(DSA_CSS).toContain('.toast');
  expect(DSA_CSS).toMatch(/data-tooltip/);
});

test('DSA.11 - balance braces { } igual', () => {
  const opens = (DSA_CSS.match(/\{/g) || []).length;
  const closes = (DSA_CSS.match(/\}/g) || []).length;
  expect(opens).toBe(closes);
});

test('DSA.12 - NO contiene componentes especificos del owner-dashboard', () => {
  // No timeline, hero, wizard, gestionar-*, F1, feed cruft, nav-bottom
  expect(DSA_CSS).not.toContain('.timeline');
  expect(DSA_CSS).not.toMatch(/\.hero-greeting/);
  expect(DSA_CSS).not.toMatch(/\.wizard-/);
  expect(DSA_CSS).not.toMatch(/\.gestionar-tab/);
  expect(DSA_CSS).not.toMatch(/\.miia-feed[^a-z-]/);
  expect(DSA_CSS).not.toContain('.miia-nav-bottom');
});

test('DSA.13 - header doc presente con firma', () => {
  expect(DSA_CSS).toMatch(/MIIA Design System v4/);
  expect(DSA_CSS).toMatch(/F4\.0/);
  expect(DSA_CSS).toMatch(/Mariano firma viva/);
  expect(DSA_CSS).toMatch(/Vi \(Tecnica MIIA\)/);
});
