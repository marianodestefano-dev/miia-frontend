/**
 * dashboard-nav.spec.js — T152
 * Tests Playwright para nueva nav sidebar de owner-dashboard.html.
 *
 * Cubre: showSection, toggleSidebarGroup, founder ADDONS, mobile breakpoint,
 *        section IDs, sidebar groups, JS functions present, anti-regression
 *        de los 3 bugs reportados (BE text, MIIA EN VIVO huerfano, nav-bottom huerfano).
 */

// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DASHBOARD_PATH = path.join(__dirname, '..', 'owner-dashboard.html');
const SOURCE_HTML = fs.readFileSync(DASHBOARD_PATH, 'utf8');

// 1
test('T152.1 - sidebar tiene 4 grupos: MIIA / CUENTA / CONEXIONES / ADDONS', async () => {
  expect(SOURCE_HTML).toMatch(/id="grp-miia"/);
  expect(SOURCE_HTML).toMatch(/id="grp-cuenta"/);
  expect(SOURCE_HTML).toMatch(/id="grp-conexiones"/);
  expect(SOURCE_HTML).toMatch(/id="grp-addons"/);
});

// 2
test('T152.2 - 13 secciones presentes: home/actividad/.../f1', async () => {
  const expected = ['home','actividad','gestionar','analitica','plan','seguridad','privacidad','mis-datos','whatsapp','integraciones','miiadt','ludomiia','f1'];
  for (const id of expected) {
    expect(SOURCE_HTML).toContain('id="sec-' + id + '"');
  }
});

// 3
test('T152.3 - showSection actualiza .sidebar-item activo (no nav-link)', async () => {
  expect(SOURCE_HTML).toMatch(/function showSection\(sectionId/);
  expect(SOURCE_HTML).toMatch(/document\.querySelectorAll\(['"]\.sidebar-item['"]\)/);
});

// 4
test('T152.4 - toggleSidebarGroup colapsa items del grupo', async () => {
  expect(SOURCE_HTML).toMatch(/function toggleSidebarGroup\(grpId\)/);
  expect(SOURCE_HTML).toMatch(/grp\.classList\.toggle\(['"]open['"]\)/);
});

// 5 - Founder ADDONS
test('T152.5 - Founder UID + admin_founder check oculta/muestra ADDONS', async () => {
  expect(SOURCE_HTML).toContain("FOUNDER_UID = 'bq2BbtCVF8cZo30tum584zrGATJ3'");
  expect(SOURCE_HTML).toContain('admin_founder');
  expect(SOURCE_HTML).toMatch(/addonsGrp\.style\.display = isFounder/);
});

// 6 - Mobile sidebar
test('T152.6 - openMobileSidebar/closeMobileSidebar definidos', async () => {
  expect(SOURCE_HTML).toMatch(/function openMobileSidebar/);
  expect(SOURCE_HTML).toMatch(/function closeMobileSidebar/);
  expect(SOURCE_HTML).toMatch(/sb\.classList\.add\(['"]mobile-open['"]\)/);
});

// 7 - Profile menu / sidebar collapse persistence
test('T152.7 - toggleSidebar persiste collapsed en localStorage', async () => {
  expect(SOURCE_HTML).toMatch(/function toggleSidebar/);
  expect(SOURCE_HTML).toMatch(/localStorage\.setItem\(['"]sidebarCollapsed['"]/);
  expect(SOURCE_HTML).toMatch(/sidebarCollapsed/);
});

// 8 - Section JS hooks
test('T152.8 - showSection dispara loadAIConfig/loadPlanInfo/initPrivacySection', async () => {
  expect(SOURCE_HTML).toMatch(/sectionId === ['"]plan['"][^]*loadPlanInfo/);
  expect(SOURCE_HTML).toMatch(/sectionId === ['"]privacidad['"][^]*initPrivacySection/);
  expect(SOURCE_HTML).toMatch(/sectionId === ['"]whatsapp['"][^]*loadAIConfig/);
});

// ── ANTI-REGRESSION: 3 bugs Wi corrigio en 08704e1 ──────────────────────────

// 9 - Bug 1: BE text NO debe estar en sidebar headers
test('T152.9 (anti-regr) - sidebar-grp-hdr::after content NO es "BE"', async () => {
  expect(SOURCE_HTML).not.toMatch(/\.sidebar-grp-hdr::after\s*\{[^}]*content:\s*['"]BE['"]/);
  // arrow Unicode U+25BE present
  const hasArrow = SOURCE_HTML.includes('25BE') || SOURCE_HTML.includes('▾') || SOURCE_HTML.includes('▾');
  expect(hasArrow).toBe(true);
});

// 10 - Bug 2: <aside class="miia-feed"> NO debe existir
test('T152.10 (anti-regr) - <aside class="miia-feed"> eliminado', async () => {
  expect(SOURCE_HTML).not.toContain('<aside class="miia-feed"');
  expect(SOURCE_HTML).not.toMatch(/class=['"]miia-feed['"]/);
});

// 11 - Bug 3: <nav class="miia-nav-bottom"> NO debe existir
test('T152.11 (anti-regr) - <nav class="miia-nav-bottom"> eliminado', async () => {
  expect(SOURCE_HTML).not.toContain('<nav class="miia-nav-bottom"');
  expect(SOURCE_HTML).not.toContain('miia-nav-bottom-link');
});

// 12 - HTML estructura
test('T152.12 - single </body> y single </html>', async () => {
  expect((SOURCE_HTML.match(/<\/body>/g) || []).length).toBe(1);
  expect((SOURCE_HTML.match(/<\/html>/g) || []).length).toBe(1);
});
