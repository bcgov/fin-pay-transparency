import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

export default defineConfig(() => {
  return {
    build: {
      rollupOptions: {
        input: "./index.html",
      },
    },
    resolve: {
      preserveSymlinks: true,
    },
    plugins: [
      vue(),
      vuetify({
        autoImport: true,
        styles: {
          configFile: "node_modules/@bcgov/vuetify-theme/src/styles/settings.scss",
        },
      }),
    ],
  };
});