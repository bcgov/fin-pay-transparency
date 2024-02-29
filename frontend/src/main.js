import { createApp } from 'vue';
import { createVuetify } from 'vuetify/dist/vuetify';
import { createMetaManager } from 'vue-meta';
import App from './App.vue';
import router from './router';
import 'regenerator-runtime/runtime';
import { createPinia } from 'pinia';
import * as colors from 'vuetify/lib/util/colors';
import styles from 'vuetify/styles';
import * as labs from 'vuetify/labs/components';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { fa } from 'vuetify/iconsets/fa';
import '@fortawesome/fontawesome-free/css/all.css';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import '@mdi/font/css/materialdesignicons.css';
import 'viewerjs/dist/viewer.css';
import component from 'v-viewer';
import VueDOMPurifyHTML from 'vue-dompurify-html';

const myCustomLightTheme = {
  dark: false,
  colors: {
    primary: '#003366',
    secondary: '#385a8a',
    error: '#712024',
    warning: '#81692c',
    success: '#234720',
  },
};

const vuetify = createVuetify({
  options: {
    customProperties: true,
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      fa,
      mdi,
    },
  },
  theme: {
    defaultTheme: 'myCustomLightTheme',
    themes: {
      myCustomLightTheme,
    },
  },
  components: {
    ...labs,
    ...components,
    ...directives,
    ...styles,
    ...colors,
  },
});
const pinia = createPinia();

const newApp = createApp(App);

newApp
  .use(router)
  .use(createMetaManager())
  .use(pinia)
  .use(vuetify)
  .use(component)
  .use(VueDOMPurifyHTML, {
    default: {
      FORCE_BODY: true,
      ADD_TAGS: ['style'], // Allow style tags
      ADD_ATTR: ['style'], // Allow style attributes
    },
  })
  .mount('#app');
