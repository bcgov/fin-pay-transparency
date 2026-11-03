import '@bcgov/vuetify-theme/styles/index.css';
import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import { bcdsBlueprint } from '@bcgov/vuetify-theme';
import 'vuetify/styles';
import { createMetaManager } from 'vue-meta';
import App from './App.vue';
import router from './router.js';
import 'regenerator-runtime/runtime';
import { createPinia } from 'pinia';
import 'viewerjs/dist/viewer.css';
import component from 'v-viewer';
import VueDOMPurifyHTML from 'vue-dompurify-html';
import { VBtn } from 'vuetify/components';

const vuetify = createVuetify({
  blueprint: bcdsBlueprint,
  aliases: {
    VBtnPrimary: VBtn,
    VBtnSecondary: VBtn,
  },
  defaults: {
    VBtnPrimary: {
      color: 'primary',
      variant: 'flat',
    },
    VBtnSecondary: {
      variant: 'outlined',
      class: 'bg-background',
    },
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
