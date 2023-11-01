import {createRouter, createWebHistory} from 'vue-router';
import Home from './components/Home.vue';
import GenerateReport from './components/GenerateReport.vue';
import ErrorPage from './components/ErrorPage.vue';
import {appStore} from './store/modules/app';
import {PAGE_TITLES} from './utils/constant';
import Login from './components/Login.vue';
import {authStore} from './store/modules/auth';


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
        pageTitle: PAGE_TITLES.DASHBOARD,
        requiresAuth: true
      },

    },
    {
      path: '/error',
      name: 'error',
      component: ErrorPage
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: {
        pageTitle: PAGE_TITLES.LOGIN,
        requiresAuth: false
      }
    },
    {
      path: '/GenerateReport',
      name: 'GenerateReport',
      component: GenerateReport,
      meta: {
        pageTitle: PAGE_TITLES.REPORT,
        requiresAuth: false
      }
    },
  ]
});

router.beforeEach((to, _from, next) => {
  const aStore = authStore();
  const apStore = appStore();
  // this section is to set page title in vue store
  if (to.meta.requiresAuth) {
    aStore.getJwtToken().then(() => {
      if (!aStore.isAuthenticated) {
        next('/token-expired');
      } else {
        aStore.getUserInfo().then(() => {
            if(true){//something to check if user is authorized to view this page
              next();
            }
        }).catch(() => {
          next('error');
        });
      }
    }).catch(() => {
      if (!aStore.userInfo) {
        next('/login');
      }else{
        next('/token-expired');
      }
    });
  }
  else{
    if (!aStore.userInfo) {
      next();
    }
    if (to && to.meta) {
      apStore.setPageTitle(to.meta.pageTitle);
    } else {
      apStore.setPageTitle('');
    }
    next();
  }
});
export default router;
