import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from './components/DashboardPage.vue';
import ReportsPage from './components/ReportsPage.vue';
import AnnouncementsPage from './components/AnnouncementsPage.vue';
import UserManagementPage from './components/UserManagementPage.vue';
import AnalyticsPage from './components/AnalyticsPage.vue';
import ErrorPage from './components/ErrorPage.vue';
import NotFoundPage from './components/NotFound.vue';
import LoginError from './components/LoginError.vue';
import TokenExpired from './components/TokenExpired.vue';
import { appStore } from './store/modules/app';
import { PAGE_TITLES } from './utils/constant';
import Login from './components/Login.vue';
import { authStore } from './store/modules/auth';
import Logout from './components/Logout.vue';
import { ADMIN_ROLE_NAME } from './constants';

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
      component: DashboardPage,
      meta: {
        pageTitle: PAGE_TITLES.DASHBOARD,
        requiresAuth: true,
        isTitleVisible: true,
      },
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsPage,
      meta: {
        pageTitle: PAGE_TITLES.REPORTS,
        requiresAuth: true,
        isTitleVisible: true,
        isBreadcrumbTrailVisible: true,
      },
    },
    {
      path: '/announcements',
      name: 'announcements',
      component: AnnouncementsPage,
      meta: {
        pageTitle: PAGE_TITLES.ANNOUNCEMENTS,
        requiresAuth: true,
        isTitleVisible: true,
        isBreadcrumbTrailVisible: true,
      },
    },
    {
      path: '/user-management',
      name: 'user-management',
      component: UserManagementPage,
      meta: {
        pageTitle: PAGE_TITLES.USER_MANAGEMENT,
        requiresAuth: true,
        role: ADMIN_ROLE_NAME,
        isTitleVisible: true,
        isBreadcrumbTrailVisible: true,
      },
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsPage,
      meta: {
        pageTitle: PAGE_TITLES.ANALYTICS,
        requiresAuth: true,
        isTitleVisible: true,
        isBreadcrumbTrailVisible: true,
      },
    },
    {
      // A route to show a general error for unrecoverable system failures
      path: '/error',
      name: 'error',
      component: ErrorPage,
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
          if (to.meta.role && aStore.userInfo?.role !== to.meta.role) {
            next('notfound')
          }
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

export default router;
