/**
 * miiadt-landing.spec.js — ARQ-TEST-E2E MIIADT landing page
 *
 * E2E estructural de miiadt.html (verificación fuente estática).
 * No requiere servidor — lee SOURCE_HTML directamente.
 *
 * Cobertura:
 *   MIIADT-E2E-1  — title + charset + viewport
 *   MIIADT-E2E-2  — v2-design-system.css referenciado
 *   MIIADT-E2E-3  — nav: logo MIIADT + botones login/signup
 *   MIIADT-E2E-4  — hero badge + headline + CTAs
 *   MIIADT-E2E-5  — handleNav('signup') en hero CTA
 *   MIIADT-E2E-6  — scrollTo('features') en "Ver funciones"
 *   MIIADT-E2E-7  — stats strip: 50K+, 500+, 20+
 *   MIIADT-E2E-8  — 6 feature cards presentes
 *   MIIADT-E2E-9  — feature card titles correctos
 *   MIIADT-E2E-10 — pricing: MIIADT Premium + USD 9.99
 *   MIIADT-E2E-11 — pricing: 7 items incluidos
 *   MIIADT-E2E-12 — pricing CTA handleNav signup
 *   MIIADT-E2E-13 — sin Stripe
 *   MIIADT-E2E-14 — paleta #7C3AED + #00E5FF presentes
 *   MIIADT-E2E-15 — miiadt-land.js script referenciado
 *   MIIADT-E2E-16 — footer copyright 2026 MIIA
 *   MIIADT-E2E-17 — sección features tiene id="features"
 *   MIIADT-E2E-18 — sección pricing tiene id="pricing"
 */

// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '..', 'miiadt.html');
const SOURCE_HTML = fs.readFileSync(HTML_PATH, 'utf8');

// ── MIIADT-E2E-1 — title + charset + viewport ─────────────────────────────────
test('MIIADT-E2E-1 — title correcto y charset UTF-8', () => {
  expect(SOURCE_HTML).toContain('<title>MIIADT — Fantasy Football LATAM</title>');
  expect(SOURCE_HTML).toContain('charset="UTF-8"');
  expect(SOURCE_HTML).toContain('name="viewport"');
});

// ── MIIADT-E2E-2 — v2-design-system.css referenciado ─────────────────────────
test('MIIADT-E2E-2 — v2-design-system.css referenciado en head', () => {
  expect(SOURCE_HTML).toContain('assets/v2-design-system.css');
});

// ── MIIADT-E2E-3 — nav: logo + botones ───────────────────────────────────────
test('MIIADT-E2E-3 — nav tiene logo MIIADT y botones login/signup', () => {
  expect(SOURCE_HTML).toContain('class="mdt-logo"');
  expect(SOURCE_HTML).toContain('MIIA');
  expect(SOURCE_HTML).toContain('id="btn-login"');
  expect(SOURCE_HTML).toContain('id="btn-signup"');
  expect(SOURCE_HTML).toContain('Iniciar sesion');
  expect(SOURCE_HTML).toContain('Jugar ahora');
});

// ── MIIADT-E2E-4 — hero badge + headline ─────────────────────────────────────
test('MIIADT-E2E-4 — hero badge "Fantasy Football LATAM #1" y headline', () => {
  expect(SOURCE_HTML).toContain('Fantasy Football LATAM #1');
  expect(SOURCE_HTML).toContain('class="mdt-hero"');
  expect(SOURCE_HTML).toContain('class="grad"');
  expect(SOURCE_HTML).toContain('te hace vibrar');
});

// ── MIIADT-E2E-5 — hero CTA "Empezar gratis" → handleNav signup ──────────────
test("MIIADT-E2E-5 — hero CTA 'Empezar gratis' llama handleNav('signup')", () => {
  expect(SOURCE_HTML).toContain("onclick=\"handleNav('signup')\"");
  expect(SOURCE_HTML).toContain('Empezar gratis');
});

// ── MIIADT-E2E-6 — "Ver funciones" → scrollTo features ───────────────────────
test("MIIADT-E2E-6 — 'Ver funciones' llama scrollTo('features')", () => {
  expect(SOURCE_HTML).toContain("onclick=\"scrollTo('features')\"");
  expect(SOURCE_HTML).toContain('Ver funciones');
});

// ── MIIADT-E2E-7 — stats strip ───────────────────────────────────────────────
test('MIIADT-E2E-7 — stats strip tiene 50K+, 500+, 20+', () => {
  expect(SOURCE_HTML).toContain('50K+');
  expect(SOURCE_HTML).toContain('Managers activos');
  expect(SOURCE_HTML).toContain('500+');
  expect(SOURCE_HTML).toContain('Ligas activas');
  expect(SOURCE_HTML).toContain('20+');
  expect(SOURCE_HTML).toContain('Ligas soportadas');
});

// ── MIIADT-E2E-8 — 6 feature cards ───────────────────────────────────────────
test('MIIADT-E2E-8 — hay exactamente 6 feature cards', () => {
  const matches = SOURCE_HTML.match(/class="mdt-feature-card"/g);
  expect(matches).not.toBeNull();
  expect(matches?.length).toBe(6);
});

// ── MIIADT-E2E-9 — feature card titles ───────────────────────────────────────
test('MIIADT-E2E-9 — los 6 títulos de feature cards son correctos', () => {
  expect(SOURCE_HTML).toContain('Mercado de transferencias');
  expect(SOURCE_HTML).toContain('Ligas y copas');
  expect(SOURCE_HTML).toContain('Estadisticas avanzadas');
  expect(SOURCE_HTML).toContain('IA coach MIIA');
  expect(SOURCE_HTML).toContain('Draft en vivo');
  expect(SOURCE_HTML).toContain('WhatsApp nativo');
});

// ── MIIADT-E2E-10 — pricing card: nombre + precio ────────────────────────────
test('MIIADT-E2E-10 — pricing card muestra MIIADT Premium + USD 9.99', () => {
  expect(SOURCE_HTML).toContain('MIIADT Premium');
  expect(SOURCE_HTML).toContain('MAS POPULAR');
  expect(SOURCE_HTML).toContain('9.99');
  expect(SOURCE_HTML).toContain('USD');
  expect(SOURCE_HTML).toContain('por mes');
});

// ── MIIADT-E2E-11 — 7 pricing feature items ──────────────────────────────────
test('MIIADT-E2E-11 — pricing lista tiene 7 items incluidos', () => {
  expect(SOURCE_HTML).toContain('Ligas ilimitadas');
  expect(SOURCE_HTML).toContain('Mercado de transferencias completo');
  expect(SOURCE_HTML).toContain('Estadisticas avanzadas + xG');
  expect(SOURCE_HTML).toContain('IA coach MIIA por WhatsApp');
  expect(SOURCE_HTML).toContain('Draft en vivo');
  expect(SOURCE_HTML).toContain('Copas y torneos');
  expect(SOURCE_HTML).toContain('Alertas push + WhatsApp');
  // Verify 7 <li> items inside pricing card
  const pricingSection = SOURCE_HTML.slice(
    SOURCE_HTML.indexOf('id="pricing"'),
    SOURCE_HTML.indexOf('<!-- Footer -->')
  );
  const liItems = pricingSection.match(/<li>/g);
  expect(liItems?.length).toBe(7);
});

// ── MIIADT-E2E-12 — pricing CTA → handleNav signup ───────────────────────────
test("MIIADT-E2E-12 — pricing CTA 'Empezar ahora' llama handleNav('signup')", () => {
  expect(SOURCE_HTML).toContain('class="btn-mdt-primary mdt-pricing-cta"');
  expect(SOURCE_HTML).toContain('Empezar ahora');
  // El onclick del pricing CTA invoca handleNav('signup')
  const pricingCta = SOURCE_HTML.match(/class="btn-mdt-primary mdt-pricing-cta"[^>]*onclick="([^"]+)"/);
  expect(pricingCta?.[1]).toContain("handleNav('signup')");
});

// ── MIIADT-E2E-13 — sin Stripe ────────────────────────────────────────────────
test('MIIADT-E2E-13 — no hay ninguna referencia a Stripe', () => {
  expect(SOURCE_HTML.toLowerCase()).not.toContain('stripe');
});

// ── MIIADT-E2E-14 — paleta accent #7C3AED + #00E5FF ─────────────────────────
test('MIIADT-E2E-14 — colores accent #7C3AED y #00E5FF presentes en CSS', () => {
  expect(SOURCE_HTML).toContain('#7C3AED');
  expect(SOURCE_HTML).toContain('#00E5FF');
  // Al menos 3 ocurrencias de cada uno (var CSS + gradientes)
  expect(SOURCE_HTML.match(/#7C3AED/g)?.length).toBeGreaterThanOrEqual(3);
  expect(SOURCE_HTML.match(/#00E5FF/g)?.length).toBeGreaterThanOrEqual(3);
});

// ── MIIADT-E2E-15 — script miiadt-land.js referenciado ───────────────────────
test('MIIADT-E2E-15 — script miiadt-land.js referenciado antes de </body>', () => {
  expect(SOURCE_HTML).toContain('assets/miiadt-panels/miiadt-land.js');
  // Debe estar antes de </body>
  const scriptIdx = SOURCE_HTML.indexOf('miiadt-land.js');
  const bodyCloseIdx = SOURCE_HTML.indexOf('</body>');
  expect(scriptIdx).toBeLessThan(bodyCloseIdx);
});

// ── MIIADT-E2E-16 — footer copyright ─────────────────────────────────────────
test('MIIADT-E2E-16 — footer tiene copyright 2026 MIIA', () => {
  expect(SOURCE_HTML).toContain('2026 MIIA');
  expect(SOURCE_HTML).toContain('MIIADT Fantasy Football');
  expect(SOURCE_HTML).toContain('class="mdt-footer"');
});

// ── MIIADT-E2E-17 — sección features con id correcto ─────────────────────────
test('MIIADT-E2E-17 — sección features tiene id="features"', () => {
  expect(SOURCE_HTML).toContain('id="features"');
});

// ── MIIADT-E2E-18 — sección pricing con id correcto ──────────────────────────
test('MIIADT-E2E-18 — sección pricing tiene id="pricing"', () => {
  expect(SOURCE_HTML).toContain('id="pricing"');
});
