import { beforeEach, describe, it, expect, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUsersStore } from '../usersStore';

const mockGetUsers = vi.fn();
vi.mock('../../services/apiService', () => ({
  default: {
    getUsers: () => mockGetUsers(),
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
});
