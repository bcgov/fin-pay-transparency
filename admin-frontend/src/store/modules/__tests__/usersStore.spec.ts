import { beforeEach, describe, it, expect, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUsersStore } from '../usersStore';

const mockGetUsers = vi.fn();
const mockAddUser = vi.fn();
vi.mock('../../../services/apiService', () => ({
  default: {
    getUsers: () => {
      return mockGetUsers();
    },
    addUser: () => mockAddUser(),
  },
}));

describe('usersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  describe('defaults', () => {
    it('should default loading  to false', () => {
      const store = useUsersStore();
      expect(store.loading).toBe(false);
    });
    it('should default users list to undefined', () => {
      const store = useUsersStore();
      expect(store.users).toBe(undefined);
    });
  });

  describe('actions', () => {
    it('should get users', async () => {
      const store = useUsersStore();
      mockGetUsers.mockResolvedValueOnce([{ id: 1, name: 'John' }]);
      await store.getUsers();
      expect(mockGetUsers).toHaveBeenCalled();
    });

    it('should add user', async () => {
      const store = useUsersStore();
      mockAddUser.mockResolvedValueOnce({});
      const input = {
        firstName: 'Jane',
        email: 'user@example.com',
        role: 'admin',
      };
      await store.addUser(input);
      expect(mockAddUser).toHaveBeenCalled();
    });
  });
});
