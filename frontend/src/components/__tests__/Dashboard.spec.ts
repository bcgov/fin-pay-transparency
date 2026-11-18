import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTestPlugins,
  renderWithPlugins,
} from '../../test-utils/vuetify.ts';
import { authStore } from '../../store/modules/auth';
import Dashboard from '../Dashboard.vue';

//mock window.config
Object.defineProperty(window, 'config', {
  value: {},
});

const plugins = createTestPlugins();
const pinia = plugins.pinia;
const mockRouterPush = vi.fn();
const mockRouter = {
  push: (...args) => mockRouterPush(...args),
};

vi.mock('../../common/apiService', () => ({
  default: {
    getReports: async () => {
      return [];
    },
    getAnnouncements: async () => {
      return [];
    },
  },
}));

const wrappedRender = async () => {
  return renderWithPlugins(Dashboard, {
    global: {
      plugins: plugins.plugins,
      mocks: {
        $router: mockRouter,
      },
    },
  });
};

const auth = authStore();

describe('Dashboard', () => {
  beforeEach(() => {
    auth.$patch({ userInfo: { legalName: 'Test' } } as any);
    vi.clearAllMocks();
  });

  it('should user name', async () => {
    const { getByTestId } = await wrappedRender();
    expect(getByTestId('legal-name')).toHaveTextContent('Welcome, Test');
  });
});
