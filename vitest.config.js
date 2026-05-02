import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['assets/ludomiia-panels/**/*.js'],
      exclude: ['**/*.config.js', '**/__tests__/**', '**/node_modules/**'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
        perFile: false,
      },
    },
  },
});
