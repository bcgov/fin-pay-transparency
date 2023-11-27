import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue()
  ],
  test: {
    environment: "jsdom",
    deps: {
      inline: ["vuetify"],
    },
    globals: true,
    coverage: {
      reporter: ['lcov', 'text-summary','text', 'json', 'html'],
    }
  },
  server: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
    }
  },
  publicDir: 'public'
});
