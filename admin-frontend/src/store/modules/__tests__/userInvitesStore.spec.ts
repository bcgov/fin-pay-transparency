import { beforeEach, describe, it, expect, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useInvitesStore } from '../userInvitesStore';

const mockGetPendingUserInvites = vi.fn();
const mockAddInvite = vi.fn();
const mockDeleteInvite = vi.fn();
const mockResendInvite = vi.fn();
vi.mock('../../../services/apiService', () => ({
  default: {
    getPendingUserInvites: () => {
      return mockGetPendingUserInvites();
    },
    inviteUser: (...args) => mockAddInvite(...args),
    deleteUserInvite: (...args) => mockDeleteInvite(...args),
    resendUserInvite: (...args) => mockResendInvite(...args),
  },
}));

describe('userInvitesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  describe('defaults', () => {
    it('should default loading  to false', () => {
      const store = useInvitesStore();
      expect(store.loading).toBe(false);
    });
    it('should default users list to undefined', () => {
      const store = useInvitesStore();
      expect(store.invites).toBe(undefined);
    });
  });

  describe('actions', () => {
    describe('getInvites', () => {
      it('should get invites', async () => {
        const store = useInvitesStore();
        mockGetPendingUserInvites.mockResolvedValueOnce([
          { id: 1, name: 'John' },
        ]);
        await store.getInvites();
        expect(mockGetPendingUserInvites).toHaveBeenCalled();
      });
    });

    describe('addInvite', () => {
      it('should add user', async () => {
        const store = useInvitesStore();
        mockAddInvite.mockResolvedValueOnce({});
        const input = {
          firstName: 'Jane',
          email: 'user@example.com',
          role: 'admin',
        };
        await store.addInvite(input);
        expect(mockAddInvite).toHaveBeenCalled();
        expect(mockGetPendingUserInvites).toHaveBeenCalled();
      });
    });

    describe('resendInvite', () => {
      it('should resend invite', async () => {
        mockResendInvite.mockResolvedValueOnce([{ id: 1, name: 'John' }]);
        const store = useInvitesStore();
        await store.resendInvite('1');
        expect(mockResendInvite).toHaveBeenCalledWith('1');
      });
    });

    describe('deleteInvite', () => {
      it('should delete invite', async () => {
        const store = useInvitesStore();
        mockDeleteInvite.mockResolvedValueOnce([{ id: 1, name: 'John' }]);
        await store.deleteInvite('1');
        expect(mockDeleteInvite).toHaveBeenCalledWith('1');
        expect(mockGetPendingUserInvites).toHaveBeenCalled();
      });
    });
  });
});
