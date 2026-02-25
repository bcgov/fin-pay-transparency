import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      reporter: ['lcov', 'text-summary', 'text', 'json', 'html'],
      exclude: ['src/**/index.ts'],
    },
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.{test,spec}.ts'],
          mockReset: true,
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/**/*.{test,spec}.ts'],
        },
      },
    ],
  },
});
