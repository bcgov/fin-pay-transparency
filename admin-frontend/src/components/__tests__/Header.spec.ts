import { createTestingPinia } from '@pinia/testing';
import { render, screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import router from '../../router';
import { authStore } from '../../store/modules/auth';
import Header from '../Header.vue';

const pinia = createTestingPinia();
const vuetify = createVuetify();

const routes = router.getRoutes();
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: routes,
});

const wrappedRender = async () => {
  return render(Header, {
    global: {
      plugins: [pinia, vuetify, mockRouter],
    },
  });
};

const mockUserInfo = {
  displayName: 'Test user',
  legalName: 'Test legal',
};

const auth = authStore();

describe('Header', () => {
  describe('when authenticated', () => {
    beforeEach(() => {
      auth.$patch({
        isAuthenticated: true,
        userInfo: mockUserInfo,
      });
      vi.clearAllMocks();
    });

    it('should render correctly', async () => {
      await wrappedRender();
      screen.debug();
      expect(screen.getByTestId('account-info')).toHaveTextContent(
        mockUserInfo.displayName,
      );
      expect(screen.getByTestId('logout-btn')).toHaveTextContent('Logout');
    });
  });

  describe('when route has a pageTitle but not sectionTitle', () => {
    it('route pageTitle is shown', async () => {
      const { getByText } = await wrappedRender();
      const route = routes.find((r) => r.name == 'announcements'); //this route doesn't have a section title
      await mockRouter.push({ name: route.name });
      await nextTick();
      const expectedTitle = route.meta.sectionTitle
        ? route.meta.sectionTitle
        : route.meta.pageTitle;
      expect(getByText(expectedTitle)).toBeInTheDocument();
    });
  });
  describe('when route has a sectionTitle', () => {
    it('route sectionTitle is shown (not pageTitle)', async () => {
      const { getByText } = await wrappedRender();
      const route = routes.find((r) => r.name == 'add-announcement'); //this route has a section title
      await mockRouter.push({ name: route.name });
      await nextTick();
      const expectedTitle = route.meta.sectionTitle
        ? route.meta.sectionTitle
        : route.meta.pageTitle;
      expect(getByText(expectedTitle)).toBeInTheDocument();
    });
  });
});
