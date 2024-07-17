import { vi, beforeEach, describe, it, expect } from 'vitest';
import UserManagementPage from '../UserManagementPage.vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';
import { useUsersStore } from '../../store/modules/usersStore';
import { authStore } from '../../store/modules/auth';
import { render, waitFor } from '@testing-library/vue';

global.ResizeObserver = require('resize-observer-polyfill');

const mockGetUsers = vi.fn();
vi.mock('../../../services/apiService', () => ({
  default: {
    getUsers: () => mockGetUsers(),
  },
}));

const vuetify = createVuetify({
  components,
  directives,
});

const pinia = createTestingPinia({
  initialState: {},
});

const wrappedRender = () => {
  return render(UserManagementPage, {
    global: {
      plugins: [pinia, vuetify],
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
