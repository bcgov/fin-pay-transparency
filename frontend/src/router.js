import {createRouter, createWebHistory} from 'vue-router';
import Home from './components/Home.vue';
import ErrorPage from './components/ErrorPage.vue';
import {appStore} from './store/modules/app';


// a comment for commit.
const router = createRouter({
  history: createWebHistory(),
  base: import.meta.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: {
        pageTitle: "home"
      },

    },
    {
      path: '/error',
      name: 'error',
      component: ErrorPage
    },
  ]
});

router.beforeEach((to, _from, next) => {
  const apStore = appStore();
  if (to && to.meta) {
    apStore.setPageTitle(to.meta.pageTitle);
  } else {
    apStore.setPageTitle('');
  }
  next();
});
export default router;
