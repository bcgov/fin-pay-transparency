import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render } from '@testing-library/vue';
import Dashboard from '../Dashboard.vue';
import { createTestingPinia } from '@pinia/testing';
import { authStore } from '../../store/modules/auth';

//mock window.config
Object.defineProperty(window, 'config', {
  value: {},
});

const pinia = createTestingPinia();
const mockRouterPush = vi.fn();
const mockRouter = {
  push: (...args) => mockRouterPush(...args),
};

vi.mock('../../common/apiService', () => ({
  default: {
    getReports: async () => {
      return [];
    },
  },
}));

const wrappedRender = async () => {
  return render(Dashboard, {
    global: {
      plugins: [pinia],
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
