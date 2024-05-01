import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/Home.vue';
import InputForm from './components/InputForm.vue';
import ErrorPage from './components/ErrorPage.vue';
import NotFoundPage from './components/NotFound.vue';
import PublishedReportPage from './components/PublishedReportPage.vue';
import DraftReportPage from './components/DraftReportPage.vue';
import LoginError from './components/LoginError.vue';
import TokenExpired from './components/TokenExpired.vue';
import ContactError from './components/ContactError.vue';
import { appStore } from './store/modules/app';
import { PAGE_TITLES } from './utils/constant';
import Login from './components/Login.vue';
import { authStore } from './store/modules/auth';
import Logout from './components/Logout.vue';

const router = createRouter({
  history: createWebHistory(),
  base: import.meta.env.BASE_URL,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
  routes: [
    {
      path: '/',
      redirect: 'dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Home,
      meta: {
        pageTitle: PAGE_TITLES.DASHBOARD,
        requiresAuth: true,
      },
    },
    {
      // A route to show a general error for unrecoverable system failures
      path: '/error',
      name: 'error',
      component: ErrorPage,
    },
    {
      // A route to show an error when the user must contact support
      path: '/contact-error',
      name: 'contact-error',
      component: ContactError,
    },
    {
      // A route to show an error specifically related to failed logins
      path: '/login-error',
      name: 'login-error',
      component: LoginError,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: {
        pageTitle: PAGE_TITLES.LOGIN,
        requiresAuth: false,
      },
    },
    {
      path: '/logout',
      name: 'logout',
      component: Logout,
    },
    {
      path: '/token-expired',
      name: 'TokenExpired',
      component: TokenExpired,
      meta: {
        pageTitle: PAGE_TITLES.TOKEN_EXPIRED,
        requiresAuth: false,
      },
    },
    {
      path: '/generate-report-form',
      name: 'GenerateReportForm',
      component: InputForm,
      meta: {
        pageTitle: PAGE_TITLES.REPORT,
        requiresAuth: true,
      },
    },
    {
      path: '/draft-report',
      name: 'DraftReportPage',
      component: DraftReportPage,
      meta: {
        pageTitle: PAGE_TITLES.REPORT,
        requiresAuth: true,
      },
    },
    {
      path: '/published-report',
      name: 'PublishedReportPage',
      component: PublishedReportPage,
      meta: {
        pageTitle: PAGE_TITLES.REPORT,
        requiresAuth: true,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFoundPage,
      meta: {
        requiresAuth: true,
      },
    },
  ],
});

router.beforeEach((to, _from, next) => {
  // this section is to set page title in vue store
  if (!to.meta.requiresAuth) {
    //Proceed normally to the requested route
    const apStore = appStore();
    apStore.setPageTitle(to?.meta?.pageTitle ?? '');
    next();
    return;
  }

  // requires bceid info
  const aStore = authStore();

  aStore
    .getJwtToken()
    .then(() => {
      if (!aStore.isAuthenticated) {
        next('/token-expired');
        return;
      }

      aStore
        .getUserInfo()
        .then(() => {
          next();
        })
        .catch(() => {
          next('error');
        });
    })
    .catch(() => {
      if (!aStore.userInfo) {
        next('/login');
      } else {
        next('/token-expired');
      }
    });
});

router.afterEach((to, from) => {
  // Tell snowplow that the URL changed.  Snowplow will
  // record the event as a 'PageView' associated with the
  // new URL (which it reads from document.referrer).
  window.snowplow('trackPageView');
});

export default router;
