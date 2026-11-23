/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

const nodeVersion = Number(process.versions.node.split('.')[0]);

// https://vitejs.dev/config/
export default defineConfig({
  resolve: { preserveSymlinks: true },
  plugins: [
    vue({ template: { transformAssetUrls } }),
    Vuetify({ autoImport: true }),
  ],
  optimizeDeps: {
    include: [
      'vuetify/components/VOverlay',
      'vuetify/components/VDialog',
      'vuetify/components/VMenu',
      'vuetify/components/VSelect',
      'vuetify/components/VTooltip',
    ],
  },
  test: {
    environment: 'jsdom',
    server: { deps: { inline: ['vuetify'] } },
    globals: true,
    coverage: {
      reporter: ['lcov', 'text-summary', 'text', 'json', 'html'],
      exclude: ['src/**/index.ts'],
    },
    include: ['./src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['./src/vitest.setup.ts'],
    // fix errors with localStorage in jsdom on Node v25. Causes globalThis.localStorage to be undefined instead of an empty object.
    // Node 25+ supports this flag; older Node versions reject it when starting workers.
    execArgv: nodeVersion >= 25 ? ['--no-webstorage'] : [],
    exclude: ['./e2e/**'],
    mockReset: true,
  },
  server: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public',
});
