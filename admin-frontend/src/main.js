import '@bcgov/vuetify-theme/styles';
import { bcdsBlueprint } from '@bcgov/vuetify-theme/blueprint';
import { createApp } from 'vue';
import { createVuetify } from 'vuetify/dist/vuetify';
import { createMetaManager } from 'vue-meta';
import App from './App.vue';
import router from './router';
import 'regenerator-runtime/runtime';
import { createPinia } from 'pinia';
import 'vuetify/styles';
import 'viewerjs/dist/viewer.css';
import component from 'v-viewer';
import VueDOMPurifyHTML from 'vue-dompurify-html';

const vuetify = createVuetify({ blueprint: bcdsBlueprint });

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
