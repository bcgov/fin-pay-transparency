import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from './components/DashboardPage.vue';
import ReportsPage from './components/ReportsPage.vue';
import AnnouncementsPage from './components/AnnouncementsPage.vue';
import AddAnnouncementPage from './components/AddAnnouncementPage.vue';
import EditAnnouncementPage from './components/EditAnnouncementPage.vue';
import UserManagementPage from './components/UserManagementPage.vue';
import InvitationExpired from './components/InvitationExpired.vue';
import UnauthorizedError from './components/UnauthorizedError.vue';
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
import { ADMIN_ROLE_NAME, USER_ROLE_NAME } from './constants';

const baseBreadcrumb = 'dashboard';

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
        requiresRole: USER_ROLE_NAME,
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
        requiresRole: USER_ROLE_NAME,
        isTitleVisible: true,
        breadcrumbs: [baseBreadcrumb],
      },
    },
    {
      path: '/announcements',
      name: 'announcements',
      component: AnnouncementsPage,
      meta: {
        pageTitle: PAGE_TITLES.ANNOUNCEMENTS,
        requiresAuth: true,
        requiresRole: USER_ROLE_NAME,
        isTitleVisible: true,
        breadcrumbs: [baseBreadcrumb],
      },
    },
    {
      path: '/add-announcement',
      name: 'add-announcement',
      component: AddAnnouncementPage,
      meta: {
        sectionTitle: PAGE_TITLES.ANNOUNCEMENTS,
        pageTitle: PAGE_TITLES.ADD_ANNOUNCEMENT,
        requiresAuth: true,
        requiresRole: USER_ROLE_NAME,
        isTitleVisible: true,
        breadcrumbs: [baseBreadcrumb, 'announcements'],
      },
    },
    {
      path: '/edit-announcement',
      name: 'edit-announcement',
      component: EditAnnouncementPage,
      meta: {
        sectionTitle: PAGE_TITLES.ANNOUNCEMENTS,
        pageTitle: PAGE_TITLES.EDIT_ANNOUNCEMENT,
        requiresAuth: true,
        requiresRole: USER_ROLE_NAME,
        isTitleVisible: true,
        breadcrumbs: [baseBreadcrumb, 'announcements'],
      },
    },
    {
      path: '/user-management',
      name: 'user-management',
      component: UserManagementPage,
      meta: {
        pageTitle: PAGE_TITLES.USER_MANAGEMENT,
        requiresAuth: true,
        requiresRole: ADMIN_ROLE_NAME,
        isTitleVisible: true,
        breadcrumbs: [baseBreadcrumb],
      },
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsPage,
      meta: {
        pageTitle: PAGE_TITLES.ANALYTICS,
        requiresAuth: true,
        requiresRole: USER_ROLE_NAME,
        isTitleVisible: true,
        breadcrumbs: [baseBreadcrumb],
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
      path: '/invitation-expired',
      name: 'invitation-expired',
      component: InvitationExpired,
      meta: {
        pageTitle: PAGE_TITLES.INVITATION_EXPIRED,
        requiresAuth: false,
      },
    },
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: UnauthorizedError,
      meta: {
        pageTitle: PAGE_TITLES.UNAUTHORIZED,
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
        requiresAuth: false,
      },
    },
  ],
});

router.beforeEach((to, _from, next) => {
  if (!to.meta.requiresAuth) {
    //Proceed normally to the requested route
    const apStore = appStore();
    apStore.setsectionTitle(to?.meta?.sectionTitle ?? '');
    next();
    return;
  }

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
          if (
            to.meta.requiresRole &&
            !aStore.doesUserHaveRole(to.meta.requiresRole)
          ) {
            next('notfound');
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
