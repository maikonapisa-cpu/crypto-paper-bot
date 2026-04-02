import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@crypto-paper-bot/shared-types': resolve(__dirname, 'packages/shared-types/src/index.ts'),
      '@crypto-paper-bot/market-data': resolve(__dirname, 'packages/market-data/src/index.ts'),
      '@crypto-paper-bot/strategy-engine': resolve(__dirname, 'packages/strategy-engine/src/index.ts'),
      '@crypto-paper-bot/paper-execution': resolve(__dirname, 'packages/paper-execution/src/index.ts'),
      '@crypto-paper-bot/risk-engine': resolve(__dirname, 'packages/risk-engine/src/index.ts'),
      '@crypto-paper-bot/analytics': resolve(__dirname, 'packages/analytics/src/index.ts'),
    },
  },
});
