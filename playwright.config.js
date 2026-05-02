// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './__tests__',
  timeout: 30000,
  use: {
    headless: true,
    screenshot: 'on',
    baseURL: process.env.TEST_URL || 'https://miiagames-production.up.railway.app',
  },
  reporter: [['list']],
});
