/**
 * pages-coverage.spec.js — cobertura UI fuera de MiiaF1
 *
 * Tests estáticos de source HTML para: login, dashboard home, gestionar
 * (contactos + negocios), analitica, y conexión WhatsApp.
 *
 * Todos son source-inspection — no requieren servidor HTTP ni auth.
 */

// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOGIN_HTML = fs.readFileSync(path.join(ROOT, 'login.html'), 'utf8');
const DASH_HTML = fs.readFileSync(path.join(ROOT, 'owner-dashboard-v2.html'), 'utf8');

// ── Login page ───────────────────────────────────────────────────────────────

test('LOGIN.1 — login.html tiene form con campos email y password', () => {
  expect(LOGIN_HTML).toContain('type="email"');
  expect(LOGIN_HTML).toContain('type="password"');
});

test('LOGIN.2 — login.html tiene botón de submit visible', () => {
  expect(LOGIN_HTML).toContain('btn-submit');
  expect(LOGIN_HTML).toMatch(/type="submit"|btn-submit/);
});

// ── Dashboard home ───────────────────────────────────────────────────────────

test('DASH.1 — owner-dashboard-v2.html tiene sección home activa por defecto', () => {
  expect(DASH_HTML).toContain('id="sec-home"');
  expect(DASH_HTML).toMatch(/id="sec-home"[^>]*class="miia-section active"|class="miia-section active"[^>]*id="sec-home"/);
});

test('DASH.2 — nav contiene las 5 tabs: Inicio, Actividad, Gestionar, Analitica, MiiaF1', () => {
  expect(DASH_HTML).toContain("showSection('home'");
  expect(DASH_HTML).toContain("showSection('actividad'");
  expect(DASH_HTML).toContain("showSection('gestionar'");
  expect(DASH_HTML).toContain("showSection('analitica'");
  expect(DASH_HTML).toContain("showSection('f1'");
});

// ── Gestionar: negocios + contactos ─────────────────────────────────────────

test('GEST.1 — sección Gestionar contiene panels gest-negocios y gest-contactos', () => {
  expect(DASH_HTML).toContain('id="gest-negocios"');
  expect(DASH_HTML).toContain('id="gest-contactos"');
});

// ── Analítica ────────────────────────────────────────────────────────────────

test('ANALITICA.1 — sección Analitica existe con título correcto', () => {
  expect(DASH_HTML).toContain('id="sec-analitica"');
  expect(DASH_HTML).toContain('Analitica');
});

// ── WhatsApp connection ──────────────────────────────────────────────────────

test('WA.1 — dashboard tiene indicador de estado WA y botón de conexión', () => {
  expect(DASH_HTML).toContain('id="waLabel"');
  expect(DASH_HTML).toContain('openQRModal()');
  expect(DASH_HTML).toContain('Vincular WhatsApp');
});
