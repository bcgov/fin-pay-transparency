import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    globals: true,
    coverage: {
      reporter: ['lcov', 'text-summary', 'text', 'json', 'html'],
      exclude: ['src/**/index.ts'],
    },
    include: ['./src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['./src/vitest.setup.ts'],
    exclude: ['./e2e/**'],
  },
  server: {
    port: 8084,
    proxy: {
      '/admin-api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      },
      '/clamav-api': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        headers: {
          'x-api-key': 'default',
        },
      },
    },
  },
  publicDir: 'public',
});
