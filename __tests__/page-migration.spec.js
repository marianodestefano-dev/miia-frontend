const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const PAGES_MIGRATED = [
  'admin-dashboard.html',
  'login.html',
  'index.html',
  'agent-dashboard.html',
  'businesses.html',
  'contacts.html',
  'documents.html',
  'about.html',
  'features.html',
  'empresas.html',
  'privacy.html',
  'terms.html',
  'cookies.html',
];

for (const page of PAGES_MIGRATED) {
  test(`F4 migrated: ${page} importa v2-design-system.css`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    expect(html).toContain('assets/v2-design-system.css');
  });

  test(`F4 migrated: ${page} estructura HTML valida`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    expect((html.match(/<\/body>/g) || []).length).toBe(1);
    expect((html.match(/<\/html>/g) || []).length).toBe(1);
    expect(html).toContain('<head>');
  });
}
