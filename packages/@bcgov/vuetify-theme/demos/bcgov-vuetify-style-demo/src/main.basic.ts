import "@bcgov/vuetify-theme/styles/index.basic.css";
import { createApp } from "vue";
import App from "./App.basic.vue";
import vuetify from "./plugins/vuetify.basic.ts";

createApp(App).use(vuetify).mount("#app");
