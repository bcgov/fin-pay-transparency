import { screen, waitFor } from '@testing-library/vue';
import { renderInVAppWithPlugins } from '../../test-utils/vuetify';
import Header from '../Header.vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestPlugins } from '../../test-utils/vuetify';
import { authStore } from '../../store/modules/auth';
const plugins = createTestPlugins();
const pinia = plugins.pinia;
const wrappedRender = async () => {
  return renderInVAppWithPlugins(Header, {
    global: {
      plugins: plugins.plugins,
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
