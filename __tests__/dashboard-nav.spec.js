/**
 * dashboard-nav.spec.js — T152 (refresh post Wi rebuild)
 * Tests estaticos para nueva nav sidebar en owner-dashboard.html.
 * Base V2 puro + sidebar colapsible + 13 secciones en esquema V2.
 */
// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DASHBOARD_PATH = path.join(__dirname, '..', 'owner-dashboard.html');
const SOURCE_HTML = fs.readFileSync(DASHBOARD_PATH, 'utf8');

test('T152.1 - sidebar tiene 4 grupos: MIIA / CUENTA / CONEXIONES / ADDONS', async () => {
  expect(SOURCE_HTML).toMatch(/id="grp-miia"/);
  expect(SOURCE_HTML).toMatch(/id="grp-cuenta"/);
  expect(SOURCE_HTML).toMatch(/id="grp-conexiones"/);
  expect(SOURCE_HTML).toMatch(/id="grp-addons"/);
});

test('T152.2 - 13 secciones presentes en V2 schema', async () => {
  const expected = ['home','actividad','gestionar','analitica','plan','seguridad','privacidad','mis-datos','whatsapp','integraciones','miiadt','ludomiia','f1'];
  for (const id of expected) expect(SOURCE_HTML).toContain('id="sec-' + id + '"');
});

test('T152.3 - showSection actualiza .sidebar-item activo', async () => {
  expect(SOURCE_HTML).toMatch(/function showSection\(sectionId/);
  expect(SOURCE_HTML).toMatch(/document\.querySelectorAll\(['"]\.sidebar-item['"]\)/);
});

test('T152.4 - toggleSidebarGroup togglea clase collapsed en el grupo', async () => {
  expect(SOURCE_HTML).toMatch(/function toggleSidebarGroup\(grpId\)/);
  expect(SOURCE_HTML).toMatch(/grp\.classList\.toggle\(['"]collapsed['"]\)/);
});

test('T152.5 - applyFounderAddons + FOUNDER_UID', async () => {
  expect(SOURCE_HTML).toContain("FOUNDER_UID = 'bq2BbtCVF8cZo30tum584zrGATJ3'");
  expect(SOURCE_HTML).toContain('admin_founder');
  expect(SOURCE_HTML).toMatch(/function applyFounderAddons/);
  expect(SOURCE_HTML).toMatch(/grp\.style\.display = isFounder/);
});

test('T152.6 - openMobileSidebar/closeMobileSidebar definidos', async () => {
  expect(SOURCE_HTML).toMatch(/function openMobileSidebar/);
  expect(SOURCE_HTML).toMatch(/function closeMobileSidebar/);
  expect(SOURCE_HTML).toMatch(/sb\.classList\.add\(['"]mobile-open['"]\)/);
});

test('T152.7 - toggleSidebar persiste collapsed en localStorage', async () => {
  expect(SOURCE_HTML).toMatch(/function toggleSidebar/);
  expect(SOURCE_HTML).toMatch(/localStorage\.setItem\(['"]sidebarCollapsed['"]/);
});

test('T152.8 - showSection dispara hooks por seccion', async () => {
  expect(SOURCE_HTML).toMatch(/sectionId === ['"]plan['"][^]*loadPlanInfo/);
  expect(SOURCE_HTML).toMatch(/sectionId === ['"]privacidad['"][^]*initPrivacySection/);
  expect(SOURCE_HTML).toMatch(/sectionId === ['"]whatsapp['"][^]*loadAIConfig/);
  expect(SOURCE_HTML).toMatch(/sectionId === ['"]mis-datos['"][^]*loadPrivacyReport/);
});

test('T152.9 - Estructura HTML valida (single body/html)', async () => {
  expect((SOURCE_HTML.match(/<\/body>/g) || []).length).toBe(1);
  expect((SOURCE_HTML.match(/<\/html>/g) || []).length).toBe(1);
});

test('T152.10 - Widget WhatsApp en home (T158)', async () => {
  expect(SOURCE_HTML).toContain('id="waWidgetCard"');
  expect(SOURCE_HTML).toContain('id="waWidgetDot"');
  expect(SOURCE_HTML).toContain('id="waWidgetLabel"');
});

test('T152.11 - Funciones nuevas reescritas en V2 schema', async () => {
  const fns = ['subscribe', 'addSecurityContact', 'saveDisclaimerMode', 'initPrivacySection',
               'loadPrivacyReport', 'requestForgetMe', 'connectCalendar', 'loadAIConfig',
               'saveAIConfig', 'testAIConnection'];
  for (const fn of fns) {
    const has = SOURCE_HTML.includes('function ' + fn) || SOURCE_HTML.includes('async function ' + fn);
    expect(has).toBe(true);
  }
});

test('T152.12 - Sidebar arrow CSS sin BE text', async () => {
  // Buscar en styles-v2.css
  const cssPath = path.join(__dirname, '..', 'styles-v2.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  expect(css).not.toMatch(/\.sidebar-grp-hdr::after\s*\{[^}]*content:\s*['"]BE['"]/);
  expect(css).toMatch(/\.sidebar-grp-hdr::after/);
  expect(css.indexOf(String.fromCharCode(92) + "25BE") >= 0).toBe(true);
});

test('T152.13 - Sidebar items match section IDs', async () => {
  const sidebarItems = (SOURCE_HTML.match(/data-section="([\w-]+)"/g) || []).map(m => m.match(/"([\w-]+)"/)[1]);
  const sectionIds = (SOURCE_HTML.match(/id="sec-([\w-]+)"/g) || []).map(m => m.match(/sec-([\w-]+)"/)[1]);
  for (const si of sidebarItems) {
    expect(sectionIds).toContain(si);
  }
});
