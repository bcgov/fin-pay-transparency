import { vi, beforeEach, describe, it, expect } from 'vitest';
import UserManagementPage from '../UserManagementPage.vue';
import { createTestPlugins } from '../../test-utils/vuetify';
import { useUsersStore } from '../../store/modules/usersStore';
import { authStore } from '../../store/modules/auth';
import { waitFor } from '@testing-library/vue';
import { renderWithPlugins } from '../../test-utils/vuetify';

const mockGetUsers = vi.fn();
vi.mock('../../../services/apiService', () => ({
  default: {
    getUsers: () => mockGetUsers(),
  },
}));

const plugins = createTestPlugins({
  piniaOptions: { initialState: {} },
});
const pinia = plugins.pinia;

const wrappedRender = () => {
  return renderWithPlugins(UserManagementPage, {
    global: {
      plugins: plugins.plugins,
    },
  });
};

const store = useUsersStore();
const auth = authStore();

describe('UserManagementPage', () => {
  beforeEach(() => {
    store.$patch({
      loading: false,
      users: [],
    });
    auth.$patch({ userInfo: { id: 'someid', roles: ['PTRT-ADMIN'] } });
  });

  it('should display loading spinner', async () => {
    const wrapper = await wrappedRender();
    store.$patch({
      loading: true,
      users: [],
    });

    await waitFor(() => {
      wrapper.getByText('Loading users');
    });
  });
  it('should add user button', async () => {
    const wrapper = await wrappedRender();
    store.$patch({
      loading: false,
      users: [],
    });

    await waitFor(() => {
      wrapper.getByRole('button', { name: 'Add New User' });
    });
  });
  it('should display the number of users found', async () => {
    const wrapper = await wrappedRender();
    store.$patch({
      loading: false,
      users: [
        {
          userName: 'testusername',
          displayName: 'Test display name',
          roles: [],
          effectiveRole: 'PTRT-ADMIN',
        },
      ],
    });

    await waitFor(() => {
      wrapper.getByText('Users (1)');
    });
  });
  it('should user cards', async () => {
    const wrapper = await wrappedRender();
    store.$patch({
      loading: false,
      users: [
        {
          userName: 'testusername',
          displayName: 'Test Display FIN:EX',
          effectiveRole: 'PTRT-ADMIN',
          roles: [],
        },
      ],
    });

    await waitFor(() => {
      expect(wrapper.getByRole('button', { name: 'Delete user' }));
      expect(wrapper.getByText('Test Display FIN:EX')).toBeInTheDocument();
      expect(wrapper.getByRole('button', { name: 'Role Manager' }));
    });
  });
});
