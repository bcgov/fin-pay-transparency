import { createTestingPinia } from '@pinia/testing';
import { render, screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import { authStore } from '../../store/modules/auth';
import Header from '../Header.vue';

const pinia = createTestingPinia();
const vuetify = createVuetify();
const wrappedRender = async () => {
  return render(Header, {
    global: {
      plugins: [pinia, vuetify],
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
});
