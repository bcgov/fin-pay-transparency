import "@bcgov/vuetify-theme/styles/index.css";
import { createApp } from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";

createApp(App).use(vuetify).mount("#app");