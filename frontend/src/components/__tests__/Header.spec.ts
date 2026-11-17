import { screen, waitFor } from '@testing-library/vue';
import { renderWithPlugins } from '../../test-utils/vuetify';
import Header from '../Header.vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { authStore } from '../../store/modules/auth';
import { createTestVuetify } from '../../test-utils/vuetify';

const pinia = createTestingPinia();
const vuetify = createTestVuetify();
const wrappedRender = async () => {
  return renderWithPlugins(Header, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

const auth = authStore();

describe('Header', () => {
  describe('when authenticated', () => {
    beforeEach(() => {
      auth.$patch({
        isAuthenticated: true,
        userInfo: {
          displayName: 'Test user',
          legalName: 'Test legal',
        },
      });
      vi.clearAllMocks();
    });

    it('should render correctly', async () => {
      await wrappedRender();
      screen.debug();
      expect(screen.getByTestId('header-title')).toHaveTextContent(
        'Pay Transparency Reporting',
      );
    });
  });
});
